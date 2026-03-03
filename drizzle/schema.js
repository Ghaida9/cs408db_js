import {
  boolean,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  json,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  password: varchar("password", { length: 255 }),
});

// Questions table - stores all DB Systems questions
export const questions = mysqlTable("questions", {
  id: int("id").autoincrement().primaryKey(),
  questionText: text("questionText").notNull(),
  modelAnswer: text("modelAnswer").notNull(),
  // Short correct answer (1-2 words) for quick matching
  shortAnswer: varchar("shortAnswer", { length: 100 }).notNull(),
  // Accepted synonyms/variations as JSON array
  acceptedVariations: json("acceptedVariations").notNull(),
  difficulty: mysqlEnum("difficulty", ["easy", "medium", "hard"]).notNull(),
  stageOrder: int("stageOrder").notNull(),
  category: varchar("category", { length: 100 }),
  hint: text("hint"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// User answers table - tracks all submissions
export const userAnswers = mysqlTable("userAnswers", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  questionId: int("questionId").notNull(),
  sessionId: int("sessionId").notNull(),
  userAnswer: text("userAnswer").notNull(),
  score: int("score").notNull(), // 0-100
  feedback: text("feedback"),
  hint: text("hint"),
  evaluationDetails: json("evaluationDetails"),
  submittedAt: timestamp("submittedAt").defaultNow().notNull(),
});

// Game sessions table
export const gameSessions = mysqlTable("gameSessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  currentStage: mysqlEnum("currentStage", ["easy", "medium", "hard"])
    .notNull()
    .default("easy"),
  currentQuestionIndex: int("currentQuestionIndex").default(0).notNull(),
  isComplete: boolean("isComplete").default(false).notNull(),
  totalScore: int("totalScore").default(0).notNull(),
  easyScore: int("easyScore").default(0).notNull(),
  mediumScore: int("mediumScore").default(0).notNull(),
  hardScore: int("hardScore").default(0).notNull(),
  xpEarned: int("xpEarned").default(0).notNull(),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

// User progress table
export const userProgress = mysqlTable("userProgress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  totalXp: int("totalXp").default(0).notNull(),
  level: int("level").default(1).notNull(),
  questionsCompleted: int("questionsCompleted").default(0).notNull(),
  gamesCompleted: int("gamesCompleted").default(0).notNull(),
  currentStreak: int("currentStreak").default(0).notNull(),
  longestStreak: int("longestStreak").default(0).notNull(),
  averageScore: int("averageScore").default(0).notNull(),
  perfectScores: int("perfectScores").default(0).notNull(),
  lastActivityDate: timestamp("lastActivityDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Badges table
export const badges = mysqlTable("badges", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description").notNull(),
  iconEmoji: varchar("iconEmoji", { length: 10 }).notNull(),
  rarity: mysqlEnum("rarity", ["common", "rare", "epic", "legendary"]).notNull(),
  requiredXp: int("requiredXp"),
  requiredQuestionsCompleted: int("requiredQuestionsCompleted"),
  requiredGamesCompleted: int("requiredGamesCompleted"),
  requiredStreak: int("requiredStreak"),
  requiredPerfectScores: int("requiredPerfectScores"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// User badges table
export const userBadges = mysqlTable("userBadges", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  badgeId: int("badgeId").notNull(),
  earnedAt: timestamp("earnedAt").defaultNow().notNull(),
});
