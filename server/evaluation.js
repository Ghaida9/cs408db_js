/**
 * evaluation.js — Hybrid grading pipeline for DB Systems Quiz
 * ------------------------------------------------------------
 * Pipeline:
 *   1. Normalise the student's answer (clean → misspelling fix → alias → singular)
 *   2. Expand the accepted-variation list automatically
 *   3. Fast-path: smartMatch() — 4-layer normalised matching (no LLM call)
 *   4. Slow-path: Llama 3.1 8B via HuggingFace with Dr. Sarah prompt
 */

import { invokeLlama, HF_MODEL, HF_PROVIDER } from "./llama.js";

export const EVAL_MODEL    = HF_MODEL;
export const EVAL_PROVIDER = HF_PROVIDER;

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 1 — DB-DOMAIN ALIAS TABLE
// Maps every common student shorthand / synonym to the canonical term.
// ═══════════════════════════════════════════════════════════════════════════════

const DB_ALIASES = {
  // ACID properties
  "atomicity": "atomicity", "atomic": "atomicity",
  "consistency": "consistency", "consistent": "consistency",
  "isolation": "isolation", "isolated": "isolation",
  "durability": "durability", "durable": "durability",
  "acid": "acid",

  // Keys
  "pk": "primary key", "primary key": "primary key", "primary": "primary key",
  "fk": "foreign key", "foreign key": "foreign key", "foreign": "foreign key",
  "sk": "surrogate key", "surrogate key": "surrogate key",
  "ck": "candidate key", "candidate key": "candidate key", "candidate": "candidate key",
  "ak": "alternate key", "alternate key": "alternate key",
  "superkey": "super key", "super key": "super key",

  // Normal forms
  "1nf": "first normal form", "first normal form": "first normal form",
  "2nf": "second normal form", "second normal form": "second normal form",
  "3nf": "third normal form", "third normal form": "third normal form",
  "bcnf": "boyce codd normal form", "boyce codd": "boyce codd normal form",
  "boyce-codd": "boyce codd normal form",
  "4nf": "fourth normal form", "fourth normal form": "fourth normal form",
  "5nf": "fifth normal form", "fifth normal form": "fifth normal form",

  // Joins
  "inner join": "inner join", "inner": "inner join",
  "equi join": "inner join", "equijoin": "inner join",
  "natural join": "natural join",
  "left join": "left outer join", "left outer join": "left outer join", "left outer": "left outer join",
  "right join": "right outer join", "right outer join": "right outer join", "right outer": "right outer join",
  "full join": "full outer join", "full outer join": "full outer join", "full outer": "full outer join",
  "cross join": "cross join", "cartesian": "cross join", "cartesian product": "cross join",

  // Indexing
  "b-tree": "b tree index", "btree": "b tree index", "b tree": "b tree index",
  "b+ tree": "b tree index", "b+tree": "b tree index",
  "hash index": "hash index", "hashing": "hash index",
  "bitmap index": "bitmap index",
  "clustered index": "clustered index", "clustered": "clustered index",
  "non clustered": "non clustered index", "nonclustered": "non clustered index",
  "non-clustered": "non clustered index",
  "composite index": "composite index", "covering index": "covering index",

  // Transactions & concurrency
  "tx": "transaction", "txn": "transaction", "transaction": "transaction",
  "commit": "commit", "rollback": "rollback", "roll back": "rollback",
  "savepoint": "savepoint", "deadlock": "deadlock", "dead lock": "deadlock",
  "livelock": "livelock", "live lock": "livelock",
  "shared lock": "shared lock", "exclusive lock": "exclusive lock",
  "x lock": "exclusive lock", "s lock": "shared lock",
  "two phase locking": "two phase locking", "2pl": "two phase locking",
  "2 phase locking": "two phase locking",
  "mvcc": "multiversion concurrency control", "multiversion": "multiversion concurrency control",
  "optimistic locking": "optimistic concurrency control",
  "pessimistic locking": "pessimistic concurrency control",

  // Query & SQL
  "projection": "projection", "project": "projection",
  "selection": "selection", "where": "selection",
  "aggregate": "aggregate function", "aggregation": "aggregate function",
  "group by": "group by", "having": "having", "order by": "order by",
  "subquery": "subquery", "sub query": "subquery", "nested query": "subquery",
  "correlated subquery": "correlated subquery",
  "view": "view",
  "materialised view": "materialized view", "materialized view": "materialized view",
  "stored procedure": "stored procedure", "procedure": "stored procedure",
  "trigger": "trigger", "cursor": "cursor",

  // Schema & design
  "er diagram": "entity relationship diagram", "erd": "entity relationship diagram",
  "entity relationship": "entity relationship diagram",
  "relation": "relation", "table": "relation",
  "tuple": "tuple", "row": "tuple",
  "attribute": "attribute", "column": "attribute",
  "cardinality": "cardinality",
  "one to one": "one to one", "1:1": "one to one",
  "one to many": "one to many", "1:n": "one to many",
  "many to many": "many to many", "m:n": "many to many", "n:m": "many to many",
  "weak entity": "weak entity", "strong entity": "strong entity",
  "total participation": "total participation", "partial participation": "partial participation",

  // Normalisation concepts
  "functional dependency": "functional dependency", "fd": "functional dependency",
  "partial dependency": "partial dependency",
  "transitive dependency": "transitive dependency",
  "multivalued dependency": "multivalued dependency", "mvd": "multivalued dependency",
  "armstrong": "armstrong axioms",
  "decomposition": "decomposition",
  "lossless": "lossless decomposition", "lossy": "lossy decomposition",
  "dependency preserving": "dependency preserving",

  // Storage & performance
  "heap": "heap file", "heap file": "heap file",
  "sequential scan": "sequential scan", "full table scan": "sequential scan",
  "index scan": "index scan",
  "query plan": "query execution plan", "execution plan": "query execution plan", "qep": "query execution plan",
  "buffer pool": "buffer pool", "buffer": "buffer pool", "cache": "buffer pool",
  "page": "page", "block": "page",
  "io": "disk io", "disk io": "disk io",

  // Distributed & NoSQL
  "cap theorem": "cap theorem", "cap": "cap theorem",
  "sharding": "sharding", "shard": "sharding",
  "replication": "replication", "replica": "replication",
  "partition": "partitioning", "partitioning": "partitioning",
  "nosql": "nosql",
  "document store": "document store", "key value store": "key value store",
  "column store": "column store", "graph database": "graph database",
  "base": "base properties", "eventual consistency": "eventual consistency",
};

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 2 — COMMON MISSPELLING TABLE
// ═══════════════════════════════════════════════════════════════════════════════

