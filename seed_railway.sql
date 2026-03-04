SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

USE railway;

DELETE FROM userAnswers;
DELETE FROM userBadges;
DELETE FROM gameSessions;
DELETE FROM userProgress;
DELETE FROM questions;
DELETE FROM badges;

ALTER TABLE questions AUTO_INCREMENT = 1;
ALTER TABLE badges AUTO_INCREMENT = 1;

-- â”€â”€â”€ EASY STAGE (7 questions) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Rule: the shortAnswer word/phrase must NOT appear in the questionText

INSERT INTO questions
  (questionText, modelAnswer, shortAnswer, difficulty, stageOrder, hint, acceptedVariations)
VALUES

  -- Q1 Easy: answer = "primary key" â€” question never says "primary key"
  ('In a relational table, which type of constraint ensures that every row can be uniquely identified and that the identifying column cannot contain a NULL value?',
   'A primary key is a column or set of columns that uniquely identifies every row in a table. It enforces uniqueness and disallows NULL values.',
   'primary key',
   'easy', 1,
   'Think about the one column that makes every row different from all others and can never be empty.',
   '["pk", "PK", "primary-key", "primary_key", "unique identifier"]'),

  -- Q2 Easy: answer = "SQL" â€” question never says "SQL"
  ('What is the name of the standardised declarative language used to create, read, update, and delete data in relational database management systems?',
   'SQL (Structured Query Language) is the standard language for interacting with relational databases, covering data definition, manipulation, and control.',
   'SQL',
   'easy', 2,
   'Its full name is three words: Structured, Query, and one more word that describes a language.',
   '["structured query language", "sequel", "SEQUEL", "query language"]'),

  -- Q3 Easy: answer = "foreign key" â€” question never says "foreign key"
  ('Which type of column constraint is used to link two tables together by storing the value of another table''s unique identifier, thereby enforcing referential integrity?',
   'A foreign key is a column in one table that references the primary key of another table, creating a relationship and enforcing referential integrity between the two tables.',
   'foreign key',
   'easy', 3,
   'It is a reference from one table pointing to the unique identifier of a different table.',
   '["fk", "FK", "reference key", "referencing key", "foreign-key", "foreign_key"]'),

  -- Q4 Easy: answer = "normalization" â€” question never says "normalization"
  ('What is the name of the design process that organises a relational schema into smaller, well-structured tables to eliminate redundant data and reduce update anomalies?',
   'Normalization is the process of structuring a relational database to reduce data redundancy and improve data integrity by decomposing large tables into smaller, related ones.',
   'normalization',
   'easy', 4,
   'Think of it as the process of putting data into its most organised, non-repetitive form â€” named after the concept of "normal forms".',
   '["normalisation", "data normalisation", "db normalization", "normal form process"]'),

  -- Q5 Easy: answer = "index" â€” question never says "index"
  ('Which database object is created on one or more columns of a table to speed up data retrieval at the cost of additional storage and slightly slower write operations?',
   'A database index is a data structure that improves the speed of data retrieval operations on a table at the cost of additional storage space and slower writes.',
   'index',
   'easy', 5,
   'Think of the alphabetical reference section at the back of a textbook that helps you find topics quickly.',
   '["db index", "database index", "indexing", "table index", "indices"]'),

  -- Q6 Easy: answer = "NULL" â€” question never says "NULL" or "null"
  ('In SQL, what special marker is used to represent the absence of any value in a column â€” distinct from zero or an empty string?',
   'NULL in SQL represents the absence of a value or an unknown value. It is not the same as zero or an empty string, and requires IS NULL or IS NOT NULL for comparison.',
   'NULL',
   'easy', 6,
   'It is a keyword that means "no value exists here" â€” not blank, not zero, simply unknown.',
   '["null value", "missing value", "unknown value", "absence of value", "no value"]'),

  -- Q7 Easy: answer = "RDBMS" â€” question never says "RDBMS" or "relational database"
  ('What category of database management system organises data into tables with rows and columns, enforces relationships between those tables, and uses a structured query language for data access?',
   'A Relational Database Management System (RDBMS) stores data in structured tables, enforces relationships through keys, and uses SQL for data manipulation. Examples include MySQL, PostgreSQL, and Oracle.',
   'RDBMS',
   'easy', 7,
   'The acronym stands for Relational Database Management System â€” examples include MySQL and PostgreSQL.',
   '["relational database management system", "relational dbms", "relational database system", "relational db"]'),

