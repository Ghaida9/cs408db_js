USE cs408db;

DELETE FROM userAnswers;
DELETE FROM userBadges;
DELETE FROM gameSessions;
DELETE FROM userProgress;
DELETE FROM questions;
DELETE FROM badges;

ALTER TABLE questions AUTO_INCREMENT = 1;
ALTER TABLE badges AUTO_INCREMENT = 1;

INSERT INTO questions
  (questionText, modelAnswer, shortAnswer, difficulty, stageOrder, hint, acceptedVariations)
VALUES
  ('What is a primary key?','A primary key is a column (or set of columns) that uniquely identifies each row in a database table. It must be unique and cannot be NULL.','primary key','easy',1,'Think about what makes each row in a table unique and identifiable.','["pk", "unique key", "PK", "primary-key", "primary_key"]'),
  ('What does SQL stand for?','SQL stands for Structured Query Language. It is the standard language for managing and querying relational databases.','structured query language','easy',2,'It is a language used to communicate with databases — think about what kind of language it is.','["sql", "structured query lang", "query language", "structured query"]'),
  ('What is a foreign key?','A foreign key is a column in one table that references the primary key of another table, establishing a relationship between the two tables.','foreign key','easy',3,'It is a key that links two tables together by referencing another table.','["fk", "reference key", "referencing key", "foreign-key", "foreign_key"]'),
  ('What is normalization in databases?','Normalization is the process of organizing a database to reduce data redundancy and improve data integrity by dividing large tables into smaller related tables.','normalization','easy',4,'It is a process that organizes data to reduce repetition and dependency.','["normalisation", "normal form", "data normalization", "db normalization"]'),
  ('What is a database index?','A database index is a data structure that improves the speed of data retrieval operations on a table at the cost of additional storage space and write performance.','index','easy',5,'Think of it like the index at the back of a book — it helps you find things faster.','["db index", "database index", "indexing", "table index"]'),
  ('What is a NULL value in SQL?','NULL in SQL represents the absence of a value or an unknown value. It is not the same as zero or an empty string.','null','easy',6,'It represents the absence of any value — not zero, not empty, just missing.','["null value", "missing value", "unknown value", "absence of value", "no value"]'),
  ('What is a relational database?','A relational database is a type of database that stores and organizes data in tables (relations) with rows and columns, and uses SQL to manage the data.','relational database','easy',7,'It stores data in tables that can be related to each other.','["rdbms", "relational db", "relational model", "relational dbms"]'),
  ('What is a database transaction?','A database transaction is a sequence of one or more SQL operations that are executed as a single unit of work. It either completes fully (commit) or is fully undone (rollback).','transaction','medium',1,'Think of it as a group of operations that must all succeed or all fail together.','["db transaction", "atomic transaction", "acid transaction", "database transaction"]'),
  ('What does ACID stand for in database systems?','ACID stands for Atomicity, Consistency, Isolation, and Durability — the four key properties that guarantee reliable database transactions.','acid','medium',2,'It is an acronym for four properties that ensure reliable transactions: A, C, I, D.','["atomicity consistency isolation durability", "acid properties", "acid compliance", "acid acronym"]'),
  ('What is a JOIN in SQL?','A JOIN in SQL is used to combine rows from two or more tables based on a related column between them. Common types include INNER JOIN, LEFT JOIN, RIGHT JOIN, and FULL JOIN.','join','medium',3,'It is an SQL operation that combines data from multiple tables based on a common column.','["sql join", "table join", "inner join", "join operation"]'),
  ('What is database denormalization?','Denormalization is the process of intentionally introducing redundancy into a database by merging tables or adding redundant data to improve read performance.','denormalization','medium',4,'It is the opposite of normalization — adding redundancy to improve performance.','["denormalisation", "de-normalization", "denormalize", "de-normalisation"]'),
  ('What is a stored procedure?','A stored procedure is a precompiled collection of SQL statements stored in the database that can be executed as a single unit. It improves performance and code reuse.','stored procedure','medium',5,'It is a saved, reusable block of SQL code stored directly in the database.','["procedure", "sproc", "stored proc", "sp", "stored-procedure"]'),
  ('What is a database view?','A database view is a virtual table based on the result of a SQL query. It does not store data itself but presents data from one or more underlying tables.','view','medium',6,'It is like a saved query that behaves like a table but does not store data itself.','["virtual table", "db view", "sql view", "database view"]'),
  ('What is the difference between DELETE and TRUNCATE in SQL?','DELETE removes rows one at a time and logs each deletion (can be rolled back), while TRUNCATE removes all rows at once without logging individual row deletions (faster, cannot be rolled back in most databases).','truncate','medium',7,'One removes rows one by one with logging; the other removes all rows at once without logging.','["delete vs truncate", "truncate delete difference", "truncate faster"]'),
  ('What is a deadlock in database systems?','A deadlock occurs when two or more transactions are waiting for each other to release locks, creating a circular dependency where none of them can proceed.','deadlock','hard',1,'Imagine two transactions each holding a lock the other needs — neither can continue.','["dead lock", "circular wait", "deadlock situation", "mutual lock"]'),
  ('What is the CAP theorem?','The CAP theorem states that a distributed database system can only guarantee two of the three properties simultaneously: Consistency, Availability, and Partition tolerance.','cap theorem','hard',2,'It is a theorem about distributed systems involving three properties: C, A, and P.','["cap", "brewer theorem", "consistency availability partition", "cap theory"]'),
  ('What is a B-tree index?','A B-tree (Balanced Tree) index is a self-balancing tree data structure used in databases to maintain sorted data and allow searches, insertions, and deletions in O(log n) time.','b-tree','hard',3,'It is a balanced tree structure used to speed up data lookups in databases.','["btree", "balanced tree", "b tree index", "b-tree index", "balanced tree index"]'),
  ('What is MVCC in database systems?','MVCC (Multi-Version Concurrency Control) is a technique used by databases to allow multiple transactions to read and write data concurrently without locking, by maintaining multiple versions of data.','mvcc','hard',4,'It is a concurrency technique that keeps multiple versions of data to avoid locking conflicts.','["multi version concurrency control", "multiversion concurrency", "multi-version concurrency", "multi version control"]'),
  ('What is database sharding?','Database sharding is a horizontal scaling technique that partitions data across multiple database instances (shards), with each shard holding a subset of the total data.','sharding','hard',5,'It is a way to split a large database across multiple servers horizontally.','["horizontal partitioning", "data sharding", "db sharding", "horizontal scaling"]'),
  ('What is the difference between OLTP and OLAP?','OLTP (Online Transaction Processing) handles frequent, short transactions for day-to-day operations, while OLAP (Online Analytical Processing) handles complex queries for data analysis and reporting.','oltp olap','hard',6,'One is for everyday transactions; the other is for analytical queries and reporting.','["online transaction processing", "online analytical processing", "oltp vs olap", "transaction vs analytical"]'),
  ('What is a query execution plan?','A query execution plan is a sequence of steps the database engine uses to execute a SQL query. It shows how the database will access tables, use indexes, and join data to return results.','execution plan','hard',7,'It is the database engine''s step-by-step strategy for executing your SQL query.','["query plan", "explain plan", "query execution plan", "execution strategy"]');

