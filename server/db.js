import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  badges,
  gameSessions,
  questions,
  userAnswers,
  userBadges,
  userProgress,
  users,
} from "../drizzle/schema.js";
import { ENV } from "./_core/env.js";

let _db = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── User helpers ────────────────────────────────────────────────────────────

export async function upsertUser(user) {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values = { openId: user.openId };
  const updateSet = {};

  const textFields = ["name", "email", "loginMethod"];

  const assignNullable = (field) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  };

  textFields.forEach(assignNullable);

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }

  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Questions ────────────────────────────────────────────────────────────────

export async function getQuestionsByDifficulty(difficulty) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(questions)
    .where(eq(questions.difficulty, difficulty))
    .orderBy(questions.stageOrder);
}

export async function getQuestionById(id) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(questions)
    .where(eq(questions.id, id))
    .limit(1);
  return result[0];
}

// ─── Game Sessions ────────────────────────────────────────────────────────────

export async function createGameSession(userId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(gameSessions).values({
    userId,
    currentStage: "easy",
    currentQuestionIndex: 0,
    isComplete: false,
    totalScore: 0,
    easyScore: 0,
    mediumScore: 0,
    hardScore: 0,
    xpEarned: 0,
  });
  const insertId = result[0]?.insertId ?? result.insertId;
  const session = await db
    .select()
    .from(gameSessions)
    .where(eq(gameSessions.id, Number(insertId)))
    .limit(1);
  return session[0];
}

export async function getGameSession(sessionId) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(gameSessions)
    .where(eq(gameSessions.id, sessionId))
    .limit(1);
  return result[0];
}

export async function getActiveSession(userId) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(gameSessions)
    .where(and(eq(gameSessions.userId, userId), eq(gameSessions.isComplete, false)))
    .orderBy(desc(gameSessions.startedAt))
    .limit(1);
  return result[0];
}

export async function updateGameSession(sessionId, updates) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(gameSessions)
    .set(updates)
    .where(eq(gameSessions.id, sessionId));
}

// ─── User Answers ─────────────────────────────────────────────────────────────

export async function saveUserAnswer(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(userAnswers).values(data);
  const insertId = result[0]?.insertId ?? result.insertId;
  const answer = await db
    .select()
    .from(userAnswers)
    .where(eq(userAnswers.id, Number(insertId)))
    .limit(1);
  return answer[0];
}

export async function getSessionAnswers(sessionId) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(userAnswers)
    .where(eq(userAnswers.sessionId, sessionId));
}

export async function getUserAnswerHistory(userId) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(userAnswers)
    .where(eq(userAnswers.userId, userId))
    .orderBy(desc(userAnswers.submittedAt))
    .limit(50);
}

// ─── User Progress ────────────────────────────────────────────────────────────

export async function getUserProgress(userId) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(userProgress)
    .where(eq(userProgress.userId, userId))
    .limit(1);
  return result[0] ?? null;
}

export async function upsertUserProgress(userId, updates) {
  const db = await getDb();
  if (!db) return;
  const existing = await getUserProgress(userId);
  if (existing) {
    await db
      .update(userProgress)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(userProgress.userId, userId));
  } else {
    await db.insert(userProgress).values({
      userId,
      totalXp: 0,
      level: 1,
      questionsCompleted: 0,
      gamesCompleted: 0,
      currentStreak: 0,
      longestStreak: 0,
      averageScore: 0,
      perfectScores: 0,
      ...updates,
    });
  }
}

// ─── XP / Level helpers ───────────────────────────────────────────────────────

export function calculateXP(score) {
  if (score >= 90) return 100;
  if (score >= 70) return 60;
  if (score >= 50) return 30;
  return 10;
}

export function xpForNextLevel(level) {
  if (level <= 0) return 0;
  return Math.round(100 * Math.pow(level, 1.5));
}

export function calculateLevel(totalXp) {
  let level = 1;
  while (xpForNextLevel(level) <= totalXp) {
    level++;
  }
  return level - 1;
}