-- â”€â”€â”€ MEDIUM STAGE (7 questions) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  -- Q8 Medium: answer = "transaction" â€” question never says "transaction"
  ('In database systems, what term describes a sequence of one or more SQL operations that are treated as a single logical unit of work, either committing all changes or rolling them all back?',
   'A database transaction is a sequence of SQL operations executed as a single unit of work. It either completes fully (COMMIT) or is fully undone (ROLLBACK), ensuring data consistency.',
   'transaction',
   'medium', 1,
   'Think of a bank transfer: both the debit and the credit must succeed together, or neither should happen.',
   '["db transaction", "atomic transaction", "acid transaction", "database transaction"]'),

  -- Q9 Medium: answer = "ACID" â€” question never says "ACID"
  ('What four-letter acronym names the set of properties â€” Atomicity, Consistency, Isolation, and Durability â€” that guarantee reliable processing of database operations?',
   'ACID stands for Atomicity, Consistency, Isolation, and Durability â€” the four key properties that guarantee reliable and predictable database transactions.',
   'ACID',
   'medium', 2,
   'Each letter of this acronym stands for one of the four guarantees that make database transactions reliable.',
   '["atomicity consistency isolation durability", "acid properties", "acid compliance", "acid acronym"]'),

  -- Q10 Medium: answer = "JOIN" â€” question never says "join" or "JOIN"
  ('Which SQL operation is used to combine rows from two or more tables into a single result set based on a matching column value shared between them?',
   'A JOIN in SQL combines rows from two or more tables based on a related column. Common types include INNER, LEFT, RIGHT, and FULL OUTER, each controlling which unmatched rows are included.',
   'JOIN',
   'medium', 3,
   'It is the SQL keyword that lets you merge data from multiple tables in a single query result.',
   '["sql join", "table join", "inner join", "join operation", "INNER JOIN"]'),

  -- Q11 Medium: answer = "denormalization" â€” question never says "denormalization"
  ('What is the term for the deliberate process of introducing controlled redundancy into a database schema â€” for example by merging tables â€” in order to improve read query performance?',
   'Denormalization is the intentional introduction of redundancy into a database by merging tables or duplicating data, trading storage efficiency for faster read performance.',
   'denormalization',
   'medium', 4,
   'It is the reverse of the process that removes redundancy â€” here you are intentionally adding it back to gain speed.',
   '["denormalisation", "de-normalization", "denormalize", "de-normalisation"]'),

  -- Q12 Medium: answer = "stored procedure" â€” question never says "stored procedure"
  ('What is the name for a named, precompiled block of SQL statements saved directly inside the database server that can be invoked by name to improve performance and encourage code reuse?',
   'A stored procedure is a precompiled collection of SQL statements stored in the database that can be executed as a single unit. It improves performance through precompilation and promotes code reuse.',
   'stored procedure',
   'medium', 5,
   'Think of it as a reusable SQL function that lives inside the database itself rather than in application code.',
   '["procedure", "sproc", "stored proc", "sp", "stored-procedure"]'),

  -- Q13 Medium: answer = "view" â€” question never says "view"
  ('In SQL, what is the name of a named virtual table whose contents are defined by a saved query â€” it does not physically store data but presents it as if it were a real table?',
   'A database view is a virtual table defined by a stored SQL query. It does not store data itself but dynamically presents data from one or more underlying tables each time it is queried.',
   'view',
   'medium', 6,
   'It behaves like a table in queries but is actually just a saved SELECT statement with a name.',
   '["virtual table", "db view", "sql view", "database view", "virtual view"]'),

  -- Q14 Medium: answer = "TRUNCATE" â€” question never says "TRUNCATE" or "truncate"
  ('Which SQL command removes all rows from a table in a single operation without logging individual row deletions, making it faster than its row-by-row alternative but typically non-rollbackable?',
   'TRUNCATE removes all rows from a table at once without logging individual deletions. It is faster than DELETE for clearing a table but cannot be rolled back in most databases and resets auto-increment counters.',
   'TRUNCATE',
   'medium', 7,
   'Unlike DELETE, this command wipes the entire table in one shot and cannot easily be undone.',
   '["truncate table", "truncate statement", "sql truncate"]'),