const MISSPELLINGS = {
  "atomicty": "atomicity", "atomiciti": "atomicity",
  "consistancy": "consistency", "consistenci": "consistency",
  "isolaton": "isolation", "isloation": "isolation",
  "durabilty": "durability", "durablity": "durability",
  "normalisation": "normalization", "normaliszation": "normalization",
  "foriegn": "foreign", "forign": "foreign",
  "primery": "primary", "priamry": "primary",
  "candiate": "candidate", "canididate": "candidate",
  "agregation": "aggregation", "aggreagtion": "aggregation",
  "transacion": "transaction", "transacton": "transaction",
  "deadlok": "deadlock", "deadlcok": "deadlock",
  "rollbak": "rollback", "rolback": "rollback",
  "subqery": "subquery", "subqurey": "subquery",
  "materialised": "materialized", "meterialised": "materialized",
  "cardinalty": "cardinality", "cardinaliy": "cardinality",
  "dependancy": "dependency", "dependenci": "dependency",
  "decompostion": "decomposition", "decompositon": "decomposition",
  "selectivty": "selectivity", "selectiviti": "selectivity",
  "partioning": "partitioning", "partitioing": "partitioning",
  "replicaton": "replication", "replicaiton": "replication",
  "shardding": "sharding", "shardig": "sharding",
};

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 3 — STOP WORDS
// ═══════════════════════════════════════════════════════════════════════════════

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
  "who","what","it","its","type","called","known","used","refers",
]);

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 4 — TEXT NORMALISATION UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Clean text: lowercase, replace hyphens/underscores with spaces,
 * remove punctuation, collapse whitespace.
 */
