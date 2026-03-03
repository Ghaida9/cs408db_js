import { invokeLlama, HF_MODEL, HF_PROVIDER } from "./llama.js";

/** The active LLM model used for answer evaluation */
export const EVAL_MODEL = HF_MODEL;
export const EVAL_PROVIDER = HF_PROVIDER;

// ─── Utility: Levenshtein distance ───────────────────────────────────────────

/**
 * Calculate the Levenshtein edit distance between two strings.
 * Used only as a lightweight pre-filter before calling the LLM.
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
function levenshteinDistance(a, b) {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j - 1], dp[i][j - 1], dp[i - 1][j]);
    }
  }
  return dp[m][n];
}

// ─── Fast-path: exact / near-exact variation check ───────────────────────────

/**
 * Check whether the user's answer is an exact or near-exact match against the
 * short answer or any accepted variation.  This is a cheap pre-filter — if it
 * fires we skip the LLM entirely and award full marks immediately.
 *
 * @param {string} userAnswer
 * @param {string} shortAnswer
 * @param {string[]} acceptedVariations
 * @returns {{ matched: boolean, score: number, matchedVariation?: string }}
 */
function checkVariationMatch(userAnswer, shortAnswer, acceptedVariations) {
  const user = userAnswer.toLowerCase().trim();
  const targets = [shortAnswer, ...acceptedVariations];

  for (const target of targets) {
    const tgt = target.toLowerCase().trim();

    // Exact match
    if (user === tgt) return { matched: true, score: 100, matchedVariation: target };

    // Typo tolerance: ≤ 2 edits on short strings
    const dist = levenshteinDistance(user, tgt);
    const maxLen = Math.max(user.length, tgt.length);
    if (dist <= 2 && maxLen <= 25)
      return { matched: true, score: 100, matchedVariation: target };

    // Substring containment with high overlap ratio
    if (tgt.includes(user) || user.includes(tgt)) {
      const ratio =
        Math.min(user.length, tgt.length) / Math.max(user.length, tgt.length);
      if (ratio >= 0.8)
        return { matched: true, score: 100, matchedVariation: target };
    }
  }

  return { matched: false, score: 0 };
}

// ─── Core: LLM teacher evaluation ────────────────────────────────────────────

/**
 * Ask the Llama model to evaluate the student's answer as a knowledgeable
 * database-systems teacher would.  The prompt explicitly instructs the model
 * to reward correct understanding expressed in different words and to give
 * full marks for semantically equivalent answers.
 *
 * @param {string} question
 * @param {string} userAnswer
 * @param {string} modelAnswer        Full reference answer
 * @param {string} shortAnswer        1-2 word key term
 * @param {string[]} acceptedVariations
 * @returns {Promise<{ score: number, reasoning: string, hint: string }>}
 */
async function getLLMScore(
  question,
  userAnswer,
  modelAnswer,
  shortAnswer,
  acceptedVariations
) {
  const variationsText =
    acceptedVariations.length > 0
      ? `Accepted synonyms / alternative phrasings: ${acceptedVariations.join(", ")}`
      : "";

  const systemPrompt = `You are an experienced and fair Database Systems professor marking a short-answer exam.

Your job is to decide whether the student has demonstrated correct understanding of the concept being tested.

Marking rules you MUST follow:
1. MEANING over WORDING — if the student expresses the correct concept in their own words, award full marks (90-100). Do NOT penalise paraphrasing, synonyms, or informal language.
2. ABBREVIATIONS & ACRONYMS — common abbreviations (e.g. "pk" for primary key, "tx" for transaction) are fully correct.
3. MINOR SPELLING — one or two character typos do not reduce the score.
4. PARTIAL UNDERSTANDING — if the student captures part of the concept correctly, award partial credit (40-70).
5. WRONG CONCEPT — if the student's answer is fundamentally incorrect or completely off-topic, award a low score (0-30).
6. NEVER penalise a student for not using the exact key term if their explanation clearly shows they understand the concept.

Always respond with ONLY a valid JSON object — no markdown, no extra text.`;

  const userPrompt = `Question asked to the student:
"${question}"

Reference answer (full explanation):
"${modelAnswer}"

Key term / short answer: "${shortAnswer}"
${variationsText}

Student's answer:
"${userAnswer}"

Evaluate the student's answer using the marking rules. Respond with this exact JSON:
{"score": <integer 0-100>, "reasoning": "<one sentence explaining your mark>", "hint": "<a helpful hint if score < 70, empty string otherwise>"}`;

  try {
    const response = await invokeLlama({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      maxTokens: 300,
      temperature: 0.0, // deterministic — we want consistent marking
    });

    const content = response.choices[0]?.message?.content ?? "";

    // Strip any markdown code fences the model may add
    const jsonMatch = content.match(/\{[\s\S]*?\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        score: Math.max(0, Math.min(100, Math.round(Number(parsed.score) || 0))),
        reasoning: String(parsed.reasoning || ""),
        hint: String(parsed.hint || ""),
      };
    }

    throw new Error(`No JSON found in model response: ${content.slice(0, 200)}`);
  } catch (error) {
    console.error("[Evaluation] LLM error:", error);
    // Graceful fallback — do not silently award 50; log clearly
    return {
      score: 50,
      reasoning: "AI evaluation temporarily unavailable; a default score has been applied.",
      hint: "Please review the topic and try again.",
    };
  }
}

// ─── Feedback generator ───────────────────────────────────────────────────────