-- â”€â”€â”€ HARD STAGE (7 questions) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  -- Q15 Hard: answer = "deadlock" â€” question never says "deadlock"
  ('What situation occurs in a database when two or more concurrent transactions are each waiting for the other to release a lock, creating a circular dependency from which none can proceed?',
   'A deadlock occurs when two or more transactions are each waiting for locks held by the other, forming a circular wait. The database must detect this and forcibly abort one transaction to break the cycle.',
   'deadlock',
   'hard', 1,
   'Picture two people each holding a key the other needs â€” neither can move forward without the other giving up first.',
   '["dead lock", "circular wait", "deadlock situation", "mutual lock", "circular dependency"]'),

  -- Q16 Hard: answer = "CAP theorem" â€” question never says "CAP" or "theorem"
  ('In distributed systems theory, what principle states that it is impossible for a distributed data store to simultaneously guarantee all three of: every node returning the latest data, every request receiving a response, and the system continuing to operate despite network partitions?',
   'The CAP theorem (Brewer''s theorem) states that a distributed database can only guarantee two of three properties at once: Consistency (every read gets the latest write), Availability (every request gets a response), and Partition tolerance (the system works despite network splits).',
   'CAP theorem',
   'hard', 2,
   'This is a famous result named after its three guarantees: Consistency, Availability, and Partition tolerance.',
   '["cap", "brewer theorem", "cap theory", "consistency availability partition tolerance"]'),

  -- Q17 Hard: answer = "B-tree" â€” question never says "B-tree" or "balanced tree"
  ('Which self-balancing tree data structure is most commonly used inside database engines to maintain sorted data and support searches, insertions, and deletions all in O(log n) time?',
   'A B-tree (Balanced Tree) is a self-balancing tree data structure used in database indexes to maintain sorted data and allow searches, insertions, and deletions in O(log n) time, keeping the tree height minimal.',
   'B-tree',
   'hard', 3,
   'Its name starts with the letter B and it is always kept at an even height so no path from root to leaf is much longer than another.',
   '["btree", "b tree", "b-tree index", "balanced tree index", "btree index"]'),

  -- Q18 Hard: answer = "MVCC" â€” question never says "MVCC" or "multi-version"
  ('What concurrency control technique used by databases such as PostgreSQL and Oracle allows readers and writers to operate simultaneously without blocking each other by maintaining multiple timestamped snapshots of each row?',
   'MVCC (Multi-Version Concurrency Control) allows multiple transactions to read and write data concurrently without locking by keeping multiple versions of each row. Readers see a consistent snapshot while writers create new versions.',
   'MVCC',
   'hard', 4,
   'The acronym stands for a method where the database keeps several copies of a row â€” one per version â€” so readers never block writers.',
   '["multi version concurrency control", "multiversion concurrency", "multi-version concurrency control", "multi version control"]'),

  -- Q19 Hard: answer = "sharding" â€” question never says "sharding" or "shard"
  ('What horizontal scaling strategy partitions a large dataset across multiple independent database servers, with each server holding only a subset of the rows, to distribute both storage and query load?',
   'Database sharding is a horizontal scaling technique that partitions data across multiple database instances. Each shard holds a subset of the data, distributing both storage requirements and query load across servers.',
   'sharding',
   'hard', 5,
   'Imagine slicing a very large table into horizontal pieces and storing each piece on a different server.',
   '["horizontal partitioning", "data sharding", "db sharding", "horizontal scaling", "database partitioning"]'),

  -- Q20 Hard: answer = "OLAP" â€” question never says "OLAP" or "analytical"
  ('What category of database workload is optimised for executing complex, multi-dimensional queries over large historical datasets to support business intelligence and reporting, as opposed to short, frequent transactional updates?',
   'OLAP (Online Analytical Processing) is designed for complex analytical queries over large datasets, typically used in data warehouses and business intelligence tools. It contrasts with OLTP, which handles frequent short transactions.',
   'OLAP',
   'hard', 6,
   'Think of it as the type of processing used in data warehouses and dashboards â€” the opposite of everyday transaction processing.',
   '["online analytical processing", "olap processing", "analytical processing", "data warehouse processing"]'),

  -- Q21 Hard: answer = "execution plan" â€” question never says "execution plan" or "plan"
  ('What is the name for the step-by-step strategy that a database engine generates internally â€” showing which indexes to use, how to order table scans, and how to perform joins â€” before it actually runs a SQL query?',
   'A query execution plan is the sequence of steps the database engine will follow to execute a SQL query. It details access methods, join strategies, and index usage, and can be inspected with EXPLAIN to diagnose slow queries.',
   'execution plan',
   'hard', 7,
   'You can reveal it by prepending the word EXPLAIN to any SQL query â€” it shows the engine''s internal road map.',
   '["query plan", "explain plan", "query execution plan", "execution strategy", "query plan"]');