function clean(text) {
  return text
    .toLowerCase()
    .replace(/[-_/]/g, " ")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Fix known misspellings. */
function fixMisspellings(text) {
  return MISSPELLINGS[text] ?? text;
}

/** Resolve DB-domain aliases (abbreviations → canonical term). */
function resolveAlias(text) {
  return DB_ALIASES[text] ?? text;
}

/**
 * Lightweight English singulariser for common DB plural patterns.
 * "indexes" → "index", "dependencies" → "dependency", "keys" → "key"
 */
function singularise(word) {
  if (word.endsWith("ies") && word.length > 4) return word.slice(0, -3) + "y";
  if (word.endsWith("ses") && word.length > 4) return word.slice(0, -2);
  if (word.endsWith("xes") && word.length > 4) return word.slice(0, -2);
  if (word.endsWith("ches") && word.length > 5) return word.slice(0, -2);
  if (word.endsWith("s") && !word.endsWith("ss") && word.length > 3) return word.slice(0, -1);
  return word;
}

/**
 * Full normalisation pipeline for a single phrase:
 *   clean → fix misspellings → resolve alias → singularise tokens
 * Returns the canonical form.
 */
function normalisePhrase(text) {
  let t = clean(text);
  t = fixMisspellings(t);
  // Try alias on full phrase first
  const aliased = resolveAlias(t);
  if (aliased !== t) return aliased;
  // Singularise each token and try alias again
  const tokens = t.split(" ").map(singularise);
  const rejoined = tokens.join(" ");
  return resolveAlias(rejoined);
}

/**
 * Tokenise a normalised phrase, remove stop words, singularise.
 * Returns a Set of meaningful tokens.
 */
function tokenise(text) {
  const tokens = new Set();
  for (const word of text.split(" ")) {
    const w = singularise(word);
    if (w && !STOP_WORDS.has(w) && w.length > 1) tokens.add(w);
  }
  return tokens;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 5 — LEVENSHTEIN DISTANCE
// ═══════════════════════════════════════════════════════════════════════════════

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  let dp = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const temp = dp[j];
      dp[j] = a[i - 1] === b[j - 1]
        ? prev
        : 1 + Math.min(prev, dp[j], dp[j - 1]);
      prev = temp;
    }
  }
  return dp[n];
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 6 — SMART MATCH (4-layer normalised matching)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Determine whether the student's answer is correct using a multi-layer
 * normalisation and matching pipeline — no LLM needed if this fires.
 *
 * Layers (in order):
 *   L1 — Exact match after full normalisation
 *   L2 — Word-order invariant match (sorted token sets)
 *   L3 — Token-set overlap (≥ 90 % of key tokens match)
 *   L4 — Levenshtein fuzzy (≤ 2 edits short / ≤ 3 edits longer answers)
 *
 * @param {string}   userAnswer
 * @param {string}   shortAnswer
 * @param {string[]} acceptedVariations
 * @returns {{ matched: boolean, score: number, method: string, matchedTo: string|null, normUser: string }}
 */
