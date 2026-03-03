-- =============================================================================
-- DB Systems Quiz — Complete Seed File
-- =============================================================================
-- Run this file AFTER applying the schema migrations:
--   1. pnpm drizzle-kit generate
--   2. pnpm drizzle-kit migrate
--   3. mysql -u root -p dbsystems_quiz < seed.sql
--
-- Or run it directly in MySQL Workbench / any MySQL client.
-- =============================================================================

USE cs408db;

-- =============================================================================
-- QUESTIONS (21 total: 7 Easy, 7 Medium, 7 Hard)
-- acceptedVariations is stored as a JSON array of strings
-- =============================================================================

-- Clear existing data (safe to re-run)
DELETE FROM userAnswers;
DELETE FROM userBadges;
DELETE FROM gameSessions;
DELETE FROM userProgress;
DELETE FROM questions;
DELETE FROM badges;

-- Reset auto-increment counters
ALTER TABLE questions AUTO_INCREMENT = 1;
ALTER TABLE badges AUTO_INCREMENT = 1;
ALTER TABLE users 
  ADD COLUMN openId VARCHAR(255) NULL,
  ADD COLUMN loginMethod VARCHAR(50) NULL;
-- ---------------------------------------------------------------------------
-- EASY Questions (7)
-- ---------------------------------------------------------------------------

INSERT INTO questions
  (questionText, modelAnswer, shortAnswer, difficulty, hint, acceptedVariations, points)
VALUES
  (
    'What is a primary key?',
    'A primary key is a column (or set of columns) that uniquely identifies each row in a database table. It must be unique and cannot be NULL.',
    'primary key',
    'easy',
    'Think about what makes each row in a table unique and identifiable.',
    '["pk", "unique key", "PK", "primary-key", "primary_key"]',
    10
  ),
  (
    'What does SQL stand for?',
    'SQL stands for Structured Query Language. It is the standard language for managing and querying relational databases.',
    'structured query language',
    'easy',
    'It is a language used to communicate with databases — think about what kind of language it is.',
    '["sql", "structured query lang", "query language", "structured query"]',
    10
  ),
  (
    'What is a foreign key?',
    'A foreign key is a column in one table that references the primary key of another table, establishing a relationship between the two tables.',
    'foreign key',
    'easy',
    'It is a key that links two tables together by referencing another table.',
    '["fk", "reference key", "referencing key", "foreign-key", "foreign_key"]',
    10
  ),
  (
    'What is normalization in databases?',
    'Normalization is the process of organizing a database to reduce data redundancy and improve data integrity by dividing large tables into smaller related tables.',
    'normalization',
    'easy',
    'It is a process that organizes data to reduce repetition and dependency.',
    '["normalisation", "normal form", "data normalization", "db normalization"]',
    10
  ),
  (
    'What is a database index?',
    'A database index is a data structure that improves the speed of data retrieval operations on a table at the cost of additional storage space and write performance.',
    'index',
    'easy',
    'Think of it like the index at the back of a book — it helps you find things faster.',
    '["db index", "database index", "indexing", "table index"]',
    10
  ),
  (
    'What is a NULL value in SQL?',
    'NULL in SQL represents the absence of a value or an unknown value. It is not the same as zero or an empty string.',
    'null',
    'easy',
    'It represents the absence of any value — not zero, not empty, just missing.',
    '["null value", "missing value", "unknown value", "absence of value", "no value"]',
    10
  ),
  (
    'What is a relational database?',
    'A relational database is a type of database that stores and organizes data in tables (relations) with rows and columns, and uses SQL to manage the data.',
    'relational database',
    'easy',
    'It stores data in tables that can be related to each other.',
    '["rdbms", "relational db", "relational model", "relational dbms"]',
    10
  ),