-- â”€â”€â”€ BADGES (progression emojis: seed â†’ sprout â†’ book â†’ target â†’ bolt â†’ fire â†’ gem â†’ brain â†’ medal â†’ star â†’ trophy â†’ crown) â”€â”€â”€

INSERT INTO badges
  (name, description, iconEmoji, rarity, requiredXp, requiredQuestionsCompleted, requiredGamesCompleted, requiredStreak, requiredPerfectScores)
VALUES
  ('First Steps',       'Complete your first question',      'ðŸŒ±', 'common',    NULL, 1,    NULL, NULL, NULL),
  ('Quick Start',       'Complete your first full game',     'ðŸŒ¿', 'common',    NULL, NULL, 1,    NULL, NULL),
  ('Scholar',           'Answer 10 questions correctly',     'ðŸ“–', 'common',    NULL, 10,   NULL, NULL, NULL),
  ('Dedicated Learner', 'Complete 5 games',                  'ðŸŽ¯', 'rare',      NULL, NULL, 5,    NULL, NULL),
  ('XP Hunter',         'Earn 500 XP',                       'âš¡', 'rare',      500,  NULL, NULL, NULL, NULL),
  ('Streak Master',     'Maintain a 3-day streak',           'ðŸ”¥', 'rare',      NULL, NULL, NULL, 3,    NULL),
  ('Perfectionist',     'Score 100% on a question',          'ðŸ’Ž', 'rare',      NULL, NULL, NULL, NULL, 1),
  ('Database Expert',   'Answer 25 questions',               'ðŸ§ ', 'epic',      NULL, 25,   NULL, NULL, NULL),
  ('Level 5 Scholar',   'Reach Level 5',                     'ðŸ…', 'epic',      1600, NULL, NULL, NULL, NULL),
  ('Perfect Streak',    'Score 100% on 5 questions',         'ðŸŒŸ', 'epic',      NULL, NULL, NULL, NULL, 5),
  ('DB Master',         'Complete 10 games',                 'ðŸ†', 'legendary', NULL, NULL, 10,   NULL, NULL),
  ('Grandmaster',       'Earn 2000 XP',                      'ðŸ‘‘', 'legendary', 2000, NULL, NULL, NULL, NULL);

SELECT CONCAT('Questions seeded: ', COUNT(*)) AS status FROM questions
UNION ALL
SELECT CONCAT('Badges seeded: ', COUNT(*)) FROM badges;