INSERT INTO badges
  (name, description, iconEmoji, rarity, requiredXp, requiredQuestionsCompleted, requiredGamesCompleted, requiredStreak, requiredPerfectScores)
VALUES
  ('First Steps','Complete your first question','🌱','common',NULL,1,NULL,NULL,NULL),
  ('Quick Start','Complete your first full game','🚀','common',NULL,NULL,1,NULL,NULL),
  ('Scholar','Answer 10 questions correctly','📚','common',NULL,10,NULL,NULL,NULL),
  ('Dedicated Learner','Complete 5 games','🎯','rare',NULL,NULL,5,NULL,NULL),
  ('XP Hunter','Earn 500 XP','⚡','rare',500,NULL,NULL,NULL,NULL),
  ('Streak Master','Maintain a 3-day streak','🔥','rare',NULL,NULL,NULL,3,NULL),
  ('Perfectionist','Score 100% on a question','💎','rare',NULL,NULL,NULL,NULL,1),
  ('Database Expert','Answer 25 questions','🗄️','epic',NULL,25,NULL,NULL,NULL),
  ('Level 5 Scholar','Reach Level 5','🏅','epic',1600,NULL,NULL,NULL,NULL),
  ('Perfect Streak','Score 100% on 5 questions','🌟','epic',NULL,NULL,NULL,NULL,5),
  ('DB Master','Complete 10 games','🏆','legendary',NULL,NULL,10,NULL,NULL),
  ('Grandmaster','Earn 2000 XP','👑','legendary',2000,NULL,NULL,NULL,NULL);

SELECT CONCAT('Questions seeded: ', COUNT(*)) AS status FROM questions
UNION ALL
SELECT CONCAT('Badges seeded: ', COUNT(*)) FROM badges;