-- ---------------------------------------------------------------------------
-- MEDIUM Questions (7)
-- ---------------------------------------------------------------------------

  (
    'What is a database transaction?',
    'A database transaction is a sequence of one or more SQL operations that are executed as a single unit of work. It either completes fully (commit) or is fully undone (rollback).',
    'transaction',
    'medium',
    'Think of it as a group of operations that must all succeed or all fail together.',
    '["db transaction", "atomic transaction", "acid transaction", "database transaction"]',
    20
  ),
  (
    'What does ACID stand for in database systems?',
    'ACID stands for Atomicity, Consistency, Isolation, and Durability — the four key properties that guarantee reliable database transactions.',
    'acid',
    'medium',
    'It is an acronym for four properties that ensure reliable transactions: A, C, I, D.',
    '["atomicity consistency isolation durability", "acid properties", "acid compliance", "acid acronym"]',
    20
  ),
  (
    'What is a JOIN in SQL?',
    'A JOIN in SQL is used to combine rows from two or more tables based on a related column between them. Common types include INNER JOIN, LEFT JOIN, RIGHT JOIN, and FULL JOIN.',
    'join',
    'medium',
    'It is an SQL operation that combines data from multiple tables based on a common column.',
    '["sql join", "table join", "inner join", "join operation"]',
    20
  ),
  (
    'What is database denormalization?',
    'Denormalization is the process of intentionally introducing redundancy into a database by merging tables or adding redundant data to improve read performance.',
    'denormalization',
    'medium',
    'It is the opposite of normalization — adding redundancy to improve performance.',
    '["denormalisation", "de-normalization", "denormalize", "de-normalisation"]',
    20
  ),
  (
    'What is a stored procedure?',
    'A stored procedure is a precompiled collection of SQL statements stored in the database that can be executed as a single unit. It improves performance and code reuse.',
    'stored procedure',
    'medium',
    'It is a saved, reusable block of SQL code stored directly in the database.',
    '["procedure", "sproc", "stored proc", "sp", "stored-procedure"]',
    20
  ),
  (
    'What is a database view?',
    'A database view is a virtual table based on the result of a SQL query. It does not store data itself but presents data from one or more underlying tables.',
    'view',
    'medium',
    'It is like a saved query that behaves like a table but does not store data itself.',
    '["virtual table", "db view", "sql view", "database view"]',
    20
  ),
  (
    'What is the difference between DELETE and TRUNCATE in SQL?',
    'DELETE removes rows one at a time and logs each deletion (can be rolled back), while TRUNCATE removes all rows at once without logging individual row deletions (faster, cannot be rolled back in most databases).',
    'truncate',
    'medium',
    'One removes rows one by one with logging; the other removes all rows at once without logging.',
    '["delete vs truncate", "truncate delete difference", "truncate faster"]',
    20
  ),

