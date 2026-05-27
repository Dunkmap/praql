const LESSONS_DATA = {
  categories: [
    {
      id: 'db_design',
      name: 'Database Creation',
      icon: '🛠️',
      description: 'Learn how to create databases and understand data types',
      topics: [
        {
          id: 'create_database',
          title: 'CREATE DATABASE',
          explanation: 'The CREATE DATABASE statement is used to create a new SQL database. Choosing a good name is the first step in organizing your data.',
          why: 'Before you can create tables or store data, you must have a container for them. The database is that container. In many hosted environments, you might already have one, but knowing how to create one is essential for any developer.',
          syntax: 'CREATE DATABASE database_name;',
          example_query: "-- Note: SQLite (used here) creates databases as files, so this is illustrative\nCREATE DATABASE SQLMasterDB;\n-- To delete/drop it:\nDROP DATABASE SQLMasterDB;",
          dataset: 'employees',
          common_mistakes: [
            'Using reserved words for database names',
            'Missing semicolon at the end',
            'Forgetting that you need administrator permissions in many systems'
          ]
        },
        {
          id: 'data_types',
          title: 'Data Types (Characters)',
          explanation: 'Every column in a table must have a data type. Common types include: INT (integers), TEXT (strings), REAL (decimals), BLOB (binary), and DATE/DATETIME. This determines what kind of "characters" or data can be stored.',
          why: 'Choosing the right data type ensures data accuracy and saves storage space. For example, using a number type for age prevents someone from typing "Twenty" instead of 20.',
          syntax: '-- Examples of column definitions with types:\nid INT,\nname TEXT,\nprice REAL,\ncreated_at DATETIME',
          example_query: "-- Illustrating different types in a new table\nCREATE TABLE data_demo (\n  item_id INT PRIMARY KEY,\n  item_name TEXT,\n  item_price REAL,\n  is_available BOOLEAN,\n  added_on DATE\n);\n\nINSERT INTO data_demo VALUES (1, 'Premium SQL Course', 49.99, 1, '2024-03-12');\nSELECT * FROM data_demo;",
          dataset: 'employees',
          common_mistakes: [
            'Storing numbers as text (breaks mathematical functions)',
            'Not allocating enough precision for decimal values',
            'Using the wrong date format for the database engine'
          ]
        }
      ]
    },
    {
      id: 'basics',
      name: 'Database Basics',
      icon: '🏗️',
      description: 'Foundation concepts of SQL and databases',
      topics: [
        {
          id: 'what_is_sql',
          title: 'What is SQL?',
          explanation: 'SQL (Structured Query Language) is the standard language used to communicate with relational databases. It allows you to create, read, update, and delete data stored in tables.',
          why: 'SQL is the backbone of data management. Almost every application — from banking to social media — relies on SQL to store and retrieve data. Mastering SQL opens doors to data analysis, backend development, and database administration.',
          syntax: '-- SQL statements end with a semicolon\nSELECT column_name FROM table_name;',
          example_query: "SELECT 'Hello, SQL World!' AS greeting;",
          dataset: 'employees',
          common_mistakes: [
            'Forgetting the semicolon at the end of statements',
            'SQL keywords are case-insensitive but conventionally written in UPPERCASE'
          ]
        },
        {
          id: 'select',
          title: 'SELECT Statement',
          explanation: 'The SELECT statement is used to retrieve data from a database table. You can select specific columns or use * to select all columns.',
          why: 'SELECT is the most fundamental SQL command. Every query you write will start with SELECT. Understanding it is the first step to querying any database.',
          syntax: 'SELECT column1, column2 FROM table_name;\n-- or select all columns:\nSELECT * FROM table_name;',
          example_query: 'SELECT name, department FROM employees;',
          dataset: 'employees',
          common_mistakes: [
            'Using SELECT without FROM (except for computed values)',
            'Selecting columns that do not exist in the table',
            'Forgetting commas between column names'
          ]
        },
        {
          id: 'distinct',
          title: 'DISTINCT',
          explanation: 'The DISTINCT keyword eliminates duplicate rows from the result set. It returns only unique values.',
          why: 'Data often has duplicates — like multiple employees in the same department. DISTINCT helps you see only unique values, which is crucial for data analysis and reporting.',
          syntax: 'SELECT DISTINCT column_name FROM table_name;',
          example_query: 'SELECT DISTINCT department FROM employees;',
          dataset: 'employees',
          common_mistakes: [
            'Using DISTINCT on too many columns (it considers the combination of all columns)',
            'Thinking DISTINCT applies to only the first column — it applies to all selected columns'
          ]
        }
      ]
    },
    {
      id: 'filtering',
      name: 'Filtering Data',
      icon: '🔍',
      description: 'Learn to filter and narrow down query results',
      topics: [
        {
          id: 'where',
          title: 'WHERE Clause',
          explanation: 'The WHERE clause filters records based on specified conditions. Only rows that meet the condition are included in the result.',
          why: 'Without WHERE, SQL returns all rows in a table. WHERE lets you narrow down to exactly the data you need — like finding employees in a specific department or products above a certain price.',
          syntax: 'SELECT column FROM table WHERE condition;',
          example_query: "SELECT name, salary FROM employees WHERE department = 'IT';",
          dataset: 'employees',
          common_mistakes: [
            'Using WHERE with aggregate functions (use HAVING instead)',
            "Forgetting quotes around text values: WHERE name = 'John' not WHERE name = John",
            'Using = instead of IS for NULL comparisons'
          ]
        },
        {
          id: 'and_or_not',
          title: 'AND, OR, NOT',
          explanation: 'Logical operators combine multiple conditions in a WHERE clause. AND requires all conditions to be true. OR requires at least one. NOT negates a condition.',
          why: 'Real-world queries often need multiple conditions. Logical operators let you build complex filters — like finding high-salary employees in a specific department.',
          syntax: "SELECT * FROM table WHERE condition1 AND condition2;\nSELECT * FROM table WHERE condition1 OR condition2;\nSELECT * FROM table WHERE NOT condition;",
          example_query: "SELECT name, department, salary FROM employees WHERE department = 'IT' AND salary > 6000;",
          dataset: 'employees',
          common_mistakes: [
            'Confusing AND with OR — AND narrows results, OR broadens them',
            'Forgetting parentheses when mixing AND/OR: WHERE (a OR b) AND c',
            'Using NOT incorrectly with IN or BETWEEN'
          ]
        },
        {
          id: 'comparison',
          title: 'Comparison Operators',
          explanation: 'Comparison operators compare values in conditions: = (equal), > (greater than), < (less than), >= (greater than or equal), <= (less than or equal), != or <> (not equal).',
          why: 'Comparisons are the building blocks of filtering. You will use them in virtually every WHERE clause to compare numbers, text, and dates.',
          syntax: 'SELECT * FROM table WHERE column > value;\nSELECT * FROM table WHERE column != value;\nSELECT * FROM table WHERE column >= value;',
          example_query: 'SELECT name, salary FROM employees WHERE salary >= 5000 AND salary <= 6500;',
          dataset: 'employees',
          common_mistakes: [
            'Using = for assignment instead of comparison (SQL uses = for both depending on context)',
            "Not quoting string values: WHERE name = 'Alice' not WHERE name = Alice",
            'Using != when the standard SQL operator is <> (both usually work)'
          ]
        },
        {
          id: 'like',
          title: 'LIKE Pattern Matching',
          explanation: "LIKE is used in a WHERE clause to search for a specified pattern. Use % for zero or more characters, and _ for a single character.",
          why: "When you don't know the exact value — like searching for names starting with 'J' or emails containing 'company' — LIKE provides flexible pattern matching.",
          syntax: "SELECT * FROM table WHERE column LIKE pattern;\n-- % = any sequence of characters\n-- _ = any single character",
          example_query: "SELECT name, email FROM employees WHERE name LIKE 'J%';",
          dataset: 'employees',
          common_mistakes: [
            'Forgetting that LIKE is case-sensitive in some databases (not in SQLite)',
            'Using * instead of % — * works in search engines, % works in SQL',
            'Not using _ for single character matching when needed'
          ]
        },
        {
          id: 'between',
          title: 'BETWEEN',
          explanation: 'BETWEEN filters values within a specified range (inclusive of both endpoints). It works with numbers, text, and dates.',
          why: 'BETWEEN simplifies range queries. Instead of writing column >= 3000 AND column <= 7000, you can write column BETWEEN 3000 AND 7000.',
          syntax: 'SELECT * FROM table WHERE column BETWEEN value1 AND value2;',
          example_query: 'SELECT name, salary FROM employees WHERE salary BETWEEN 5000 AND 7000;',
          dataset: 'employees',
          common_mistakes: [
            'Forgetting that BETWEEN is inclusive on both ends',
            'Putting the larger value first (must be: BETWEEN low AND high)',
            'Using NOT BETWEEN incorrectly'
          ]
        },
        {
          id: 'in',
          title: 'IN Operator',
          explanation: 'The IN operator checks if a value matches any value in a list. It is shorthand for multiple OR conditions.',
          why: "Writing department = 'IT' OR department = 'HR' OR department = 'Finance' is verbose. IN simplifies this to department IN ('IT', 'HR', 'Finance').",
          syntax: "SELECT * FROM table WHERE column IN (value1, value2, value3);",
          example_query: "SELECT name, department FROM employees WHERE department IN ('IT', 'HR');",
          dataset: 'employees',
          common_mistakes: [
            'Forgetting parentheses around the value list',
            'Missing commas between values',
            'Forgetting quotes for text values in the list'
          ]
        },
        {
          id: 'null',
          title: 'IS NULL / IS NOT NULL',
          explanation: 'NULL represents missing or unknown data. Use IS NULL to find rows with NULL values and IS NOT NULL to find rows with values present.',
          why: 'NULL is special in SQL — it is not zero, not an empty string, and not false. Regular comparison operators (=, !=) do not work with NULL. You must use IS NULL.',
          syntax: 'SELECT * FROM table WHERE column IS NULL;\nSELECT * FROM table WHERE column IS NOT NULL;',
          example_query: 'SELECT name, manager_id FROM employees WHERE manager_id IS NULL;',
          dataset: 'employees',
          common_mistakes: [
            "Using = NULL instead of IS NULL — this will not work!",
            'Forgetting that NULL comparisons with = always return false',
            'Not handling NULLs in calculations (NULL + 5 = NULL)'
          ]
        }
      ]
    },
    {
      id: 'sorting_limiting',
      name: 'Sorting & Limiting',
      icon: '📊',
      description: 'Order and limit your query results',
      topics: [
        {
          id: 'order_by',
          title: 'ORDER BY',
          explanation: 'ORDER BY sorts the result set by one or more columns. Use ASC for ascending (default) and DESC for descending order.',
          why: 'Data in a database has no inherent order. ORDER BY lets you present data in a meaningful sequence — like showing highest salaries first or alphabetical name lists.',
          syntax: 'SELECT * FROM table ORDER BY column ASC;\nSELECT * FROM table ORDER BY column DESC;\nSELECT * FROM table ORDER BY col1, col2 DESC;',
          example_query: 'SELECT name, salary FROM employees ORDER BY salary DESC;',
          dataset: 'employees',
          common_mistakes: [
            'Forgetting that default order is ASC (ascending)',
            'Trying to ORDER BY columns not in SELECT when using DISTINCT',
            'Placing ORDER BY before WHERE (correct order: WHERE → ORDER BY)'
          ]
        },
        {
          id: 'limit_offset',
          title: 'LIMIT & OFFSET',
          explanation: 'LIMIT restricts the number of rows returned. OFFSET skips a specified number of rows before starting to return results. Combined, they enable pagination.',
          why: 'When a table has millions of rows, you do not want to load them all. LIMIT lets you fetch the top N results. OFFSET + LIMIT enables page-by-page browsing of data.',
          syntax: 'SELECT * FROM table LIMIT count;\nSELECT * FROM table LIMIT count OFFSET skip;\n-- Skip first 10, get next 5:\nSELECT * FROM table LIMIT 5 OFFSET 10;',
          example_query: 'SELECT name, salary FROM employees ORDER BY salary DESC LIMIT 5;',
          dataset: 'employees',
          common_mistakes: [
            'Using OFFSET without ORDER BY (results may be unpredictable)',
            'Confusing LIMIT and OFFSET order in some databases',
            'Forgetting that OFFSET starts from 0'
          ]
        }
      ]
    },
    {
      id: 'aggregation',
      name: 'Aggregation',
      icon: '📈',
      description: 'Summarize data with aggregate functions',
      topics: [
        {
          id: 'count',
          title: 'COUNT',
          explanation: 'COUNT returns the number of rows that match a condition. COUNT(*) counts all rows, COUNT(column) counts non-NULL values in that column.',
          why: 'Counting is fundamental to data analysis. How many employees? How many orders this month? COUNT gives you these answers quickly.',
          syntax: 'SELECT COUNT(*) FROM table;\nSELECT COUNT(column) FROM table;\nSELECT COUNT(DISTINCT column) FROM table;',
          example_query: 'SELECT COUNT(*) AS total_employees FROM employees;',
          dataset: 'employees',
          common_mistakes: [
            'Confusing COUNT(*) with COUNT(column) — the latter ignores NULLs',
            'Using COUNT in WHERE instead of HAVING',
            'Forgetting parentheses: COUNT* instead of COUNT(*)'
          ]
        },
        {
          id: 'sum_avg',
          title: 'SUM & AVG',
          explanation: 'SUM calculates the total of numeric values. AVG calculates the arithmetic mean. Both ignore NULL values.',
          why: 'Totals and averages are the most common calculations in reporting. What is the total revenue? What is the average salary? SUM and AVG answer these questions.',
          syntax: 'SELECT SUM(column) FROM table;\nSELECT AVG(column) FROM table;\nSELECT SUM(column) AS total, AVG(column) AS average FROM table;',
          example_query: 'SELECT SUM(salary) AS total_salary, AVG(salary) AS avg_salary FROM employees;',
          dataset: 'employees',
          common_mistakes: [
            'Using SUM/AVG on non-numeric columns',
            'Forgetting that NULLs are excluded from AVG calculations',
            'Not using aliases to name the result columns'
          ]
        },
        {
          id: 'min_max',
          title: 'MIN & MAX',
          explanation: 'MIN returns the smallest value and MAX returns the largest value in a column. They work with numbers, text (alphabetical order), and dates.',
          why: 'Finding extremes is a common need — the highest salary, earliest hire date, cheapest product. MIN and MAX provide these answers efficiently.',
          syntax: 'SELECT MIN(column) FROM table;\nSELECT MAX(column) FROM table;\nSELECT MIN(column) AS minimum, MAX(column) AS maximum FROM table;',
          example_query: 'SELECT MIN(salary) AS lowest, MAX(salary) AS highest FROM employees;',
          dataset: 'employees',
          common_mistakes: [
            'Expecting MIN/MAX to return the entire row (they only return the single value)',
            'Using MIN/MAX on columns with mixed data types',
            'Forgetting that MIN/MAX ignore NULL values'
          ]
        },
        {
          id: 'group_by',
          title: 'GROUP BY',
          explanation: 'GROUP BY groups rows with the same values into summary rows. It is used with aggregate functions (COUNT, SUM, AVG, MIN, MAX) to perform calculations per group.',
          why: 'Instead of getting one total for the whole table, GROUP BY lets you get totals per category — like salary sum per department or order count per customer.',
          syntax: 'SELECT column, COUNT(*) FROM table GROUP BY column;\nSELECT column, SUM(value) FROM table GROUP BY column;',
          example_query: 'SELECT department, COUNT(*) AS emp_count, AVG(salary) AS avg_salary FROM employees GROUP BY department;',
          dataset: 'employees',
          common_mistakes: [
            'Selecting columns not in GROUP BY or not aggregated — this is an error in most databases',
            'Placing GROUP BY before WHERE (correct order: WHERE → GROUP BY)',
            'Using WHERE to filter groups instead of HAVING'
          ]
        },
        {
          id: 'having',
          title: 'HAVING',
          explanation: 'HAVING filters groups created by GROUP BY based on aggregate conditions. It is like WHERE, but for groups.',
          why: 'WHERE filters individual rows before grouping. But what if you want to find departments with more than 3 employees? You need HAVING to filter after grouping.',
          syntax: 'SELECT column, COUNT(*) FROM table\nGROUP BY column\nHAVING COUNT(*) > value;',
          example_query: 'SELECT department, COUNT(*) AS emp_count FROM employees GROUP BY department HAVING COUNT(*) >= 3;',
          dataset: 'employees',
          common_mistakes: [
            'Using WHERE instead of HAVING for aggregate conditions',
            'Placing HAVING before GROUP BY',
            'Using column aliases in HAVING (not supported in all databases)'
          ]
        }
      ]
    },
    {
      id: 'joins',
      name: 'Joins',
      icon: '🔗',
      description: 'Combine data from multiple tables',
      topics: [
        {
          id: 'inner_join',
          title: 'INNER JOIN',
          explanation: 'INNER JOIN returns only the rows that have matching values in both tables. If there is no match, the row is excluded from the result.',
          why: 'Data is often split across multiple tables (normalization). INNER JOIN combines them back together — like connecting orders to customer names.',
          syntax: 'SELECT a.col, b.col\nFROM table_a a\nINNER JOIN table_b b ON a.key = b.key;',
          example_query: 'SELECT o.id, c.name, o.total_amount\nFROM orders o\nINNER JOIN customers c ON o.customer_id = c.id;',
          dataset: 'orders',
          common_mistakes: [
            'Forgetting the ON clause — this causes a cross join',
            'Not using table aliases when column names are ambiguous',
            'Joining on the wrong columns'
          ]
        },
        {
          id: 'left_join',
          title: 'LEFT JOIN',
          explanation: 'LEFT JOIN returns all rows from the left table and matched rows from the right table. If no match, NULL values fill the right side.',
          why: 'Sometimes you want all records from the primary table even if they have no matches — like all customers, even those with no orders.',
          syntax: 'SELECT a.col, b.col\nFROM table_a a\nLEFT JOIN table_b b ON a.key = b.key;',
          example_query: 'SELECT c.name, o.id AS order_id, o.total_amount\nFROM customers c\nLEFT JOIN orders o ON c.id = o.customer_id;',
          dataset: 'orders',
          common_mistakes: [
            'Confusing which table is "left" (the one listed first)',
            'Adding WHERE conditions on the right table that eliminate NULLs (negating the LEFT JOIN)',
            'Using LEFT JOIN when INNER JOIN would be more efficient'
          ]
        },
        {
          id: 'right_join',
          title: 'RIGHT JOIN',
          explanation: 'RIGHT JOIN returns all rows from the right table and matched rows from the left table. It is the mirror of LEFT JOIN. Note: SQLite does not support RIGHT JOIN natively, but you can achieve the same result by swapping the table order and using LEFT JOIN.',
          why: 'RIGHT JOIN is less common but useful when the "important" table is listed second. In practice, most developers prefer LEFT JOIN with swapped table order.',
          syntax: '-- Equivalent using LEFT JOIN (swap table order):\nSELECT o.id, c.name\nFROM orders o\nLEFT JOIN customers c ON c.id = o.customer_id;',
          example_query: 'SELECT o.id, c.name, o.total_amount\nFROM customers c\nLEFT JOIN orders o ON c.id = o.customer_id\nWHERE o.id IS NOT NULL;',
          dataset: 'orders',
          common_mistakes: [
            'Forgetting which table is "right" (listed second)',
            'Using RIGHT JOIN in SQLite (not supported — use LEFT JOIN with swapped order)',
            'Confusing RIGHT JOIN behavior with INNER JOIN'
          ]
        },
        {
          id: 'full_join',
          title: 'FULL OUTER JOIN',
          explanation: 'FULL OUTER JOIN returns all rows from both tables. Matched rows are combined, unmatched rows show NULL on the missing side. In SQLite, you can simulate this with UNION of LEFT JOIN and a filtered select.',
          why: 'When you need to see ALL records from both tables — even those without matches — FULL JOIN gives a complete picture. It is useful for data reconciliation.',
          syntax: '-- Simulated in SQLite:\nSELECT a.col, b.col FROM a LEFT JOIN b ON a.id = b.a_id\nUNION\nSELECT a.col, b.col FROM b LEFT JOIN a ON a.id = b.a_id\nWHERE a.id IS NULL;',
          example_query: "SELECT c.name AS customer, o.id AS order_id\nFROM customers c\nLEFT JOIN orders o ON c.id = o.customer_id\nUNION\nSELECT 'No Customer', o.id\nFROM orders o\nWHERE o.customer_id NOT IN (SELECT id FROM customers);",
          dataset: 'orders',
          common_mistakes: [
            'Forgetting that FULL JOIN is not supported in SQLite',
            'Not handling NULL values in the result',
            'Confusing FULL JOIN with CROSS JOIN'
          ]
        },
        {
          id: 'cross_join',
          title: 'CROSS JOIN',
          explanation: 'CROSS JOIN produces a Cartesian product — every row from the first table paired with every row from the second table. With 10 rows × 5 rows, you get 50 result rows.',
          why: 'Cross joins are useful for generating all possible combinations — like combining every product with every store, or creating test data.',
          syntax: 'SELECT a.col, b.col\nFROM table_a a\nCROSS JOIN table_b b;',
          example_query: "SELECT DISTINCT e1.department AS dept1, e2.department AS dept2\nFROM employees e1\nCROSS JOIN employees e2\nWHERE e1.department < e2.department;",
          dataset: 'employees',
          common_mistakes: [
            'Accidentally creating a cross join by forgetting the ON clause in INNER JOIN',
            'Using CROSS JOIN on large tables (the result can be enormous)',
            'Confusing CROSS JOIN with FULL OUTER JOIN'
          ]
        },
        {
          id: 'self_join',
          title: 'SELF JOIN',
          explanation: 'A SELF JOIN is a table joined with itself. It uses aliases to distinguish the two "copies" of the table. It is not a separate keyword — you use INNER JOIN or LEFT JOIN with the same table.',
          why: 'Self joins are essential for hierarchical data — like finding an employee and their manager (who is also in the employees table) or comparing rows within the same table.',
          syntax: 'SELECT a.col, b.col\nFROM table a\nINNER JOIN table b ON a.ref_id = b.id;',
          example_query: 'SELECT e.name AS employee, m.name AS manager\nFROM employees e\nLEFT JOIN employees m ON e.manager_id = m.id;',
          dataset: 'employees',
          common_mistakes: [
            'Forgetting to use different aliases for the two copies',
            'Creating infinite loops with incorrect join conditions',
            'Not using LEFT JOIN when some rows may not have matches'
          ]
        }
      ]
    },
    {
      id: 'subqueries',
      name: 'Subqueries',
      icon: '🎯',
      description: 'Queries nested inside other queries',
      topics: [
        {
          id: 'subquery_basics',
          title: 'Subquery Basics',
          explanation: 'A subquery is a query nested inside another query. It can appear in SELECT, FROM, or WHERE clauses. The inner query executes first, and its result feeds into the outer query.',
          why: 'Some problems require multi-step logic — like finding employees who earn more than the average salary. Subqueries let you break complex questions into manageable steps.',
          syntax: 'SELECT * FROM table\nWHERE column > (SELECT AVG(column) FROM table);',
          example_query: 'SELECT name, salary FROM employees\nWHERE salary > (SELECT AVG(salary) FROM employees);',
          dataset: 'employees',
          common_mistakes: [
            'Subquery returning multiple rows where a single value is expected',
            'Not using aliases for subqueries in the FROM clause',
            'Performance issues with correlated subqueries'
          ]
        },
        {
          id: 'exists',
          title: 'EXISTS',
          explanation: 'EXISTS checks if a subquery returns any rows. It returns TRUE if the subquery has results, FALSE otherwise. It is often used with correlated subqueries.',
          why: 'EXISTS is efficient for checking the existence of related data — like finding customers who have placed at least one order, without loading the actual order data.',
          syntax: 'SELECT * FROM table_a a\nWHERE EXISTS (\n  SELECT 1 FROM table_b b\n  WHERE b.a_id = a.id\n);',
          example_query: 'SELECT name FROM customers c\nWHERE EXISTS (\n  SELECT 1 FROM orders o\n  WHERE o.customer_id = c.id\n);',
          dataset: 'orders',
          common_mistakes: [
            'Not correlating the subquery with the outer query',
            'Using SELECT * in EXISTS (SELECT 1 is sufficient and faster)',
            'Confusing EXISTS with IN — EXISTS checks for existence, IN checks values'
          ]
        },
        {
          id: 'in_subquery',
          title: 'IN Subquery',
          explanation: 'The IN operator can use a subquery instead of a static list. The subquery returns a set of values, and the outer query checks if a value exists in that set.',
          why: 'IN subqueries let you dynamically generate the comparison list. Instead of hardcoding department names, you can query them from another table or condition.',
          syntax: 'SELECT * FROM table_a\nWHERE column IN (SELECT column FROM table_b WHERE condition);',
          example_query: "SELECT name, department FROM employees\nWHERE department IN (\n  SELECT department FROM employees\n  GROUP BY department\n  HAVING COUNT(*) >= 3\n);",
          dataset: 'employees',
          common_mistakes: [
            'Using IN instead of EXISTS for large result sets (EXISTS can be faster)',
            'IN subquery returning NULL values (may cause unexpected results)',
            'Not considering performance for large subquery results'
          ]
        },
        {
          id: 'correlated_subquery',
          title: 'Correlated Subqueries',
          explanation: 'A correlated subquery references columns from the outer query. Unlike regular subqueries, it executes once for each row of the outer query.',
          why: 'Correlated subqueries solve row-by-row comparison problems — like finding employees who earn more than the average of their department.',
          syntax: 'SELECT * FROM table_a a\nWHERE column > (\n  SELECT AVG(column) FROM table_a b\n  WHERE b.group = a.group\n);',
          example_query: 'SELECT name, department, salary FROM employees e1\nWHERE salary > (\n  SELECT AVG(salary) FROM employees e2\n  WHERE e2.department = e1.department\n);',
          dataset: 'employees',
          common_mistakes: [
            'Not understanding the performance impact (runs per row)',
            'Forgetting to correlate the subquery properly',
            'Using correlated subqueries when a JOIN would be simpler and faster'
          ]
        }
      ]
    },
    {
      id: 'set_operations',
      name: 'Set Operations & Logic',
      icon: '🔀',
      description: 'Combine results and conditional logic',
      topics: [
        {
          id: 'union',
          title: 'UNION',
          explanation: 'UNION combines the result sets of two or more SELECT statements, removing duplicates. Both queries must have the same number of columns with compatible data types.',
          why: 'UNION is useful when data is split across similar tables or when you need to combine different filtered views of the same table into one result.',
          syntax: 'SELECT col FROM table_a\nUNION\nSELECT col FROM table_b;',
          example_query: "SELECT name, 'Employee' AS type FROM employees WHERE salary > 6000\nUNION\nSELECT name, 'Customer' AS type FROM customers WHERE country = 'USA';",
          dataset: 'orders',
          common_mistakes: [
            'Different number of columns in the two SELECT statements',
            'Column data types not being compatible',
            'Forgetting that UNION removes duplicates (use UNION ALL to keep them)'
          ]
        },
        {
          id: 'union_all',
          title: 'UNION ALL',
          explanation: 'UNION ALL is like UNION but keeps all rows, including duplicates. It is faster than UNION because it does not need to check for and remove duplicates.',
          why: 'When you know there are no duplicates, or you want to keep them all, UNION ALL is more efficient. It is preferred for performance when deduplication is unnecessary.',
          syntax: 'SELECT col FROM table_a\nUNION ALL\nSELECT col FROM table_b;',
          example_query: "SELECT department AS category, COUNT(*) AS count FROM employees GROUP BY department\nUNION ALL\nSELECT category, COUNT(*) FROM products GROUP BY category;",
          dataset: 'orders',
          common_mistakes: [
            'Using UNION when UNION ALL would suffice (unnecessary performance cost)',
            'Assuming UNION ALL removes duplicates',
            'Not aliasing columns properly (result uses first query column names)'
          ]
        },
        {
          id: 'case',
          title: 'CASE Expression',
          explanation: "CASE provides if-then-else logic within SQL. It evaluates conditions in order and returns the result for the first true condition. If no condition matches, it returns the ELSE value (or NULL if no ELSE).",
          why: 'CASE lets you transform data on the fly — categorizing salaries as High/Medium/Low, converting codes to readable labels, or computing conditional values.',
          syntax: "SELECT\n  CASE\n    WHEN condition1 THEN result1\n    WHEN condition2 THEN result2\n    ELSE default_result\n  END AS alias\nFROM table;",
          example_query: "SELECT name, salary,\n  CASE\n    WHEN salary >= 7000 THEN 'High'\n    WHEN salary >= 5000 THEN 'Medium'\n    ELSE 'Low'\n  END AS salary_tier\nFROM employees;",
          dataset: 'employees',
          common_mistakes: [
            'Forgetting the END keyword to close the CASE',
            'Not providing an ELSE (returns NULL by default)',
            'Putting CASE in WHERE instead of using regular conditions'
          ]
        }
      ]
    },
    {
      id: 'dml',
      name: 'Data Manipulation',
      icon: '✏️',
      description: 'Insert, update, and delete data',
      topics: [
        {
          id: 'insert',
          title: 'INSERT INTO',
          explanation: 'INSERT INTO adds new rows to a table. You can insert specific column values or all values in column order.',
          why: 'Every database needs data added to it. INSERT is how you populate tables — from user registrations to logging events.',
          syntax: "INSERT INTO table (col1, col2) VALUES (val1, val2);\nINSERT INTO table VALUES (val1, val2, val3);",
          example_query: "INSERT INTO employees (id, name, department, salary, age, city)\nVALUES (99, 'Sam Wilson', 'IT', 5800, 29, 'New York');\n\nSELECT * FROM employees WHERE id = 99;",
          dataset: 'employees',
          common_mistakes: [
            'Not matching value count to column count',
            'Forgetting quotes around text values',
            'Violating UNIQUE or PRIMARY KEY constraints',
            'Inserting wrong data types'
          ]
        },
        {
          id: 'update',
          title: 'UPDATE',
          explanation: 'UPDATE modifies existing data in a table. Always use a WHERE clause to specify which rows to update — without it, ALL rows will be changed.',
          why: 'Data changes over time — employees get raises, orders change status, customers update their info. UPDATE handles these modifications.',
          syntax: "UPDATE table SET col1 = val1, col2 = val2\nWHERE condition;",
          example_query: "UPDATE employees SET salary = salary + 500\nWHERE department = 'IT';\n\nSELECT name, salary FROM employees WHERE department = 'IT';",
          dataset: 'employees',
          common_mistakes: [
            'Forgetting the WHERE clause (updates ALL rows!)',
            'Updating the wrong column',
            'Not testing with SELECT first before running UPDATE'
          ]
        },
        {
          id: 'delete',
          title: 'DELETE',
          explanation: 'DELETE removes rows from a table. Always use WHERE to specify which rows to delete. Without WHERE, ALL rows are deleted.',
          why: 'Removing old records, cleaning up test data, or allowing users to delete their accounts — DELETE is essential for data lifecycle management.',
          syntax: 'DELETE FROM table WHERE condition;',
          example_query: "DELETE FROM employees WHERE id = 16;\n\nSELECT COUNT(*) AS remaining FROM employees;",
          dataset: 'employees',
          common_mistakes: [
            'Forgetting the WHERE clause (deletes ALL rows!)',
            'Not backing up data before deleting',
            'Deleting rows that are referenced by foreign keys in other tables'
          ]
        }
      ]
    },
    {
      id: 'ddl',
      name: 'Table Operations',
      icon: '🏛️',
      description: 'Create, alter, and manage tables',
      topics: [
        {
          id: 'create_table',
          title: 'CREATE TABLE',
          explanation: 'CREATE TABLE defines a new table with column names, data types, and optional constraints.',
          why: 'Before you can store any data, you need a table. CREATE TABLE is the foundation of database design — defining the structure that holds your data.',
          syntax: 'CREATE TABLE table_name (\n  column1 datatype constraint,\n  column2 datatype,\n  column3 datatype DEFAULT value\n);',
          example_query: "CREATE TABLE projects (\n  id INTEGER PRIMARY KEY,\n  name TEXT NOT NULL,\n  budget REAL DEFAULT 0,\n  status TEXT DEFAULT 'active'\n);\n\nINSERT INTO projects VALUES (1, 'Website Redesign', 50000, 'active');\nINSERT INTO projects VALUES (2, 'Mobile App', 75000, 'planning');\n\nSELECT * FROM projects;",
          dataset: 'employees',
          common_mistakes: [
            'Not specifying data types',
            'Creating a table that already exists (use IF NOT EXISTS)',
            'Choosing inappropriate data types for columns'
          ]
        },
        {
          id: 'alter_table',
          title: 'ALTER TABLE',
          explanation: 'ALTER TABLE modifies an existing table structure. You can add columns, rename the table, or rename columns (SQLite has limited ALTER TABLE support).',
          why: 'As requirements change, tables need to evolve. ALTER TABLE lets you add new columns without recreating the entire table and losing data.',
          syntax: 'ALTER TABLE table_name ADD COLUMN column_name datatype;\nALTER TABLE table_name RENAME TO new_name;\nALTER TABLE table_name RENAME COLUMN old_name TO new_name;',
          example_query: "CREATE TABLE IF NOT EXISTS temp_staff (\n  id INTEGER, name TEXT, role TEXT\n);\nALTER TABLE temp_staff ADD COLUMN hired_date TEXT;\n\nINSERT INTO temp_staff VALUES (1, 'Test User', 'Intern', '2023-01-01');\nSELECT * FROM temp_staff;",
          dataset: 'employees',
          common_mistakes: [
            'Trying to drop columns in SQLite (not supported in older versions)',
            'Adding a NOT NULL column without a default value to a populated table',
            'Forgetting that ALTER TABLE has limited functionality in SQLite'
          ]
        },
        {
          id: 'drop_table',
          title: 'DROP TABLE',
          explanation: 'DROP TABLE permanently removes a table and all its data from the database. Use IF EXISTS to prevent errors if the table does not exist.',
          why: 'Sometimes tables are no longer needed — temporary tables, old schemas, or test data. DROP TABLE cleans these up completely.',
          syntax: 'DROP TABLE table_name;\nDROP TABLE IF EXISTS table_name;',
          example_query: "CREATE TABLE temp_data (id INTEGER, value TEXT);\nINSERT INTO temp_data VALUES (1, 'test');\nSELECT * FROM temp_data;\n-- This would delete it:\n-- DROP TABLE temp_data;",
          dataset: 'employees',
          common_mistakes: [
            'Dropping a table without backing up data',
            'Dropping a table referenced by foreign keys',
            'Not using IF EXISTS (causes error if table does not exist)'
          ]
        },
        {
          id: 'constraints',
          title: 'Constraints',
          explanation: 'Constraints enforce rules on table columns: PRIMARY KEY (unique identifier), FOREIGN KEY (reference to another table), UNIQUE (no duplicates), NOT NULL (required), DEFAULT (fallback value), CHECK (value validation).',
          why: 'Constraints protect data integrity. They prevent invalid data from entering the database — like duplicate IDs, missing required fields, or invalid references.',
          syntax: "CREATE TABLE table (\n  id INTEGER PRIMARY KEY,\n  name TEXT NOT NULL,\n  email TEXT UNIQUE,\n  dept_id INTEGER REFERENCES departments(id),\n  status TEXT DEFAULT 'active',\n  age INTEGER CHECK(age >= 0)\n);",
          example_query: "CREATE TABLE departments (\n  id INTEGER PRIMARY KEY,\n  name TEXT NOT NULL UNIQUE,\n  budget REAL DEFAULT 0 CHECK(budget >= 0)\n);\n\nINSERT INTO departments VALUES (1, 'Engineering', 100000);\nINSERT INTO departments VALUES (2, 'Marketing', 50000);\n\nSELECT * FROM departments;",
          dataset: 'employees',
          common_mistakes: [
            'Adding constraints after data already violates them',
            'Not understanding that PRIMARY KEY implies UNIQUE and NOT NULL',
            'Forgetting that FOREIGN KEY enforcement may be disabled by default in SQLite'
          ]
        },
        {
          id: 'create_index',
          title: 'CREATE INDEX',
          explanation: 'An index speeds up data retrieval by creating a lookup structure on one or more columns. It is like a book index — instead of scanning every page, you jump to the right section.',
          why: 'Without indexes, the database scans every row to find matches (full table scan). With indexes on frequently queried columns, lookups become dramatically faster.',
          syntax: 'CREATE INDEX index_name ON table_name (column_name);\nCREATE UNIQUE INDEX index_name ON table_name (column_name);\nDROP INDEX index_name;',
          example_query: "CREATE INDEX idx_emp_dept ON employees (department);\nCREATE INDEX idx_emp_salary ON employees (salary);\n\n-- The index speeds up this query:\nSELECT name, salary FROM employees WHERE department = 'IT' AND salary > 5000;",
          dataset: 'employees',
          common_mistakes: [
            'Creating too many indexes (slow down INSERT/UPDATE)',
            'Not indexing columns used frequently in WHERE and JOIN',
            'Creating indexes on very small tables (no benefit)'
          ]
        }
      ]
    },
    {
      id: 'window_functions',
      name: 'Window Functions',
      icon: '🪟',
      description: 'Advanced calculations across row sets',
      topics: [
        {
          id: 'row_number',
          title: 'ROW_NUMBER()',
          explanation: 'ROW_NUMBER assigns a unique sequential number to each row within a partition, ordered by specified columns. Numbers restart at 1 for each partition.',
          why: 'ROW_NUMBER is essential for pagination, ranking, identifying duplicates, and selecting the top N items per group.',
          syntax: 'SELECT\n  ROW_NUMBER() OVER (ORDER BY column) AS row_num,\n  columns\nFROM table;\n\n-- With partition:\nSELECT\n  ROW_NUMBER() OVER (\n    PARTITION BY group_col\n    ORDER BY sort_col\n  ) AS row_num\nFROM table;',
          example_query: 'SELECT\n  ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC) AS dept_rank,\n  name, department, salary\nFROM employees;',
          dataset: 'employees',
          common_mistakes: [
            'Forgetting the OVER clause (required for all window functions)',
            'Not specifying ORDER BY inside OVER (results may be unpredictable)',
            'Confusing ROW_NUMBER with RANK (ROW_NUMBER has no gaps)'
          ]
        },
        {
          id: 'rank_dense_rank',
          title: 'RANK & DENSE_RANK',
          explanation: 'RANK assigns ranks with gaps for ties (1, 2, 2, 4). DENSE_RANK assigns ranks without gaps for ties (1, 2, 2, 3). Both assign the same rank to ties.',
          why: 'When ranking data with ties — like students with the same score — you need to decide if the next rank should skip numbers (RANK) or continue sequentially (DENSE_RANK).',
          syntax: 'SELECT\n  RANK() OVER (ORDER BY column DESC) AS rank,\n  DENSE_RANK() OVER (ORDER BY column DESC) AS dense_rank,\n  columns\nFROM table;',
          example_query: 'SELECT\n  name, salary,\n  RANK() OVER (ORDER BY salary DESC) AS salary_rank,\n  DENSE_RANK() OVER (ORDER BY salary DESC) AS salary_dense_rank\nFROM employees;',
          dataset: 'employees',
          common_mistakes: [
            'Confusing RANK with DENSE_RANK — RANK skips numbers after ties',
            'Not understanding that ROW_NUMBER never has ties',
            'Using RANK in WHERE (window functions cannot be in WHERE — use a subquery)'
          ]
        },
        {
          id: 'ntile',
          title: 'NTILE',
          explanation: 'NTILE divides the result set into a specified number of approximately equal groups (tiles/buckets) and assigns a group number to each row.',
          why: 'NTILE is useful for dividing data into percentiles, quartiles, or any equal groups — like splitting employees into salary quartiles for bonus calculations.',
          syntax: 'SELECT\n  NTILE(n) OVER (ORDER BY column) AS tile,\n  columns\nFROM table;',
          example_query: 'SELECT\n  name, salary,\n  NTILE(4) OVER (ORDER BY salary) AS salary_quartile\nFROM employees;',
          dataset: 'employees',
          common_mistakes: [
            'Expecting exactly equal groups (may differ by 1 row)',
            'Using NTILE(1) — puts everything in one group',
            'Not ordering before applying NTILE'
          ]
        },
        {
          id: 'lead_lag',
          title: 'LEAD & LAG',
          explanation: 'LAG accesses a previous row value. LEAD accesses a next row value. Both follow the order specified in the OVER clause. You can specify how many rows to look ahead/behind.',
          why: 'Comparing a row with its predecessor or successor is common — like calculating day-over-day changes, salary differences between consecutive employees, or tracking trends.',
          syntax: 'SELECT\n  column,\n  LAG(column, 1) OVER (ORDER BY sort_col) AS prev_value,\n  LEAD(column, 1) OVER (ORDER BY sort_col) AS next_value\nFROM table;',
          example_query: 'SELECT\n  name, salary,\n  LAG(salary) OVER (ORDER BY salary) AS prev_salary,\n  salary - LAG(salary) OVER (ORDER BY salary) AS diff\nFROM employees\nORDER BY salary;',
          dataset: 'employees',
          common_mistakes: [
            'Not specifying ORDER BY (results undefined)',
            'Forgetting that the first row has NULL for LAG and last row has NULL for LEAD',
            'Not providing a default value for edge rows'
          ]
        },
        {
          id: 'window_aggregates',
          title: 'Window Aggregates (SUM/AVG OVER)',
          explanation: 'Regular aggregate functions (SUM, AVG, COUNT, MIN, MAX) can be used as window functions with OVER. This lets you calculate running totals, moving averages, and group-level values alongside individual rows.',
          why: 'Unlike GROUP BY which collapses rows, window aggregates preserve individual rows while adding calculated values — like showing each sale alongside its running total.',
          syntax: "SELECT\n  column,\n  SUM(column) OVER (ORDER BY sort_col) AS running_total,\n  AVG(column) OVER (PARTITION BY group_col) AS group_avg\nFROM table;",
          example_query: 'SELECT\n  name, department, salary,\n  SUM(salary) OVER (PARTITION BY department ORDER BY name) AS dept_running_total,\n  AVG(salary) OVER (PARTITION BY department) AS dept_avg\nFROM employees\nORDER BY department, name;',
          dataset: 'employees',
          common_mistakes: [
            'Confusing window aggregates with GROUP BY aggregates',
            'Not understanding default window frame (RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)',
            'Forgetting PARTITION BY when you need per-group calculations'
          ]
        }
      ]
    },
    {
      id: 'advanced',
      name: 'Advanced SQL',
      icon: '🚀',
      description: 'Views, transactions, and advanced concepts',
      topics: [
        {
          id: 'create_view',
          title: 'CREATE VIEW',
          explanation: 'A VIEW is a virtual table based on the result of a SELECT statement. It does not store data — it runs the query each time you access it. Views simplify complex queries and control data access.',
          why: 'Views let you save complex queries as named objects, making them reusable. They also provide security by exposing only specific columns/rows to users.',
          syntax: 'CREATE VIEW view_name AS\nSELECT columns FROM table WHERE condition;\n\n-- Use the view:\nSELECT * FROM view_name;\n\n-- Remove:\nDROP VIEW view_name;',
          example_query: "CREATE VIEW high_earners AS\nSELECT name, department, salary\nFROM employees\nWHERE salary > 6000;\n\nSELECT * FROM high_earners;",
          dataset: 'employees',
          common_mistakes: [
            'Trying to INSERT/UPDATE through complex views',
            'Creating views that reference temporary tables',
            'Not using DROP VIEW IF EXISTS before re-creating a view'
          ]
        },
        {
          id: 'transactions',
          title: 'Transactions (BEGIN, COMMIT, ROLLBACK)',
          explanation: 'A transaction groups multiple SQL statements into a single unit of work. BEGIN starts the transaction, COMMIT saves all changes, and ROLLBACK undoes all changes if something goes wrong.',
          why: 'Transactions ensure data consistency. If transferring money between accounts, both the debit and credit must succeed — or neither should happen. Transactions guarantee this atomicity.',
          syntax: 'BEGIN TRANSACTION;\n  -- SQL statements here\n  UPDATE accounts SET balance = balance - 100 WHERE id = 1;\n  UPDATE accounts SET balance = balance + 100 WHERE id = 2;\nCOMMIT;\n\n-- Or to undo:\nROLLBACK;',
          example_query: "BEGIN TRANSACTION;\n  UPDATE employees SET salary = salary * 1.1 WHERE department = 'IT';\nCOMMIT;\n\nSELECT name, salary FROM employees WHERE department = 'IT';",
          dataset: 'employees',
          common_mistakes: [
            'Forgetting to COMMIT (changes may not persist)',
            'Not using ROLLBACK on errors',
            'Nesting transactions (not supported in most databases)'
          ]
        },
        {
          id: 'aliases',
          title: 'Aliases (AS)',
          explanation: 'Aliases give temporary names to columns or tables using the AS keyword. Table aliases make joins readable. Column aliases rename output columns.',
          why: 'Aliases make queries more readable and results more meaningful. Instead of showing SUM(salary), you see total_salary. Instead of employees, you use e.',
          syntax: "-- Column alias:\nSELECT column AS alias_name FROM table;\n\n-- Table alias:\nSELECT e.name FROM employees e;\n\n-- Expression alias:\nSELECT salary * 12 AS annual_salary FROM employees;",
          example_query: "SELECT\n  e.name AS employee_name,\n  e.department AS dept,\n  e.salary AS monthly_salary,\n  e.salary * 12 AS annual_salary\nFROM employees e\nORDER BY annual_salary DESC;",
          dataset: 'employees',
          common_mistakes: [
            'Using aliases in WHERE (not supported in most databases — use HAVING or subquery)',
            'Forgetting AS keyword (optional but improves readability)',
            'Using reserved words as aliases without quoting them'
          ]
        },
        {
          id: 'string_functions',
          title: 'String Functions',
          explanation: 'SQL provides functions to manipulate text: UPPER (to uppercase), LOWER (to lowercase), LENGTH (character count), SUBSTR (extract substring), REPLACE (substitute text), TRIM (remove spaces), || (concatenate).',
          why: 'String manipulation is essential for data cleaning, formatting output, and standardizing text data for comparisons and reporting.',
          syntax: "SELECT UPPER(column) FROM table;\nSELECT LOWER(column) FROM table;\nSELECT LENGTH(column) FROM table;\nSELECT SUBSTR(column, start, length) FROM table;\nSELECT col1 || ' ' || col2 FROM table;",
          example_query: "SELECT\n  UPPER(name) AS name_upper,\n  LENGTH(name) AS name_length,\n  SUBSTR(email, 1, INSTR(email, '@') - 1) AS username\nFROM employees;",
          dataset: 'employees',
          common_mistakes: [
            'Confusing SUBSTR index — SQL starts at 1, not 0',
            'Using + for concatenation (use || in SQLite)',
            'Not handling NULL values in string functions'
          ]
        },
        {
          id: 'date_functions',
          title: 'Date Functions',
          explanation: "SQLite provides date functions: DATE (extract date), TIME (extract time), DATETIME (date and time), STRFTIME (format dates). Common format codes: %Y (year), %m (month), %d (day).",
          why: 'Working with dates is crucial for time-based analysis — monthly reports, year-over-year comparisons, calculating durations, and filtering by date ranges.',
          syntax: "SELECT DATE('now');\nSELECT STRFTIME('%Y', date_column) AS year FROM table;\nSELECT JULIANDAY(date1) - JULIANDAY(date2) AS days_diff;",
          example_query: "SELECT\n  name,\n  hire_date,\n  STRFTIME('%Y', hire_date) AS hire_year,\n  CAST(JULIANDAY('2026-01-01') - JULIANDAY(hire_date) AS INTEGER) AS days_employed\nFROM employees\nORDER BY days_employed DESC;",
          dataset: 'employees',
          common_mistakes: [
            'Date format issues — SQLite expects YYYY-MM-DD format',
            'Not using JULIANDAY for date arithmetic',
            'Comparing dates as strings instead of using date functions'
          ]
        }
      ]
    }
  ]
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LESSONS_DATA;
}
