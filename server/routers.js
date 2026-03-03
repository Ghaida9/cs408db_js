import { COOKIE_NAME } from "../shared/const.js";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  checkAndAwardBadges,
  createGameSession,
  getActiveSession,
  getAllBadges,
  getGameSession,
  getLeaderboard,
  getQuestionById,
  getQuestionsByDifficulty,
  getSessionAnswers,
  getUserAnswerHistory,
  getUserBadges,
  getUserProgress,
  updateGameSession,
  updateUserProgressAfterAnswer,
  updateUserProgressAfterGame,
  saveUserAnswer,
  calculateXP,
  calculateLevel,
  xpForNextLevel,
} from "./db.js";
import { evaluateAnswer, EVAL_MODEL, EVAL_PROVIDER } from "./evaluation.js";
import { testLlamaConnection } from "./llama.js";
import { getSessionCookieOptions } from "./_core/cookies.js";
import { systemRouter } from "./_core/systemRouter.js";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc.js";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true };
    }),
  }),
  // ─── Model Info ─────────────────────────────────────────────────────────────
  modelInfo: router({
    /**
     * Returns the active LLM model name and provider used for answer evaluation.
     * Public so the frontend can display it without requiring login.
     */
    get: publicProcedure.query(() => ({
      model: EVAL_MODEL,
      provider: EVAL_PROVIDER,
      displayName: "Llama 3.1 8B Instruct",
      source: "meta-llama/Llama-3.1-8B-Instruct",
      huggingFaceUrl: "https://huggingface.co/meta-llama/Llama-3.1-8B-Instruct",
    })),
    /**
     * Protected admin endpoint — runs a live connectivity test against the HF API.
     */
    test: protectedProcedure.mutation(async () => {
      const result = await testLlamaConnection();
      return result;
    }),
  }),
  // ─── Quiz / Game Session ────────────────────────────────────────────────────
  quiz: router({
    /**
     * Start a new game session (or return existing active one)
     */
    startGame: protectedProcedure.mutation(async ({ ctx }) => {
      const userId = ctx.user.id;
      // Check for existing active session
      const existing = await getActiveSession(userId);
      if (existing) {
        const stageQuestions = await getQuestionsByDifficulty(
          existing.currentStage
        );
        const currentQuestion = stageQuestions[existing.currentQuestionIndex];
        return {
          sessionId: existing.id,
          stage: existing.currentStage,
          questionIndex: existing.currentQuestionIndex,
          totalQuestionsInStage: stageQuestions.length,
          currentQuestion: currentQuestion
            ? {
                id: currentQuestion.id,
                questionText: currentQuestion.questionText,
                category: currentQuestion.category,
                difficulty: currentQuestion.difficulty,
              }
            : null,
          isResumed: true,
        };
      }
      const session = await createGameSession(userId);
      const easyQuestions = await getQuestionsByDifficulty("easy");
      const firstQuestion = easyQuestions[0];
      return {
        sessionId: session.id,
        stage: "easy",
        questionIndex: 0,
        totalQuestionsInStage: easyQuestions.length,
        currentQuestion: firstQuestion
          ? {
              id: firstQuestion.id,
              questionText: firstQuestion.questionText,
              category: firstQuestion.category,
              difficulty: firstQuestion.difficulty,
            }
          : null,
        isResumed: false,
      };
    }),
    /**
     * Get current question for a session
     */
    getCurrentQuestion: protectedProcedure
      .input(z.object({ sessionId: z.number() }))
      .query(async ({ ctx, input }) => {
        const session = await getGameSession(input.sessionId);
        if (!session || session.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Session not found",
          });
        }
        if (session.isComplete) {
          return { isComplete: true, session };
        }
        const stageQuestions = await getQuestionsByDifficulty(
          session.currentStage
        );
        const question = stageQuestions[session.currentQuestionIndex];
        return {
          isComplete: false,
          session,
          question: question
            ? {
                id: question.id,
                questionText: question.questionText,
                category: question.category,
                difficulty: question.difficulty,
                stageOrder: question.stageOrder,
              }
            : null,
          totalQuestionsInStage: stageQuestions.length,
        };
      }),
    /**
     * Submit an answer and get AI evaluation
     */
    submitAnswer: protectedProcedure
      .input(
        z.object({
          sessionId: z.number(),
          questionId: z.number(),
          answer: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const session = await getGameSession(input.sessionId);
        if (!session || session.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        if (session.isComplete) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Session is already complete",
          });
        }
        const question = await getQuestionById(input.questionId);
        if (!question) throw new TRPCError({ code: "NOT_FOUND" });

        // Evaluate the answer
        const evaluation = await evaluateAnswer(
          question.questionText,
          input.answer,
          question.modelAnswer,
          question.shortAnswer,
          question.acceptedVariations,
          question.hint || ""
        );

        // Save the answer
        await saveUserAnswer({
          userId: ctx.user.id,
          questionId: input.questionId,
          sessionId: input.sessionId,
          userAnswer: input.answer,
          score: evaluation.score,
          feedback: evaluation.feedback,
          hint: evaluation.hint || "",
          evaluationDetails: evaluation.details,
        });

        // Update progress
        const { newXp, newLevel, leveledUp } =
          await updateUserProgressAfterAnswer(ctx.user.id, evaluation.score);
        const xpEarned = calculateXP(evaluation.score);

        // Check for new badges
        const newBadges = await checkAndAwardBadges(ctx.user.id);

        // Determine next question / stage progression
        const stageQuestions = await getQuestionsByDifficulty(
          session.currentStage
        );
        const nextIndex = session.currentQuestionIndex + 1;
        const isStageComplete = nextIndex >= stageQuestions.length;

        const stageOrder = ["easy", "medium", "hard"];
        const currentStageIdx = stageOrder.indexOf(session.currentStage);
        const nextStage =
          isStageComplete && currentStageIdx < stageOrder.length - 1
            ? stageOrder[currentStageIdx + 1]
            : session.currentStage;
        const isGameComplete =
          isStageComplete && currentStageIdx === stageOrder.length - 1;

        // Update score for current stage
        const stageScoreField = `${session.currentStage}Score`;
        const currentStageScore = session[stageScoreField] ?? 0;
        const newStageScore = Math.round(
          (currentStageScore * session.currentQuestionIndex + evaluation.score) /
            (session.currentQuestionIndex + 1)
        );

        const sessionUpdates = {
          [stageScoreField]: newStageScore,
          xpEarned: (session.xpEarned ?? 0) + xpEarned,
        };

        if (isGameComplete) {
          sessionUpdates.isComplete = true;
          sessionUpdates.completedAt = new Date();
          const allAnswers = await getSessionAnswers(input.sessionId);
          const totalScore =
            allAnswers.length > 0
              ? Math.round(
                  allAnswers.reduce((sum, a) => sum + a.score, 0) /
                    allAnswers.length
                )
              : 0;
          sessionUpdates.totalScore = totalScore;
          await updateUserProgressAfterGame(ctx.user.id, xpEarned);
        } else if (isStageComplete) {
          sessionUpdates.currentStage = nextStage;
          sessionUpdates.currentQuestionIndex = 0;
        } else {
          sessionUpdates.currentQuestionIndex = nextIndex;
        }

        await updateGameSession(input.sessionId, sessionUpdates);

        // Get next question if not game complete
        let nextQuestion = null;
        if (!isGameComplete) {
          if (isStageComplete) {
            const nextStageQuestions = await getQuestionsByDifficulty(nextStage);
            const nq = nextStageQuestions[0];
            if (nq) {
              nextQuestion = {
                id: nq.id,
                questionText: nq.questionText,
                category: nq.category,
                difficulty: nq.difficulty,
              };
            }
          } else {
            const nq = stageQuestions[nextIndex];
            if (nq) {
              nextQuestion = {
                id: nq.id,
                questionText: nq.questionText,
                category: nq.category,
                difficulty: nq.difficulty,
              };
            }
          }
        }

        return {
          evaluation,
          xpEarned,
          newXp,
          newLevel,
          leveledUp,
          newBadges,
          isStageComplete,
          isGameComplete,
          nextStage: isStageComplete ? nextStage : session.currentStage,
          nextQuestion,
          currentStage: session.currentStage,
          questionIndex: session.currentQuestionIndex,
          totalQuestionsInStage: stageQuestions.length,
        };
      }),
    /**
     * Get hint for current question
     */
    getHint: protectedProcedure
      .input(z.object({ questionId: z.number() }))
      .query(async ({ input }) => {
        const question = await getQuestionById(input.questionId);
        if (!question) throw new TRPCError({ code: "NOT_FOUND" });
        return { hint: question.hint || "No hint available for this question." };
      }),
    /**
     * Get game results after completion
     */
    getGameResults: protectedProcedure
      .input(z.object({ sessionId: z.number() }))
      .query(async ({ ctx, input }) => {
        const session = await getGameSession(input.sessionId);
        if (!session || session.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        const answers = await getSessionAnswers(input.sessionId);
        const progress = await getUserProgress(ctx.user.id);
        const userBadgesData = await getUserBadges(ctx.user.id);
        return {
          session,
          answers,
          progress,
          badges: userBadgesData.map((ub) => ub.badge),
        };
      }),
    /**
     * Abandon current session and start fresh
     */
    abandonSession: protectedProcedure
      .input(z.object({ sessionId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const session = await getGameSession(input.sessionId);
        if (!session || session.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        await updateGameSession(input.sessionId, {
          isComplete: true,
          completedAt: new Date(),
        });
        return { success: true };
      }),
  }),
  // ─── Progress ───────────────────────────────────────────────────────────────
  progress: router({
    getMyProgress: protectedProcedure.query(async ({ ctx }) => {
      const [progress, userBadgesData, allBadgesData] = await Promise.all([
        getUserProgress(ctx.user.id),
        getUserBadges(ctx.user.id),
        getAllBadges(),
      ]);
      const earnedBadgeIds = new Set(userBadgesData.map((ub) => ub.badgeId));
      const lockedBadges = allBadgesData.filter(
        (b) => !earnedBadgeIds.has(b.id)
      );
      const level = progress?.level ?? 1;
      const totalXp = progress?.totalXp ?? 0;
      const nextLevelXp = xpForNextLevel(level);
      const currentLevelXp = xpForNextLevel(level - 1);
      const xpProgress = totalXp - currentLevelXp;
      const xpNeeded = nextLevelXp - currentLevelXp;
      return {
        progress: progress ?? {
          id: 0,
          userId: ctx.user.id,
          totalXp: 0,
          level: 1,
          questionsCompleted: 0,
          gamesCompleted: 0,
          currentStreak: 0,
          longestStreak: 0,
          averageScore: 0,
          perfectScores: 0,
          lastActivityDate: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        earnedBadges: userBadgesData.map((ub) => ({
          ...ub.badge,
          earnedAt: ub.earnedAt,
        })),
        lockedBadges,
        levelInfo: {
          level,
          totalXp,
          xpProgress,
          xpNeeded,
          nextLevelXp,
        },
      };
    }),
    getAnswerHistory: protectedProcedure.query(async ({ ctx }) => {
      return getUserAnswerHistory(ctx.user.id);
    }),
  }),
  // ─── Leaderboard ────────────────────────────────────────────────────────────
  leaderboard: router({
    getTop: publicProcedure.query(async () => {
      const entries = await getLeaderboard(50);
      return entries.map((e, i) => ({
        rank: i + 1,
        userId: e.userId,
        name: e.name || "Anonymous",
        level: e.level,
        totalXp: e.totalXp,
        questionsCompleted: e.questionsCompleted,
        gamesCompleted: e.gamesCompleted,
      }));
    }),
    getMyRank: protectedProcedure.query(async ({ ctx }) => {
      const all = await getLeaderboard(1000);
      const myIndex = all.findIndex((e) => e.userId === ctx.user.id);
      return {
        rank: myIndex >= 0 ? myIndex + 1 : null,
        total: all.length,
      };
    }),
  }),
});