-- ---------------------------------------------------------------------------
-- HARD Questions (7)
-- ---------------------------------------------------------------------------

  (
    'What is a deadlock in database systems?',
    'A deadlock occurs when two or more transactions are waiting for each other to release locks, creating a circular dependency where none of them can proceed.',
    'deadlock',
    'hard',
    'Imagine two transactions each holding a lock the other needs — neither can continue.',
    '["dead lock", "circular wait", "deadlock situation", "mutual lock"]',
    30
  ),
  (
    'What is the CAP theorem?',
    'The CAP theorem states that a distributed database system can only guarantee two of the three properties simultaneously: Consistency, Availability, and Partition tolerance.',
    'cap theorem',
    'hard',
    'It is a theorem about distributed systems involving three properties: C, A, and P.',
    '["cap", "brewer theorem", "consistency availability partition", "cap theory"]',
    30
  ),
  (
    'What is a B-tree index?',
    'A B-tree (Balanced Tree) index is a self-balancing tree data structure used in databases to maintain sorted data and allow searches, insertions, and deletions in O(log n) time.',
    'b-tree',
    'hard',
    'It is a balanced tree structure used to speed up data lookups in databases.',
    '["btree", "balanced tree", "b tree index", "b-tree index", "balanced tree index"]',
    30
  ),
  (
    'What is MVCC in database systems?',
    'MVCC (Multi-Version Concurrency Control) is a technique used by databases to allow multiple transactions to read and write data concurrently without locking, by maintaining multiple versions of data.',
    'mvcc',
    'hard',
    'It is a concurrency technique that keeps multiple versions of data to avoid locking conflicts.',
    '["multi version concurrency control", "multiversion concurrency", "multi-version concurrency", "multi version control"]',
    30
  ),
  (
    'What is database sharding?',
    'Database sharding is a horizontal scaling technique that partitions data across multiple database instances (shards), with each shard holding a subset of the total data.',
    'sharding',
    'hard',
    'It is a way to split a large database across multiple servers horizontally.',
    '["horizontal partitioning", "data sharding", "db sharding", "horizontal scaling"]',
    30
  ),
  (
    'What is the difference between OLTP and OLAP?',
    'OLTP (Online Transaction Processing) handles frequent, short transactions for day-to-day operations, while OLAP (Online Analytical Processing) handles complex queries for data analysis and reporting.',
    'oltp olap',
    'hard',
    'One is for everyday transactions; the other is for analytical queries and reporting.',
    '["online transaction processing", "online analytical processing", "oltp vs olap", "transaction vs analytical"]',
    30
  ),
  (
    'What is a query execution plan?',
    'A query execution plan is a sequence of steps the database engine uses to execute a SQL query. It shows how the database will access tables, use indexes, and join data to return results.',
    'execution plan',
    'hard',
    'It is the database engine''s step-by-step strategy for executing your SQL query.',
    '["query plan", "explain plan", "query execution plan", "execution strategy"]',
    30
  );

-- =============================================================================
-- BADGES (12 total: 4 Common, 3 Rare, 3 Epic, 2 Legendary)
-- =============================================================================

INSERT INTO badges
  (name, description, iconEmoji, rarity, requiredXp, requiredQuestionsCompleted, requiredGamesCompleted, requiredStreak, requiredPerfectScores)
VALUES
  -- Common
  ('First Steps',       'Complete your first question',      '🌱', 'common',    NULL, 1,    NULL, NULL, NULL),
  ('Quick Start',       'Complete your first full game',     '🚀', 'common',    NULL, NULL, 1,    NULL, NULL),
  ('Scholar',           'Answer 10 questions correctly',     '📚', 'common',    NULL, 10,   NULL, NULL, NULL),
  -- Rare
  ('Dedicated Learner', 'Complete 5 games',                  '🎯', 'rare',      NULL, NULL, 5,    NULL, NULL),
  ('XP Hunter',         'Earn 500 XP',                       '⚡', 'rare',      500,  NULL, NULL, NULL, NULL),
  ('Streak Master',     'Maintain a 3-day streak',           '🔥', 'rare',      NULL, NULL, NULL, 3,    NULL),
  ('Perfectionist',     'Score 100% on a question',          '💎', 'rare',      NULL, NULL, NULL, NULL, 1),
  -- Epic
  ('Database Expert',   'Answer 25 questions',               '🗄️', 'epic',      NULL, 25,   NULL, NULL, NULL),
  ('Level 5 Scholar',   'Reach Level 5',                     '🏅', 'epic',      1600, NULL, NULL, NULL, NULL),
  ('Perfect Streak',    'Score 100% on 5 questions',         '🌟', 'epic',      NULL, NULL, NULL, NULL, 5),
  -- Legendary
  ('DB Master',         'Complete 10 games',                 '🏆', 'legendary', NULL, NULL, 10,   NULL, NULL),
  ('Grandmaster',       'Earn 2000 XP',                      '👑', 'legendary', 2000, NULL, NULL, NULL, NULL);

-- =============================================================================
-- Done! Verify with:
--   SELECT COUNT(*) FROM questions;   -- should be 21
--   SELECT COUNT(*) FROM badges;      -- should be 12
-- =============================================================================

SELECT CONCAT('Questions seeded: ', COUNT(*)) AS status FROM questions
UNION ALL
SELECT CONCAT('Badges seeded: ', COUNT(*)) FROM badges;
