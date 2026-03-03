CREATE TABLE `badges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text NOT NULL,
	`iconEmoji` varchar(10) NOT NULL,
	`rarity` enum('common','rare','epic','legendary') NOT NULL,
	`requiredXp` int,
	`requiredQuestionsCompleted` int,
	`requiredGamesCompleted` int,
	`requiredStreak` int,
	`requiredPerfectScores` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `badges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gameSessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`currentStage` enum('easy','medium','hard') NOT NULL DEFAULT 'easy',
	`currentQuestionIndex` int NOT NULL DEFAULT 0,
	`isComplete` boolean NOT NULL DEFAULT false,
	`totalScore` int NOT NULL DEFAULT 0,
	`easyScore` int NOT NULL DEFAULT 0,
	`mediumScore` int NOT NULL DEFAULT 0,
	`hardScore` int NOT NULL DEFAULT 0,
	`xpEarned` int NOT NULL DEFAULT 0,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `gameSessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `questions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`questionText` text NOT NULL,
	`modelAnswer` text NOT NULL,
	`shortAnswer` varchar(100) NOT NULL,
	`acceptedVariations` json NOT NULL,
	`difficulty` enum('easy','medium','hard') NOT NULL,
	`stageOrder` int NOT NULL,
	`category` varchar(100),
	`hint` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `questions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userAnswers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`questionId` int NOT NULL,
	`sessionId` int NOT NULL,
	`userAnswer` text NOT NULL,
	`score` int NOT NULL,
	`feedback` text,
	`hint` text,
	`evaluationDetails` json,
	`submittedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `userAnswers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userBadges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`badgeId` int NOT NULL,
	`earnedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `userBadges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userProgress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`totalXp` int NOT NULL DEFAULT 0,
	`level` int NOT NULL DEFAULT 1,
	`questionsCompleted` int NOT NULL DEFAULT 0,
	`gamesCompleted` int NOT NULL DEFAULT 0,
	`currentStreak` int NOT NULL DEFAULT 0,
	`longestStreak` int NOT NULL DEFAULT 0,
	`averageScore` int NOT NULL DEFAULT 0,
	`perfectScores` int NOT NULL DEFAULT 0,
	`lastActivityDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userProgress_id` PRIMARY KEY(`id`),
	CONSTRAINT `userProgress_userId_unique` UNIQUE(`userId`)
);