/**
 * Convert a numeric score into a human-readable feedback message.
 * @param {number} score
 * @param {string} reasoning   One-sentence explanation from the LLM
 * @param {string} shortAnswer Key term for the question
 * @returns {string}
 */
function generateFeedback(score, reasoning, shortAnswer) {
  if (score >= 90)
    return `Excellent! ${reasoning}`;
  if (score >= 70)
    return `Good answer! ${reasoning}  The key concept here is "${shortAnswer}".`;
  if (score >= 40)
    return `Partial credit. ${reasoning}  Try to think about "${shortAnswer}".`;
  return `Not quite. ${reasoning}  The concept being tested is "${shortAnswer}".`;
}

// ─── Main exported evaluation function ───────────────────────────────────────

/**
 * Hybrid evaluation pipeline:
 *   1. Empty-answer guard
 *   2. Fast-path: exact / near-exact variation match → full marks, no LLM call
 *   3. Slow-path: LLM teacher evaluation (primary signal)
 *      Combined with a lightweight semantic word-overlap score as a sanity check
 *
 * Scoring weights (slow path):
 *   LLM score      : 85 %   ← primary signal; the teacher's judgement
 *   Semantic score : 15 %   ← safety net against hallucinated LLM scores
 *
 * @param {string}   question
 * @param {string}   userAnswer
 * @param {string}   modelAnswer
 * @param {string}   shortAnswer
 * @param {string[]} acceptedVariations
 * @param {string}   hint
 * @returns {Promise<{ score: number, feedback: string, hint: string, isCorrect: boolean, details: object }>}
 */
export async function evaluateAnswer(
  question,
  userAnswer,
  modelAnswer,
  shortAnswer,
  acceptedVariations,
  hint
) {
  const trimmed = userAnswer.trim();

  // ── Guard: empty answer ──────────────────────────────────────────────────
  if (!trimmed) {
    return {
      score: 0,
      feedback: `No answer provided. The concept being tested is "${shortAnswer}".`,
      hint,
      isCorrect: false,
      details: { fuzzyScore: 0, semanticScore: 0, llmScore: 0, reasoning: "Empty answer" },
    };
  }

  // ── Fast path: exact / near-exact match ──────────────────────────────────
  const variationCheck = checkVariationMatch(trimmed, shortAnswer, acceptedVariations);
  if (variationCheck.matched) {
    return {
      score: 100,
      feedback: `Correct! Your answer matches the expected concept perfectly.`,
      hint: "",
      isCorrect: true,
      details: {
        fuzzyScore: 100,
        semanticScore: 100,
        llmScore: 100,
        reasoning: `Exact match to "${variationCheck.matchedVariation}"`,
        matchedVariation: variationCheck.matchedVariation,
      },
    };
  }

  // ── Slow path: LLM teacher evaluation ───────────────────────────────────
  const llmResult = await getLLMScore(
    question,
    trimmed,
    modelAnswer,
    shortAnswer,
    acceptedVariations
  );

  // Lightweight semantic word-overlap score (sanity check only)
  const semanticScore = calculateSemanticScore(trimmed, modelAnswer);

  // Weighted combination: LLM is the primary signal
  const finalScore = Math.min(
    100,
    Math.round(llmResult.score * 0.85 + semanticScore * 0.15)
  );

  const feedback = generateFeedback(finalScore, llmResult.reasoning, shortAnswer);
  const hintText = finalScore < 70 ? llmResult.hint || hint : "";

  return {
    score: finalScore,
    feedback,
    hint: hintText,
    isCorrect: finalScore >= 70,
    details: {
      fuzzyScore: variationCheck.score,
      semanticScore,
      llmScore: llmResult.score,
      reasoning: llmResult.reasoning,
    },
  };
}

// ─── Semantic word-overlap score (sanity check) ───────────────────────────────

/**
 * Compute a lightweight word-overlap score between the user's answer and the
 * model answer.  Used only as a 15 % sanity check alongside the LLM score.
 * @param {string} userAnswer
 * @param {string} modelAnswer
 * @returns {number} 0-100
 */
function calculateSemanticScore(userAnswer, modelAnswer) {
  const STOP_WORDS = new Set([
    "a","an","the","is","are","was","were","be","been","being",
    "have","has","had","do","does","did","will","would","could",
    "should","may","might","shall","can","to","of","in","for",
    "on","with","at","by","from","as","into","through","during",
    "before","after","above","below","between","out","off","over",
    "under","again","then","once","here","there","when","where",
    "why","how","all","both","each","few","more","most","other",
    "some","such","no","nor","not","only","own","same","so","than",
    "too","very","just","but","and","or","that","this","which",
    "who","what","it","its",
  ]);

  const tokenize = (text) =>
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 1 && !STOP_WORDS.has(w));

  const userTokens = new Set(tokenize(userAnswer));
  const modelTokens = new Set(tokenize(modelAnswer));

  if (userTokens.size === 0 || modelTokens.size === 0) return 0;

  let overlap = 0;
  for (const t of userTokens) {
    if (modelTokens.has(t)) {
      overlap++;
    } else {
      // Partial credit for prefix/suffix overlap on longer tokens
      for (const m of modelTokens) {
        if (
          t !== m &&
          (t.includes(m) || m.includes(t)) &&
          Math.min(t.length, m.length) > 3
        ) {
          overlap += 0.5;
          break;
        }
      }
    }
  }

  const recall = overlap / modelTokens.size;
  const jaccard = overlap / (userTokens.size + modelTokens.size - overlap);
  // Weight recall more heavily — we care that the model concepts are covered
  return Math.round((recall * 0.7 + jaccard * 0.3) * 100);
}