function smartMatch(userAnswer, shortAnswer, acceptedVariations) {
  const normUser   = normalisePhrase(userAnswer);
  const userTokens = tokenise(normUser);
  const allTargets = [shortAnswer, ...acceptedVariations];

  for (const target of allTargets) {
    const normTarget   = normalisePhrase(target);
    const targetTokens = tokenise(normTarget);

    // L1 — Exact match after normalisation
    if (normUser === normTarget) {
      return { matched: true, score: 100, method: "exact_normalised", matchedTo: target, normUser };
    }

    // L2 — Word-order invariant match
    if (normUser.split(" ").sort().join(" ") === normTarget.split(" ").sort().join(" ")) {
      return { matched: true, score: 100, method: "word_order_invariant", matchedTo: target, normUser };
    }

    // L3 — Token-set overlap
    if (targetTokens.size > 0) {
      let overlap = 0;
      for (const t of userTokens) { if (targetTokens.has(t)) overlap++; }
      const coverage = overlap / targetTokens.size;
      if (coverage >= 0.90 && overlap >= 1) {
        return { matched: true, score: 95, method: "token_set_overlap", matchedTo: target, normUser };
      }
    }

    // L4 — Levenshtein fuzzy
    const maxLen    = Math.max(normUser.length, normTarget.length);
    const tolerance = maxLen <= 10 ? 2 : 3;
    const dist      = levenshtein(normUser, normTarget);
    if (dist <= tolerance) {
      return { matched: true, score: 95, method: "levenshtein_fuzzy", matchedTo: target, normUser };
    }
  }

  return { matched: false, score: 0, method: "none", matchedTo: null, normUser };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 7 — EXPAND ACCEPTED VARIATIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Automatically generate additional accepted variations from the primary
 * short answer by applying alias lookups and common transformations.
 * Enriches the target list before matching without requiring manual curation.
 *
 * @param {string}   shortAnswer
 * @param {string[]} acceptedVariations
 * @returns {string[]}
 */
function expandVariations(shortAnswer, acceptedVariations) {
  const expanded = [...acceptedVariations];
  const seen = new Set([
    normalisePhrase(shortAnswer),
    ...acceptedVariations.map(normalisePhrase),
  ]);

  const base = clean(shortAnswer);

  // Add alias-resolved form
  const aliased = resolveAlias(base);
  if (!seen.has(aliased)) { expanded.push(aliased); seen.add(aliased); }

  // Add singular form
  const singularPhrase = base.split(" ").map(singularise).join(" ");
  if (!seen.has(singularPhrase)) { expanded.push(singularPhrase); seen.add(singularPhrase); }

  // Add reverse-alias: canonical → abbreviation
  for (const [abbr, canonical] of Object.entries(DB_ALIASES)) {
    if (canonical === base && !seen.has(abbr)) {
      expanded.push(abbr);
      seen.add(abbr);
    }
  }

  return expanded;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 8 — LLM EVALUATION (slow path)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Ask Llama 3.1 8B to evaluate the answer as Dr. Sarah.
 * Only called when smartMatch() finds no match.
 */
async function getLLMScore(question, userAnswer, modelAnswer, shortAnswer, acceptedVariations, normUser) {
  const variationsText = [shortAnswer, ...acceptedVariations].join(", ");

  const systemPrompt = `
# Role & Objective
You are Dr. Sarah, a senior university lecturer in Database Systems with 15 years of teaching and examining experience.
Your job is to mark short-answer exam questions submitted by undergraduate students and return a structured JSON score with feedback.

# Audience
The students are undergraduates studying Database Systems. They are learning core concepts such as SQL, normalisation, indexing, transactions, ACID properties, and query optimisation.
Many students are non-native English speakers and may express correct knowledge using informal language, abbreviations, or slight misspellings.

# Bigger Picture
Your evaluations are used inside a self-study quiz app. Students receive your feedback immediately after each answer.
Your goal is to help them learn — not just to assign a number. Accurate, encouraging, and specific feedback is more valuable than a harsh score.

# Your Evaluation Philosophy
- Read the student's answer to understand their INTENT, not just their exact words.
- Recognise that students may express correct knowledge using different vocabulary, abbreviations, or phrasing.
- Give credit when a student clearly understands the concept, even if they did not use the textbook term exactly.
- Be strict about factually wrong answers, but generous with minor spelling mistakes and informal language.
- Never penalise a student for knowing the answer but expressing it differently.
- Write feedback as if speaking directly to the student — encouraging, clear, and constructive.

# Rules
- DO NOT add any text outside the JSON object.
- DO NOT include markdown code fences or backticks.
- ALWAYS return valid JSON matching the exact schema specified in the task.
- Think step by step before assigning a score.`.trim();

  const userPrompt = `
## Task
Mark the student's short-answer response to the Database Systems exam question below.

## Context

<question>
${question}
</question>

<marking_scheme>
  <primary_answer>${shortAnswer}</primary_answer>
  <accepted_variations>${variationsText}</accepted_variations>
  <full_explanation>${modelAnswer}</full_explanation>
</marking_scheme>

<student_answer>
  <raw>${userAnswer}</raw>
  <normalised>${normUser}</normalised>
</student_answer>

Note: The normalised form has already had abbreviations expanded, misspellings corrected,
and synonyms resolved. Use it to help judge the student's intent.

## Scoring Guide

| Score Range | What it means |
|-------------|---------------|
| 90 – 100 | Student clearly knows the answer: exact match, correct synonym, valid abbreviation, or accurate paraphrase |
| 70 – 89  | Good understanding but slightly imprecise, incomplete, or uses informal phrasing |
| 50 – 69  | Partial understanding — on the right track but missing a key detail or using a related but incorrect term |
| 20 – 49  | Vague or tangentially related idea — student is guessing or confusing concepts |
| 0 – 19   | Wrong, irrelevant, blank, or shows no understanding of the topic |

## Few-Shot Examples

<example id="1">
  <example_question>What property ensures that a committed transaction's changes survive a system crash?</example_question>
  <example_primary_answer>Durability</example_primary_answer>
  <example_student_answer>durability</example_student_answer>
  <example_output>{"score": 100, "reasoning": "You correctly identified Durability — that is exactly the ACID property we are looking for.", "hint": ""}</example_output>
</example>

<example id="2">
  <example_question>What type of join returns only the rows that have matching values in both tables?</example_question>
  <example_primary_answer>Inner join</example_primary_answer>
  <example_student_answer>equi join</example_student_answer>
  <example_output>{"score": 72, "reasoning": "You are thinking of the right family of joins — an equi-join is a specific type of inner join, so you show good understanding.", "hint": "The general term the question is looking for is 'inner join'. An equi-join is a subset of that, so use the broader term in an exam."}</example_output>
</example>

<example id="3">
  <example_question>What normal form eliminates transitive dependencies?</example_question>
  <example_primary_answer>Third Normal Form</example_primary_answer>
  <example_student_answer>second normal form</example_student_answer>
  <example_output>{"score": 18, "reasoning": "You seem to be thinking of normalisation, but Second Normal Form deals with partial dependencies, not transitive ones.", "hint": "Transitive dependencies are removed in Third Normal Form (3NF). Remember: 2NF removes partial dependencies, 3NF removes transitive ones."}</example_output>
</example>

## Chain-of-Thought Instructions
Before writing your JSON, silently work through these steps:
1. What is the core concept the question is testing?
2. Does the student's answer (raw or normalised) express that concept — even if worded differently?
3. Would a reasonable lecturer award marks for this in a real exam?
4. Is the answer partially correct? If so, what fraction of marks is fair?
5. What one-sentence feedback would help this student most?
6. If the score is below 70, what teaching hint would help them understand the gap?

## Output Format
Respond ONLY with a valid JSON object — no extra text, no code fences:
{"score": <integer 0-100>, "reasoning": "<one sentence spoken directly to the student>", "hint": "<teaching hint if score < 70, otherwise empty string>"}`.trim();

  try {
    const response = await invokeLlama({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user",   content: userPrompt },
      ],
      maxTokens: 350,
      temperature: 0.0,
    });

    const content = response.choices[0]?.message?.content ?? "";
    const jsonMatch = content.match(/\{[\s\S]*?\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        score:     Math.max(0, Math.min(100, Math.round(Number(parsed.score) || 0))),
        reasoning: String(parsed.reasoning || ""),
        hint:      String(parsed.hint || ""),
      };
    }
    throw new Error(`No JSON found in model response: ${content.slice(0, 200)}`);
  } catch (error) {
    console.error("[Evaluation] LLM error:", error);
    return {
      score:     50,
      reasoning: "AI evaluation temporarily unavailable; a default score has been applied.",
      hint:      "Please review the topic and try again.",
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 9 — FEEDBACK GENERATOR
// ═══════════════════════════════════════════════════════════════════════════════

function generateFeedback(score, reasoning, shortAnswer) {
  if (score >= 90) return `Excellent! ${reasoning}`;
  if (score >= 70) return `Good answer! ${reasoning}  The key concept here is "${shortAnswer}".`;
  if (score >= 40) return `Partial credit. ${reasoning}  Try to think about "${shortAnswer}".`;
  return `Not quite. ${reasoning}  The concept being tested is "${shortAnswer}".`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 10 — SEMANTIC WORD-OVERLAP SCORE (sanity check, 15 % weight)
// ═══════════════════════════════════════════════════════════════════════════════

function calculateSemanticScore(userAnswer, modelAnswer) {
  const tokenize = (text) =>
    text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/)
      .filter((w) => w.length > 1 && !STOP_WORDS.has(w))
      .map(singularise);

  const userTokens  = new Set(tokenize(userAnswer));
  const modelTokens = new Set(tokenize(modelAnswer));
  if (userTokens.size === 0 || modelTokens.size === 0) return 0;

  let overlap = 0;
  for (const t of userTokens) {
    if (modelTokens.has(t)) {
      overlap++;
    } else {
      for (const m of modelTokens) {
        if (t !== m && (t.includes(m) || m.includes(t)) && Math.min(t.length, m.length) > 3) {
          overlap += 0.5;
          break;
        }
      }
    }
  }

  const recall  = overlap / modelTokens.size;
  const jaccard = overlap / (userTokens.size + modelTokens.size - overlap);
  return Math.round((recall * 0.7 + jaccard * 0.3) * 100);
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 11 — MAIN EXPORTED EVALUATION FUNCTION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Hybrid evaluation pipeline:
 *   1. Empty-answer guard
 *   2. Expand accepted variations automatically
 *   3. Fast-path: smartMatch() — 4-layer normalised matching (no LLM call)
 *   4. Slow-path: LLM teacher evaluation (85%) + semantic score (15%)
 *
 * @param {string}   question
 * @param {string}   userAnswer
 * @param {string}   modelAnswer
 * @param {string}   shortAnswer
 * @param {string[]} acceptedVariations
 * @param {string}   hint
 * @returns {Promise<{ score, feedback, hint, isCorrect, details }>}
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
      score:     0,
      feedback:  `No answer provided. The concept being tested is "${shortAnswer}".`,
      hint,
      isCorrect: false,
      details:   { fuzzyScore: 0, semanticScore: 0, llmScore: 0, reasoning: "Empty answer", method: "empty" },
    };
  }

  // ── Step 1: Expand accepted variations ───────────────────────────────────
  const expandedVariations = expandVariations(shortAnswer, acceptedVariations);

  // ── Step 2: Smart multi-layer normalised match ────────────────────────────
  const matchResult = smartMatch(trimmed, shortAnswer, expandedVariations);
  const normUser    = matchResult.normUser;

  if (matchResult.matched) {
    return {
      score:     matchResult.score,
      feedback:  `Correct! You correctly identified "${matchResult.matchedTo}".`,
      hint:      "",
      isCorrect: true,
      details: {
        fuzzyScore:    matchResult.score,
        semanticScore: 100,
        llmScore:      matchResult.score,
        reasoning:     `Matched "${matchResult.matchedTo}" via ${matchResult.method}.`,
        method:        matchResult.method,
        normUser,
        matchedTo:     matchResult.matchedTo,
      },
    };
  }

  // ── Step 3: LLM teacher evaluation ───────────────────────────────────────
  const llmResult    = await getLLMScore(question, trimmed, modelAnswer, shortAnswer, expandedVariations, normUser);
  const semanticScore = calculateSemanticScore(trimmed, modelAnswer);

  // Weighted combination: LLM is the primary signal
  const finalScore = Math.min(100, Math.round(llmResult.score * 0.85 + semanticScore * 0.15));

  const feedback  = generateFeedback(finalScore, llmResult.reasoning, shortAnswer);
  const hintText  = finalScore < 70 ? (llmResult.hint || hint) : "";

  return {
    score:     finalScore,
    feedback,
    hint:      hintText,
    isCorrect: finalScore >= 70,
    details: {
      fuzzyScore:    0,
      semanticScore,
      llmScore:      llmResult.score,
      reasoning:     llmResult.reasoning,
      method:        "llm",
      normUser,
    },
  };
}