export async function updateUserProgressAfterAnswer(userId, score) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const progress = await getUserProgress(userId);
  const xpGained = calculateXP(score);
  const currentXp = progress?.totalXp ?? 0;
  const currentLevel = progress?.level ?? 1;
  const newXp = currentXp + xpGained;
  const newLevel = calculateLevel(newXp);
  const leveledUp = newLevel > currentLevel;
  const currentQuestionsCompleted = progress?.questionsCompleted ?? 0;
  const currentPerfectScores = progress?.perfectScores ?? 0;
  const currentAvgScore = progress?.averageScore ?? 0;
  const newQuestionsCompleted = currentQuestionsCompleted + 1;
  const newPerfectScores =
    score >= 95 ? currentPerfectScores + 1 : currentPerfectScores;
  const newAvgScore = Math.round(
    (currentAvgScore * currentQuestionsCompleted + score) / newQuestionsCompleted
  );

  // Update streak
  const now = new Date();
  const lastActivity = progress?.lastActivityDate;
  let currentStreak = progress?.currentStreak ?? 0;
  let longestStreak = progress?.longestStreak ?? 0;

  if (!lastActivity) {
    currentStreak = 1;
    longestStreak = 1;
  } else {
    const daysSince = Math.floor(
      (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSince === 0) {
      // Same day, no change
    } else if (daysSince === 1) {
      currentStreak += 1;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }

  await upsertUserProgress(userId, {
    totalXp: newXp,
    level: newLevel,
    questionsCompleted: newQuestionsCompleted,
    perfectScores: newPerfectScores,
    averageScore: newAvgScore,
    currentStreak,
    longestStreak,
    lastActivityDate: now,
  });

  return { newXp, newLevel, leveledUp };
}

export async function updateUserProgressAfterGame(userId, xpEarned) {
  const db = await getDb();
  if (!db) return;
  const progress = await getUserProgress(userId);
  const gamesCompleted = (progress?.gamesCompleted ?? 0) + 1;
  await upsertUserProgress(userId, { gamesCompleted });
}

// ─── Badges ───────────────────────────────────────────────────────────────────

export async function getAllBadges() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(badges).orderBy(badges.id);
}

export async function getUserBadges(userId) {
  const db = await getDb();
  if (!db) return [];
  const result = await db
    .select({
      id: userBadges.id,
      userId: userBadges.userId,
      badgeId: userBadges.badgeId,
      earnedAt: userBadges.earnedAt,
      badge: badges,
    })
    .from(userBadges)
    .innerJoin(badges, eq(userBadges.badgeId, badges.id))
    .where(eq(userBadges.userId, userId));
  return result;
}

export async function checkAndAwardBadges(userId) {
  const db = await getDb();
  if (!db) return [];
  const [allBadgesData, userBadgesData, progress] = await Promise.all([
    getAllBadges(),
    getUserBadges(userId),
    getUserProgress(userId),
  ]);
  if (!progress) return [];
  const earnedBadgeIds = new Set(userBadgesData.map((ub) => ub.badgeId));
  const newBadges = [];
  for (const badge of allBadgesData) {
    if (earnedBadgeIds.has(badge.id)) continue;
    let unlocked = true;
    if (
      badge.requiredXp !== null &&
      badge.requiredXp !== undefined &&
      progress.totalXp < badge.requiredXp
    )
      unlocked = false;
    if (
      badge.requiredQuestionsCompleted !== null &&
      badge.requiredQuestionsCompleted !== undefined &&
      progress.questionsCompleted < badge.requiredQuestionsCompleted
    )
      unlocked = false;
    if (
      badge.requiredGamesCompleted !== null &&
      badge.requiredGamesCompleted !== undefined &&
      progress.gamesCompleted < badge.requiredGamesCompleted
    )
      unlocked = false;
    if (
      badge.requiredStreak !== null &&
      badge.requiredStreak !== undefined &&
      progress.currentStreak < badge.requiredStreak
    )
      unlocked = false;
    if (
      badge.requiredPerfectScores !== null &&
      badge.requiredPerfectScores !== undefined &&
      progress.perfectScores < badge.requiredPerfectScores
    )
      unlocked = false;
    if (unlocked) {
      newBadges.push(badge);
      await db.insert(userBadges).values({ userId, badgeId: badge.id });
    }
  }
  return newBadges;
}

// ─── Leaderboard ──────────────────────────────────────────────────────────────

export async function getLeaderboard(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  const result = await db
    .select({
      userId: userProgress.userId,
      totalXp: userProgress.totalXp,
      level: userProgress.level,
      questionsCompleted: userProgress.questionsCompleted,
      gamesCompleted: userProgress.gamesCompleted,
      name: users.name,
      email: users.email,
    })
    .from(userProgress)
    .innerJoin(users, eq(userProgress.userId, users.id))
    .orderBy(desc(userProgress.totalXp), desc(userProgress.questionsCompleted))
    .limit(limit);
  return result;
}
