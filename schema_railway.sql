SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
USE railway;

DROP TABLE IF EXISTS userBadges;
DROP TABLE IF EXISTS userAnswers;
DROP TABLE IF EXISTS gameSessions;
DROP TABLE IF EXISTS userProgress;
DROP TABLE IF EXISTS badges;
DROP TABLE IF EXISTS questions;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  openId VARCHAR(64) NOT NULL UNIQUE,
  name TEXT,
  email VARCHAR(320),
  loginMethod VARCHAR(64),
  role ENUM('user','admin') NOT NULL DEFAULT 'user',
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  password VARCHAR(255)
);

CREATE TABLE questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  questionText TEXT NOT NULL,
  modelAnswer TEXT NOT NULL,
  shortAnswer VARCHAR(100) NOT NULL,
  acceptedVariations JSON NOT NULL,
  difficulty ENUM('easy','medium','hard') NOT NULL,
  stageOrder INT NOT NULL,
  category VARCHAR(100),
  hint TEXT,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE badges (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  iconEmoji VARCHAR(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  rarity ENUM('common','rare','epic','legendary') NOT NULL,
  requiredXp INT,
  requiredQuestionsCompleted INT,
  requiredGamesCompleted INT,
  requiredStreak INT,
  requiredPerfectScores INT,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE gameSessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  currentStage ENUM('easy','medium','hard') NOT NULL DEFAULT 'easy',
  currentQuestionIndex INT NOT NULL DEFAULT 0,
  isComplete BOOLEAN NOT NULL DEFAULT FALSE,
  totalScore INT NOT NULL DEFAULT 0,
  easyScore INT NOT NULL DEFAULT 0,
  mediumScore INT NOT NULL DEFAULT 0,
  hardScore INT NOT NULL DEFAULT 0,
  xpEarned INT NOT NULL DEFAULT 0,
  startedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completedAt TIMESTAMP NULL
);

CREATE TABLE userProgress (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL UNIQUE,
  totalXp INT NOT NULL DEFAULT 0,
  level INT NOT NULL DEFAULT 1,
  questionsCompleted INT NOT NULL DEFAULT 0,
  gamesCompleted INT NOT NULL DEFAULT 0,
  currentStreak INT NOT NULL DEFAULT 0,
  longestStreak INT NOT NULL DEFAULT 0,
  averageScore INT NOT NULL DEFAULT 0,
  perfectScores INT NOT NULL DEFAULT 0,
  lastActivityDate TIMESTAMP NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE userAnswers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  questionId INT NOT NULL,
  sessionId INT NOT NULL,
  userAnswer TEXT NOT NULL,
  score INT NOT NULL,
  feedback TEXT,
  hint TEXT,
  evaluationDetails JSON,
  submittedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE userBadges (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  badgeId INT NOT NULL,
  earnedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Seed questions
INSERT INTO questions (questionText, modelAnswer, shortAnswer, acceptedVariations, difficulty, stageOrder, hint) VALUES
('In a relational table, which type of constraint ensures that every row can be uniquely identified and that the identifying column cannot contain a NULL value?',
 'A primary key is a column or set of columns that uniquely identifies every row in a table. It enforces uniqueness and disallows NULL values.',
 'primary key', '["pk","PK","primary-key","primary_key","unique identifier"]', 'easy', 1,
 'Think about the one column that makes every row different from all others and can never be empty.'),

('What is the name of the standardised declarative language used to create, read, update, and delete data in relational database management systems?',
 'SQL (Structured Query Language) is the standard language for interacting with relational databases.',
 'SQL', '["structured query language","sequel","SEQUEL","query language"]', 'easy', 2,
 'Its full name is three words: Structured, Query, and one more word that describes a language.'),

('Which type of column constraint is used to link two tables together by storing the value of another table''s unique identifier, thereby enforcing referential integrity?',
 'A foreign key is a column in one table that references the primary key of another table.',
 'foreign key', '["fk","FK","reference key","referencing key","foreign-key","foreign_key"]', 'easy', 3,
 'It is a reference from one table pointing to the unique identifier of a different table.'),

('What is the name of the design process that organises a relational schema into smaller, well-structured tables to eliminate redundant data and reduce update anomalies?',
 'Normalization is the process of structuring a relational database to reduce data redundancy and improve data integrity.',
 'normalization', '["normalisation","data normalisation","db normalization","normal form process"]', 'easy', 4,
 'Think of it as the process of putting data into its most organised, non-repetitive form.'),

('Which database object is created on one or more columns of a table to speed up data retrieval at the cost of additional storage and slightly slower write operations?',
 'A database index is a data structure that improves the speed of data retrieval operations on a table.',
 'index', '["db index","database index","indexing","table index","indices"]', 'easy', 5,
 'Think of the alphabetical reference section at the back of a textbook that helps you find topics quickly.'),

('In SQL, what special marker is used to represent the absence of any value in a column — distinct from zero or an empty string?',
 'NULL in SQL represents the absence of a value or an unknown value.',
 'NULL', '["null value","missing value","unknown value","absence of value","no value"]', 'easy', 6,
 'It is a keyword that means "no value exists here" — not blank, not zero, simply unknown.'),

('What category of database management system organises data into tables with rows and columns, enforces relationships between those tables, and uses a structured query language for data access?',
 'A Relational Database Management System (RDBMS) stores data in structured tables and uses SQL for data manipulation.',
 'RDBMS', '["relational database management system","relational dbms","relational database system","relational db"]', 'easy', 7,
 'The acronym stands for Relational Database Management System — examples include MySQL and PostgreSQL.'),

('In database systems, what term describes a sequence of one or more SQL operations that are treated as a single logical unit of work, either committing all changes or rolling them all back?',
 'A database transaction is a sequence of SQL operations executed as a single unit of work.',
 'transaction', '["db transaction","atomic transaction","acid transaction","database transaction"]', 'medium', 1,
 'Think of a bank transfer: both the debit and the credit must succeed together, or neither should happen.'),

('What four-letter acronym names the set of properties — Atomicity, Consistency, Isolation, and Durability — that guarantee reliable processing of database operations?',
 'ACID stands for Atomicity, Consistency, Isolation, and Durability.',
 'ACID', '["atomicity consistency isolation durability","acid properties","acid compliance","acid acronym"]', 'medium', 2,
 'Each letter of this acronym stands for one of the four guarantees that make database transactions reliable.'),

('Which SQL operation is used to combine rows from two or more tables into a single result set based on a matching column value shared between them?',
 'A JOIN in SQL combines rows from two or more tables based on a related column.',
 'JOIN', '["sql join","table join","inner join","join operation","INNER JOIN"]', 'medium', 3,
 'It is the SQL keyword that lets you merge data from multiple tables in a single query result.'),

('What is the term for the deliberate process of introducing controlled redundancy into a database schema in order to improve read query performance?',
 'Denormalization is the intentional introduction of redundancy into a database by merging tables or duplicating data.',
 'denormalization', '["denormalisation","de-normalization","denormalize","de-normalisation"]', 'medium', 4,
 'It is the reverse of the process that removes redundancy — here you are intentionally adding it back to gain speed.'),

('What is the name for a named, precompiled block of SQL statements saved directly inside the database server that can be invoked by name to improve performance and encourage code reuse?',
 'A stored procedure is a precompiled collection of SQL statements stored in the database.',
 'stored procedure', '["procedure","sproc","stored proc","sp","stored-procedure"]', 'medium', 5,
 'Think of it as a reusable SQL function that lives inside the database itself rather than in application code.'),

('In SQL, what is the name of a named virtual table whose contents are defined by a saved query — it does not physically store data but presents it as if it were a real table?',
 'A database view is a virtual table defined by a stored SQL query.',
 'view', '["virtual table","db view","sql view","database view","virtual view"]', 'medium', 6,
 'It behaves like a table in queries but is actually just a saved SELECT statement with a name.'),

('Which SQL command removes all rows from a table in a single operation without logging individual row deletions, making it faster than its row-by-row alternative?',
 'TRUNCATE removes all rows from a table at once without logging individual deletions.',
 'TRUNCATE', '["truncate table","truncate statement","sql truncate"]', 'medium', 7,
 'Unlike DELETE, this command wipes the entire table in one shot and cannot easily be undone.'),

('What situation occurs in a database when two or more concurrent transactions are each waiting for the other to release a lock, creating a circular dependency from which none can proceed?',
 'A deadlock occurs when two or more transactions are each waiting for locks held by the other, forming a circular wait.',
 'deadlock', '["dead lock","circular wait","deadlock situation","mutual lock","circular dependency"]', 'hard', 1,
 'Picture two people each holding a key the other needs — neither can move forward without the other giving up first.'),

('In distributed systems theory, what principle states that it is impossible for a distributed data store to simultaneously guarantee consistency, availability, and partition tolerance?',
 'The CAP theorem states that a distributed database can only guarantee two of three properties at once.',
 'CAP theorem', '["cap","brewer theorem","cap theory","consistency availability partition tolerance"]', 'hard', 2,
 'This is a famous result named after its three guarantees: Consistency, Availability, and Partition tolerance.'),

('Which self-balancing tree data structure is most commonly used inside database engines to maintain sorted data and support searches, insertions, and deletions all in O(log n) time?',
 'A B-tree is a self-balancing tree data structure used in database indexes.',
 'B-tree', '["btree","b tree","b-tree index","balanced tree index","btree index"]', 'hard', 3,
 'Its name starts with the letter B and it is always kept at an even height.'),

('What concurrency control technique allows readers and writers to operate simultaneously without blocking each other by maintaining multiple timestamped snapshots of each row?',
 'MVCC (Multi-Version Concurrency Control) allows multiple transactions to read and write data concurrently without locking.',
 'MVCC', '["multi version concurrency control","multiversion concurrency","multi-version concurrency control"]', 'hard', 4,
 'The acronym stands for a method where the database keeps several copies of a row — one per version.'),

('What horizontal scaling strategy partitions a large dataset across multiple independent database servers, with each server holding only a subset of the rows?',
 'Database sharding is a horizontal scaling technique that partitions data across multiple database instances.',
 'sharding', '["horizontal partitioning","data sharding","db sharding","horizontal scaling","database partitioning"]', 'hard', 5,
 'Imagine slicing a very large table into horizontal pieces and storing each piece on a different server.'),

('What category of database workload is optimised for executing complex, multi-dimensional queries over large historical datasets to support business intelligence and reporting?',
 'OLAP (Online Analytical Processing) is designed for complex analytical queries over large datasets.',
 'OLAP', '["online analytical processing","olap processing","analytical processing","data warehouse processing"]', 'hard', 6,
 'Think of it as the type of processing used in data warehouses and dashboards.'),

('What is the name for the step-by-step strategy that a database engine generates internally before it actually runs a SQL query, showing which indexes to use and how to perform joins?',
 'A query execution plan is the sequence of steps the database engine will follow to execute a SQL query.',
 'execution plan', '["query plan","explain plan","query execution plan","execution strategy"]', 'hard', 7,
 'You can reveal it by prepending the word EXPLAIN to any SQL query.');

-- Seed badges
INSERT INTO badges (name, description, iconEmoji, rarity, requiredXp, requiredQuestionsCompleted, requiredGamesCompleted, requiredStreak, requiredPerfectScores) VALUES
('First Steps',       'Complete your first question',      '🌱', 'common',    NULL, 1,    NULL, NULL, NULL),
('Quick Start',       'Complete your first full game',     '🌿', 'common',    NULL, NULL, 1,    NULL, NULL),
('Scholar',           'Answer 10 questions correctly',     '📖', 'common',    NULL, 10,   NULL, NULL, NULL),
('Dedicated Learner', 'Complete 5 games',                  '🎯', 'rare',      NULL, NULL, 5,    NULL, NULL),
('XP Hunter',         'Earn 500 XP',                       '⚡', 'rare',      500,  NULL, NULL, NULL, NULL),
('Streak Master',     'Maintain a 3-day streak',           '🔥', 'rare',      NULL, NULL, NULL, 3,    NULL),
('Perfectionist',     'Score 100% on a question',          '💎', 'rare',      NULL, NULL, NULL, NULL, 1),
('Database Expert',   'Answer 25 questions',               '🧠', 'epic',      NULL, 25,   NULL, NULL, NULL),
('Level 5 Scholar',   'Reach Level 5',                     '🏅', 'epic',      1600, NULL, NULL, NULL, NULL),
('Perfect Streak',    'Score 100% on 5 questions',         '🌟', 'epic',      NULL, NULL, NULL, NULL, 5),
('DB Master',         'Complete 10 games',                 '🏆', 'legendary', NULL, NULL, 10,   NULL, NULL),
('Grandmaster',       'Earn 2000 XP',                      '👑', 'legendary', 2000, NULL, NULL, NULL, NULL);

SELECT CONCAT('Questions: ', COUNT(*)) AS status FROM questions
UNION ALL
SELECT CONCAT('Badges: ', COUNT(*)) FROM badges;
