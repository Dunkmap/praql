/**
 * Question Generator Engine
 * Analyzes uploaded CSV data and generates SQL practice questions
 * from 60+ templates with verified correct answers.
 */
import { sqlEngine } from './sql-engine.js';

/* ══════════════════════════════════════
   SCHEMA ANALYZER
   ══════════════════════════════════════ */

/**
 * Analyze a table's schema by sampling its data.
 * Returns column metadata: name, type (numeric|text|date|id), sampleValues, uniqueCount, nullCount
 */
function analyzeTable(tableName) {
  const info = sqlEngine.exec(`PRAGMA table_info(${tableName})`);
  if (!info.success || !info.results?.length) return null;

  const columns = info.results[0].values.map(row => row[1]); // column names
  const countResult = sqlEngine.exec(`SELECT COUNT(*) FROM ${tableName}`);
  const rowCount = countResult.success && countResult.results?.length ? countResult.results[0].values[0][0] : 0;

  const analyzed = [];
  for (const col of columns) {
    const sampleResult = sqlEngine.exec(`SELECT "${col}" FROM ${tableName} LIMIT 200`);
    const values = sampleResult.success && sampleResult.results?.length
      ? sampleResult.results[0].values.map(r => r[0])
      : [];

    const nonNull = values.filter(v => v !== null && v !== '' && v !== 'NULL');
    const nullCount = values.length - nonNull.length;
    const uniqueValues = [...new Set(nonNull)];

    // Type detection
    const type = detectType(col, nonNull, uniqueValues, rowCount);

    // Get sample values for template filling
    const sampleValues = uniqueValues.slice(0, 20);

    analyzed.push({
      name: col,
      type,
      sampleValues,
      uniqueCount: uniqueValues.length,
      nullCount,
      totalCount: values.length
    });
  }

  return { tableName, columns: analyzed, rowCount };
}

function detectType(colName, nonNull, uniqueValues, rowCount) {
  const nameLower = colName.toLowerCase();

  // ID detection
  if (nameLower === 'id' || nameLower.endsWith('_id') || nameLower.startsWith('id_')) {
    return 'id';
  }

  // Date detection
  const datePattern = /^\d{4}[-/]\d{1,2}[-/]\d{1,2}/;
  const dateCount = nonNull.filter(v => datePattern.test(String(v))).length;
  if (dateCount > nonNull.length * 0.6) return 'date';

  // Numeric detection
  const numCount = nonNull.filter(v => !isNaN(Number(v)) && String(v).trim() !== '').length;
  if (numCount > nonNull.length * 0.7) return 'numeric';

  // Text (categorical) — few unique values relative to rows
  return 'text';
}

/**
 * Detect potential foreign key relationships between tables
 * by matching column names (e.g., employee_id in tableB matches id in employees)
 */
function detectRelationships(tableSchemas) {
  const relationships = [];
  const tables = Object.values(tableSchemas);

  for (let i = 0; i < tables.length; i++) {
    for (let j = 0; j < tables.length; j++) {
      if (i === j) continue;
      const tA = tables[i];
      const tB = tables[j];

      for (const colA of tA.columns) {
        if (colA.type !== 'id') continue;
        const colALower = colA.name.toLowerCase();

        for (const colB of tB.columns) {
          if (colB.type !== 'id') continue;
          const colBLower = colB.name.toLowerCase();

          // Match: tableB has "employees_id" or "employee_id" and tableA is "employees" with "id"
          const tABase = tA.tableName.replace(/s$/, ''); // employees -> employee
          if (
            (colALower === 'id' && (colBLower === `${tA.tableName}_id` || colBLower === `${tABase}_id`)) ||
            (colBLower === 'id' && (colALower === `${tB.tableName}_id` || colALower === `${tB.tableName.replace(/s$/, '')}_id`))
          ) {
            relationships.push({
              tableA: tA.tableName,
              colA: colALower === 'id' ? colA.name : colB.name,
              tableB: tB.tableName,
              colB: colALower === 'id' ? colB.name : colA.name
            });
          }
        }
      }
    }
  }

  // Deduplicate
  const seen = new Set();
  return relationships.filter(r => {
    const key = [r.tableA, r.colA, r.tableB, r.colB].sort().join('|');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}


/* ══════════════════════════════════════
   TEMPLATE BANK
   ══════════════════════════════════════ */

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function pickN(arr, n) {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, n);
}
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

/**
 * Each template is a function that receives (tableMeta, allTables, relationships)
 * and returns { question, answer, hint, difficulty } or null if not applicable.
 */

// ─── EASY TEMPLATES ───────────────────

const EASY_TEMPLATES = [
  // 1. Select all
  (t) => ({
    question: `Display all records from the ${t.tableName} table.`,
    answer: `SELECT * FROM ${t.tableName};`,
    hint: `Use SELECT * to retrieve all columns and rows.`,
  }),

  // 2. Select specific columns
  (t) => {
    const cols = pickN(t.columns.filter(c => c.type !== 'id'), Math.min(3, t.columns.length));
    if (cols.length < 2) return null;
    const colNames = cols.map(c => `"${c.name}"`).join(', ');
    const colLabels = cols.map(c => c.name).join(', ');
    return {
      question: `Show only the ${colLabels} columns from ${t.tableName}.`,
      answer: `SELECT ${colNames} FROM ${t.tableName};`,
      hint: `List specific column names after SELECT instead of using *.`,
    };
  },

  // 3. Count rows
  (t) => ({
    question: `How many total records are in the ${t.tableName} table?`,
    answer: `SELECT COUNT(*) FROM ${t.tableName};`,
    hint: `Use the COUNT(*) aggregate function.`,
  }),

  // 4. Distinct values
  (t) => {
    const textCols = t.columns.filter(c => c.type === 'text' && c.uniqueCount > 1 && c.uniqueCount <= 20);
    if (!textCols.length) return null;
    const col = pick(textCols);
    return {
      question: `List all unique values of ${col.name} in the ${t.tableName} table.`,
      answer: `SELECT DISTINCT "${col.name}" FROM ${t.tableName};`,
      hint: `Use the DISTINCT keyword to eliminate duplicate rows.`,
    };
  },

  // 5. WHERE exact match (text)
  (t) => {
    const textCols = t.columns.filter(c => c.type === 'text' && c.sampleValues.length > 0);
    if (!textCols.length) return null;
    const col = pick(textCols);
    const val = pick(col.sampleValues);
    return {
      question: `Find all records from ${t.tableName} where ${col.name} is '${val}'.`,
      answer: `SELECT * FROM ${t.tableName} WHERE "${col.name}" = '${val}';`,
      hint: `Use WHERE column = 'value' to filter rows by an exact match.`,
    };
  },

  // 6. WHERE numeric comparison
  (t) => {
    const numCols = t.columns.filter(c => c.type === 'numeric' && c.sampleValues.length > 2);
    if (!numCols.length) return null;
    const col = pick(numCols);
    const vals = col.sampleValues.map(Number).filter(v => !isNaN(v)).sort((a, b) => a - b);
    if (vals.length < 3) return null;
    const mid = vals[Math.floor(vals.length / 2)];
    const op = pick(['>', '<', '>=', '<=']);
    const opWord = { '>': 'greater than', '<': 'less than', '>=': 'greater than or equal to', '<=': 'less than or equal to' }[op];
    return {
      question: `Find all records from ${t.tableName} where ${col.name} is ${opWord} ${mid}.`,
      answer: `SELECT * FROM ${t.tableName} WHERE "${col.name}" ${op} ${mid};`,
      hint: `Use WHERE with a comparison operator (${op}) for numeric filtering.`,
    };
  },

  // 7. ORDER BY
  (t) => {
    const cols = t.columns.filter(c => c.type === 'numeric' || c.type === 'text');
    if (!cols.length) return null;
    const col = pick(cols);
    const dir = pick(['ASC', 'DESC']);
    const dirWord = dir === 'ASC' ? 'ascending' : 'descending';
    return {
      question: `Display all records from ${t.tableName} ordered by ${col.name} in ${dirWord} order.`,
      answer: `SELECT * FROM ${t.tableName} ORDER BY "${col.name}" ${dir};`,
      hint: `Use ORDER BY column_name ${dir} to sort results.`,
    };
  },

  // 8. LIMIT
  (t) => {
    const n = pick([3, 5, 10]);
    return {
      question: `Show only the first ${n} records from the ${t.tableName} table.`,
      answer: `SELECT * FROM ${t.tableName} LIMIT ${n};`,
      hint: `Use LIMIT N at the end of your query to restrict the number of rows returned.`,
    };
  },

  // 9. ORDER BY + LIMIT (top N)
  (t) => {
    const numCols = t.columns.filter(c => c.type === 'numeric');
    if (!numCols.length) return null;
    const col = pick(numCols);
    const n = pick([3, 5]);
    return {
      question: `Show the top ${n} records from ${t.tableName} with the highest ${col.name}.`,
      answer: `SELECT * FROM ${t.tableName} ORDER BY "${col.name}" DESC LIMIT ${n};`,
      hint: `Combine ORDER BY ... DESC with LIMIT to get the top N results.`,
    };
  },

  // 10. IS NULL
  (t) => {
    const nullCols = t.columns.filter(c => c.nullCount > 0);
    if (!nullCols.length) return null;
    const col = pick(nullCols);
    return {
      question: `Find all records in ${t.tableName} where ${col.name} is missing (NULL).`,
      answer: `SELECT * FROM ${t.tableName} WHERE "${col.name}" IS NULL;`,
      hint: `Use IS NULL (not = NULL) to check for missing values.`,
    };
  },

  // 11. IS NOT NULL
  (t) => {
    const nullCols = t.columns.filter(c => c.nullCount > 0);
    if (!nullCols.length) return null;
    const col = pick(nullCols);
    return {
      question: `Find all records in ${t.tableName} where ${col.name} is NOT null.`,
      answer: `SELECT * FROM ${t.tableName} WHERE "${col.name}" IS NOT NULL;`,
      hint: `Use IS NOT NULL to filter out rows with missing values.`,
    };
  },

  // 12. LIKE pattern
  (t) => {
    const textCols = t.columns.filter(c => c.type === 'text' && c.sampleValues.some(v => String(v).length > 2));
    if (!textCols.length) return null;
    const col = pick(textCols);
    const val = pick(col.sampleValues);
    const firstChar = String(val).charAt(0);
    return {
      question: `Find all records in ${t.tableName} where ${col.name} starts with '${firstChar}'.`,
      answer: `SELECT * FROM ${t.tableName} WHERE "${col.name}" LIKE '${firstChar}%';`,
      hint: `Use LIKE with a wildcard: 'X%' matches values starting with X.`,
    };
  },

  // 13. Count with WHERE
  (t) => {
    const textCols = t.columns.filter(c => c.type === 'text' && c.sampleValues.length > 0);
    if (!textCols.length) return null;
    const col = pick(textCols);
    const val = pick(col.sampleValues);
    return {
      question: `How many records in ${t.tableName} have ${col.name} equal to '${val}'?`,
      answer: `SELECT COUNT(*) FROM ${t.tableName} WHERE "${col.name}" = '${val}';`,
      hint: `Combine COUNT(*) with a WHERE clause to count filtered rows.`,
    };
  },

  // 14. MIN / MAX
  (t) => {
    const numCols = t.columns.filter(c => c.type === 'numeric');
    if (!numCols.length) return null;
    const col = pick(numCols);
    const func = pick(['MIN', 'MAX']);
    const word = func === 'MIN' ? 'minimum' : 'maximum';
    return {
      question: `What is the ${word} value of ${col.name} in the ${t.tableName} table?`,
      answer: `SELECT ${func}("${col.name}") FROM ${t.tableName};`,
      hint: `Use the ${func}() aggregate function on the column.`,
    };
  },

  // 15. SUM
  (t) => {
    const numCols = t.columns.filter(c => c.type === 'numeric');
    if (!numCols.length) return null;
    const col = pick(numCols);
    return {
      question: `What is the total sum of ${col.name} across all records in ${t.tableName}?`,
      answer: `SELECT SUM("${col.name}") FROM ${t.tableName};`,
      hint: `Use the SUM() aggregate function.`,
    };
  },
];


// ─── MEDIUM TEMPLATES ───────────────────

const MEDIUM_TEMPLATES = [
  // 1. GROUP BY with COUNT
  (t) => {
    const textCols = t.columns.filter(c => c.type === 'text' && c.uniqueCount > 1 && c.uniqueCount <= 20);
    if (!textCols.length) return null;
    const col = pick(textCols);
    return {
      question: `Count the number of records in ${t.tableName} for each unique ${col.name}.`,
      answer: `SELECT "${col.name}", COUNT(*) AS count FROM ${t.tableName} GROUP BY "${col.name}";`,
      hint: `Use GROUP BY with COUNT(*) to aggregate rows by category.`,
    };
  },

  // 2. GROUP BY with SUM
  (t) => {
    const textCols = t.columns.filter(c => c.type === 'text' && c.uniqueCount > 1 && c.uniqueCount <= 15);
    const numCols = t.columns.filter(c => c.type === 'numeric');
    if (!textCols.length || !numCols.length) return null;
    const grpCol = pick(textCols);
    const sumCol = pick(numCols);
    return {
      question: `Find the total ${sumCol.name} for each ${grpCol.name} in ${t.tableName}.`,
      answer: `SELECT "${grpCol.name}", SUM("${sumCol.name}") AS total_${sumCol.name} FROM ${t.tableName} GROUP BY "${grpCol.name}";`,
      hint: `Use SUM() with GROUP BY to calculate totals per group.`,
    };
  },

  // 3. GROUP BY with AVG
  (t) => {
    const textCols = t.columns.filter(c => c.type === 'text' && c.uniqueCount > 1 && c.uniqueCount <= 15);
    const numCols = t.columns.filter(c => c.type === 'numeric');
    if (!textCols.length || !numCols.length) return null;
    const grpCol = pick(textCols);
    const avgCol = pick(numCols);
    return {
      question: `Calculate the average ${avgCol.name} for each ${grpCol.name} in ${t.tableName}.`,
      answer: `SELECT "${grpCol.name}", ROUND(AVG("${avgCol.name}"), 2) AS avg_${avgCol.name} FROM ${t.tableName} GROUP BY "${grpCol.name}";`,
      hint: `Use AVG() with GROUP BY. ROUND() helps format decimal results.`,
    };
  },

  // 4. HAVING
  (t) => {
    const textCols = t.columns.filter(c => c.type === 'text' && c.uniqueCount > 2 && c.uniqueCount <= 15);
    if (!textCols.length) return null;
    const col = pick(textCols);
    const threshold = pick([2, 3, 5]);
    return {
      question: `Which values of ${col.name} in ${t.tableName} appear more than ${threshold} times?`,
      answer: `SELECT "${col.name}", COUNT(*) AS count FROM ${t.tableName} GROUP BY "${col.name}" HAVING COUNT(*) > ${threshold};`,
      hint: `Use HAVING after GROUP BY to filter groups (unlike WHERE which filters rows).`,
    };
  },

  // 5. BETWEEN (numeric)
  (t) => {
    const numCols = t.columns.filter(c => c.type === 'numeric' && c.sampleValues.length > 3);
    if (!numCols.length) return null;
    const col = pick(numCols);
    const vals = col.sampleValues.map(Number).filter(v => !isNaN(v)).sort((a, b) => a - b);
    if (vals.length < 4) return null;
    const lo = vals[Math.floor(vals.length * 0.25)];
    const hi = vals[Math.floor(vals.length * 0.75)];
    return {
      question: `Find all records in ${t.tableName} where ${col.name} is between ${lo} and ${hi}.`,
      answer: `SELECT * FROM ${t.tableName} WHERE "${col.name}" BETWEEN ${lo} AND ${hi};`,
      hint: `Use BETWEEN low AND high for range filtering.`,
    };
  },

  // 6. IN clause
  (t) => {
    const textCols = t.columns.filter(c => c.type === 'text' && c.uniqueCount >= 3);
    if (!textCols.length) return null;
    const col = pick(textCols);
    const vals = pickN(col.sampleValues, Math.min(3, col.sampleValues.length));
    const inList = vals.map(v => `'${v}'`).join(', ');
    const valWords = vals.map(v => `'${v}'`).join(', ');
    return {
      question: `Find all records in ${t.tableName} where ${col.name} is one of: ${valWords}.`,
      answer: `SELECT * FROM ${t.tableName} WHERE "${col.name}" IN (${inList});`,
      hint: `Use the IN operator to check membership in a list of values.`,
    };
  },

  // 7. Multiple WHERE conditions (AND)
  (t) => {
    const textCols = t.columns.filter(c => c.type === 'text' && c.sampleValues.length > 0);
    const numCols = t.columns.filter(c => c.type === 'numeric' && c.sampleValues.length > 2);
    if (!textCols.length || !numCols.length) return null;
    const tCol = pick(textCols);
    const nCol = pick(numCols);
    const tVal = pick(tCol.sampleValues);
    const nVals = nCol.sampleValues.map(Number).filter(v => !isNaN(v)).sort((a, b) => a - b);
    const mid = nVals[Math.floor(nVals.length / 2)];
    return {
      question: `Find all records in ${t.tableName} where ${tCol.name} is '${tVal}' AND ${nCol.name} is greater than ${mid}.`,
      answer: `SELECT * FROM ${t.tableName} WHERE "${tCol.name}" = '${tVal}' AND "${nCol.name}" > ${mid};`,
      hint: `Use AND to combine multiple conditions in the WHERE clause.`,
    };
  },

  // 8. Multiple WHERE conditions (OR)
  (t) => {
    const textCols = t.columns.filter(c => c.type === 'text' && c.sampleValues.length >= 2);
    if (!textCols.length) return null;
    const col = pick(textCols);
    const vals = pickN(col.sampleValues, 2);
    return {
      question: `Find all records in ${t.tableName} where ${col.name} is either '${vals[0]}' or '${vals[1]}'.`,
      answer: `SELECT * FROM ${t.tableName} WHERE "${col.name}" = '${vals[0]}' OR "${col.name}" = '${vals[1]}';`,
      hint: `Use OR to match rows satisfying at least one of multiple conditions.`,
    };
  },

  // 9. CASE WHEN
  (t) => {
    const numCols = t.columns.filter(c => c.type === 'numeric' && c.sampleValues.length > 3);
    if (!numCols.length) return null;
    const col = pick(numCols);
    const vals = col.sampleValues.map(Number).filter(v => !isNaN(v)).sort((a, b) => a - b);
    const mid = vals[Math.floor(vals.length / 2)];
    return {
      question: `Add a category column to ${t.tableName}: label rows as 'High' if ${col.name} > ${mid}, otherwise 'Low'.`,
      answer: `SELECT *, CASE WHEN "${col.name}" > ${mid} THEN 'High' ELSE 'Low' END AS category FROM ${t.tableName};`,
      hint: `Use CASE WHEN condition THEN value ELSE value END to create conditional columns.`,
    };
  },

  // 10. Alias
  (t) => {
    const numCols = t.columns.filter(c => c.type === 'numeric');
    if (!numCols.length) return null;
    const col = pick(numCols);
    return {
      question: `Show the average and maximum ${col.name} from ${t.tableName}, aliased as avg_value and max_value.`,
      answer: `SELECT ROUND(AVG("${col.name}"), 2) AS avg_value, MAX("${col.name}") AS max_value FROM ${t.tableName};`,
      hint: `Use AS to give aliases to computed columns in your SELECT.`,
    };
  },

  // 11. COALESCE / IFNULL
  (t) => {
    const nullCols = t.columns.filter(c => c.nullCount > 0);
    if (!nullCols.length) return null;
    const col = pick(nullCols);
    const def = col.type === 'numeric' ? '0' : "'Unknown'";
    return {
      question: `Show all records from ${t.tableName}, replacing NULL values in ${col.name} with ${def}.`,
      answer: `SELECT *, COALESCE("${col.name}", ${def}) AS ${col.name}_filled FROM ${t.tableName};`,
      hint: `COALESCE(column, default) returns the first non-NULL argument.`,
    };
  },

  // 12. UPPER / LOWER
  (t) => {
    const textCols = t.columns.filter(c => c.type === 'text');
    if (!textCols.length) return null;
    const col = pick(textCols);
    const func = pick(['UPPER', 'LOWER']);
    const word = func === 'UPPER' ? 'uppercase' : 'lowercase';
    return {
      question: `Display ${col.name} in ${word} for all records in ${t.tableName}.`,
      answer: `SELECT ${func}("${col.name}") AS ${col.name}_${word} FROM ${t.tableName};`,
      hint: `Use ${func}() to convert text to ${word}.`,
    };
  },

  // 13. LENGTH
  (t) => {
    const textCols = t.columns.filter(c => c.type === 'text' && c.sampleValues.some(v => String(v).length > 3));
    if (!textCols.length) return null;
    const col = pick(textCols);
    return {
      question: `Show each unique ${col.name} along with the length of the value in ${t.tableName}.`,
      answer: `SELECT DISTINCT "${col.name}", LENGTH("${col.name}") AS name_length FROM ${t.tableName};`,
      hint: `Use LENGTH() to find the number of characters in a string.`,
    };
  },

  // 14. GROUP BY with ORDER BY
  (t) => {
    const textCols = t.columns.filter(c => c.type === 'text' && c.uniqueCount > 1 && c.uniqueCount <= 15);
    const numCols = t.columns.filter(c => c.type === 'numeric');
    if (!textCols.length || !numCols.length) return null;
    const grpCol = pick(textCols);
    const numCol = pick(numCols);
    return {
      question: `Find the total ${numCol.name} per ${grpCol.name} in ${t.tableName}, sorted from highest to lowest total.`,
      answer: `SELECT "${grpCol.name}", SUM("${numCol.name}") AS total FROM ${t.tableName} GROUP BY "${grpCol.name}" ORDER BY total DESC;`,
      hint: `Combine GROUP BY, SUM(), and ORDER BY DESC for ranked aggregation.`,
    };
  },

  // 15. NOT LIKE
  (t) => {
    const textCols = t.columns.filter(c => c.type === 'text' && c.sampleValues.some(v => String(v).length > 2));
    if (!textCols.length) return null;
    const col = pick(textCols);
    const val = pick(col.sampleValues);
    const lastChar = String(val).slice(-1);
    return {
      question: `Find all records in ${t.tableName} where ${col.name} does NOT end with '${lastChar}'.`,
      answer: `SELECT * FROM ${t.tableName} WHERE "${col.name}" NOT LIKE '%${lastChar}';`,
      hint: `Use NOT LIKE with '%char' to exclude values ending with a specific character.`,
    };
  },

  // 16. COUNT DISTINCT
  (t) => {
    const textCols = t.columns.filter(c => c.type === 'text' && c.uniqueCount > 1);
    if (!textCols.length) return null;
    const col = pick(textCols);
    return {
      question: `How many distinct values of ${col.name} exist in the ${t.tableName} table?`,
      answer: `SELECT COUNT(DISTINCT "${col.name}") AS distinct_count FROM ${t.tableName};`,
      hint: `Combine COUNT() with DISTINCT inside it: COUNT(DISTINCT column).`,
    };
  },

  // 17. GROUP BY + MIN/MAX
  (t) => {
    const textCols = t.columns.filter(c => c.type === 'text' && c.uniqueCount > 1 && c.uniqueCount <= 15);
    const numCols = t.columns.filter(c => c.type === 'numeric');
    if (!textCols.length || !numCols.length) return null;
    const grpCol = pick(textCols);
    const numCol = pick(numCols);
    const func = pick(['MIN', 'MAX']);
    const word = func === 'MIN' ? 'minimum' : 'maximum';
    return {
      question: `Find the ${word} ${numCol.name} for each ${grpCol.name} in ${t.tableName}.`,
      answer: `SELECT "${grpCol.name}", ${func}("${numCol.name}") AS ${word}_${numCol.name} FROM ${t.tableName} GROUP BY "${grpCol.name}";`,
      hint: `Use ${func}() with GROUP BY to find the ${word} per group.`,
    };
  },

  // 18. OFFSET
  (t) => {
    const offset = pick([5, 10]);
    const limit = pick([3, 5]);
    return {
      question: `Show ${limit} records from ${t.tableName}, skipping the first ${offset} rows.`,
      answer: `SELECT * FROM ${t.tableName} LIMIT ${limit} OFFSET ${offset};`,
      hint: `Use LIMIT with OFFSET to paginate through results.`,
    };
  },

  // 19. NOT IN
  (t) => {
    const textCols = t.columns.filter(c => c.type === 'text' && c.uniqueCount >= 3);
    if (!textCols.length) return null;
    const col = pick(textCols);
    const vals = pickN(col.sampleValues, 2);
    const inList = vals.map(v => `'${v}'`).join(', ');
    return {
      question: `Find all records in ${t.tableName} where ${col.name} is NOT in (${vals.map(v => `'${v}'`).join(', ')}).`,
      answer: `SELECT * FROM ${t.tableName} WHERE "${col.name}" NOT IN (${inList});`,
      hint: `NOT IN excludes rows matching any value in the list.`,
    };
  },

  // 20. SUBSTR
  (t) => {
    const textCols = t.columns.filter(c => c.type === 'text' && c.sampleValues.some(v => String(v).length > 4));
    if (!textCols.length) return null;
    const col = pick(textCols);
    return {
      question: `Show the first 3 characters of ${col.name} for each record in ${t.tableName}.`,
      answer: `SELECT SUBSTR("${col.name}", 1, 3) AS short_${col.name} FROM ${t.tableName};`,
      hint: `Use SUBSTR(string, start, length) to extract part of a string.`,
    };
  },
];


// ─── HARD TEMPLATES ───────────────────

const HARD_TEMPLATES = [
  // 1. Subquery: above average
  (t) => {
    const numCols = t.columns.filter(c => c.type === 'numeric');
    if (!numCols.length) return null;
    const col = pick(numCols);
    return {
      question: `Find all records in ${t.tableName} where ${col.name} is above the average ${col.name}.`,
      answer: `SELECT * FROM ${t.tableName} WHERE "${col.name}" > (SELECT AVG("${col.name}") FROM ${t.tableName});`,
      hint: `Use a subquery in the WHERE clause to compare against the average: WHERE col > (SELECT AVG(col) FROM ...).`,
    };
  },

  // 2. Subquery: MAX per group
  (t) => {
    const textCols = t.columns.filter(c => c.type === 'text' && c.uniqueCount > 1 && c.uniqueCount <= 15);
    const numCols = t.columns.filter(c => c.type === 'numeric');
    if (!textCols.length || !numCols.length) return null;
    const grpCol = pick(textCols);
    const numCol = pick(numCols);
    return {
      question: `Find the record(s) with the highest ${numCol.name} in each ${grpCol.name} group in ${t.tableName}.`,
      answer: `SELECT t.* FROM ${t.tableName} t INNER JOIN (SELECT "${grpCol.name}", MAX("${numCol.name}") AS max_val FROM ${t.tableName} GROUP BY "${grpCol.name}") m ON t."${grpCol.name}" = m."${grpCol.name}" AND t."${numCol.name}" = m.max_val;`,
      hint: `Use a subquery to find the MAX per group, then JOIN back to get the full rows.`,
    };
  },

  // 3. GROUP BY multiple columns
  (t) => {
    const textCols = t.columns.filter(c => c.type === 'text' && c.uniqueCount > 1 && c.uniqueCount <= 15);
    const numCols = t.columns.filter(c => c.type === 'numeric');
    if (textCols.length < 2 || !numCols.length) return null;
    const cols = pickN(textCols, 2);
    const numCol = pick(numCols);
    return {
      question: `Find the average ${numCol.name} grouped by both ${cols[0].name} and ${cols[1].name} in ${t.tableName}.`,
      answer: `SELECT "${cols[0].name}", "${cols[1].name}", ROUND(AVG("${numCol.name}"), 2) AS avg_${numCol.name} FROM ${t.tableName} GROUP BY "${cols[0].name}", "${cols[1].name}";`,
      hint: `You can GROUP BY multiple columns by separating them with commas.`,
    };
  },

  // 4. ROW_NUMBER window function
  (t) => {
    const numCols = t.columns.filter(c => c.type === 'numeric');
    if (!numCols.length) return null;
    const col = pick(numCols);
    return {
      question: `Assign a row number to each record in ${t.tableName} ordered by ${col.name} descending.`,
      answer: `SELECT *, ROW_NUMBER() OVER (ORDER BY "${col.name}" DESC) AS row_num FROM ${t.tableName};`,
      hint: `Use ROW_NUMBER() OVER (ORDER BY ...) to assign sequential numbers.`,
    };
  },

  // 5. RANK with PARTITION BY
  (t) => {
    const textCols = t.columns.filter(c => c.type === 'text' && c.uniqueCount > 1 && c.uniqueCount <= 15);
    const numCols = t.columns.filter(c => c.type === 'numeric');
    if (!textCols.length || !numCols.length) return null;
    const grpCol = pick(textCols);
    const numCol = pick(numCols);
    return {
      question: `Rank records in ${t.tableName} by ${numCol.name} (highest first) within each ${grpCol.name} group.`,
      answer: `SELECT *, RANK() OVER (PARTITION BY "${grpCol.name}" ORDER BY "${numCol.name}" DESC) AS rank FROM ${t.tableName};`,
      hint: `Use RANK() OVER (PARTITION BY group_col ORDER BY value_col DESC) for rankings within groups.`,
    };
  },

  // 6. DENSE_RANK
  (t) => {
    const numCols = t.columns.filter(c => c.type === 'numeric');
    if (!numCols.length) return null;
    const col = pick(numCols);
    return {
      question: `Assign a dense rank to each record in ${t.tableName} based on ${col.name} in descending order.`,
      answer: `SELECT *, DENSE_RANK() OVER (ORDER BY "${col.name}" DESC) AS dense_rank FROM ${t.tableName};`,
      hint: `DENSE_RANK() is like RANK() but does not skip rank numbers for ties.`,
    };
  },

  // 7. Running total with SUM OVER
  (t) => {
    const numCols = t.columns.filter(c => c.type === 'numeric');
    const idCols = t.columns.filter(c => c.type === 'id');
    if (!numCols.length) return null;
    const col = pick(numCols);
    const orderCol = idCols.length ? idCols[0] : col;
    return {
      question: `Calculate the running total of ${col.name} in ${t.tableName} ordered by ${orderCol.name}.`,
      answer: `SELECT *, SUM("${col.name}") OVER (ORDER BY "${orderCol.name}") AS running_total FROM ${t.tableName};`,
      hint: `Use SUM(col) OVER (ORDER BY ...) to compute a cumulative running total.`,
    };
  },

  // 8. CTE (Common Table Expression)
  (t) => {
    const textCols = t.columns.filter(c => c.type === 'text' && c.uniqueCount > 1 && c.uniqueCount <= 15);
    const numCols = t.columns.filter(c => c.type === 'numeric');
    if (!textCols.length || !numCols.length) return null;
    const grpCol = pick(textCols);
    const numCol = pick(numCols);
    return {
      question: `Using a CTE, find the total ${numCol.name} per ${grpCol.name} in ${t.tableName}, then show only groups with total above the overall average.`,
      answer: `WITH totals AS (SELECT "${grpCol.name}", SUM("${numCol.name}") AS total FROM ${t.tableName} GROUP BY "${grpCol.name}") SELECT * FROM totals WHERE total > (SELECT AVG(total) FROM totals);`,
      hint: `Use WITH cte_name AS (...) to define a temporary result set, then query from it.`,
    };
  },

  // 9. Complex CASE WHEN with aggregation
  (t) => {
    const textCols = t.columns.filter(c => c.type === 'text' && c.uniqueCount > 1 && c.uniqueCount <= 15);
    const numCols = t.columns.filter(c => c.type === 'numeric');
    if (!textCols.length || !numCols.length) return null;
    const grpCol = pick(textCols);
    const numCol = pick(numCols);
    const vals = numCol.sampleValues.map(Number).filter(v => !isNaN(v)).sort((a, b) => a - b);
    if (vals.length < 3) return null;
    const mid = vals[Math.floor(vals.length / 2)];
    return {
      question: `For each ${grpCol.name} in ${t.tableName}, count how many records have ${numCol.name} above ${mid} (as high_count) and at or below (as low_count).`,
      answer: `SELECT "${grpCol.name}", SUM(CASE WHEN "${numCol.name}" > ${mid} THEN 1 ELSE 0 END) AS high_count, SUM(CASE WHEN "${numCol.name}" <= ${mid} THEN 1 ELSE 0 END) AS low_count FROM ${t.tableName} GROUP BY "${grpCol.name}";`,
      hint: `Use SUM(CASE WHEN condition THEN 1 ELSE 0 END) to conditionally count rows within GROUP BY.`,
    };
  },

  // 10. Subquery in SELECT
  (t) => {
    const numCols = t.columns.filter(c => c.type === 'numeric');
    if (!numCols.length) return null;
    const col = pick(numCols);
    return {
      question: `For each record in ${t.tableName}, show all columns plus the difference between its ${col.name} and the overall average ${col.name}.`,
      answer: `SELECT *, "${col.name}" - (SELECT ROUND(AVG("${col.name}"), 2) FROM ${t.tableName}) AS diff_from_avg FROM ${t.tableName};`,
      hint: `You can use a subquery inside the SELECT clause to compute a scalar value.`,
    };
  },

  // 11. EXISTS
  (t) => {
    const textCols = t.columns.filter(c => c.type === 'text' && c.uniqueCount > 1);
    const numCols = t.columns.filter(c => c.type === 'numeric');
    if (!textCols.length || !numCols.length) return null;
    const grpCol = pick(textCols);
    const numCol = pick(numCols);
    const vals = numCol.sampleValues.map(Number).filter(v => !isNaN(v)).sort((a, b) => a - b);
    const high = vals[Math.floor(vals.length * 0.8)];
    return {
      question: `Find all unique ${grpCol.name} values in ${t.tableName} for which at least one record has ${numCol.name} greater than ${high}.`,
      answer: `SELECT DISTINCT "${grpCol.name}" FROM ${t.tableName} t1 WHERE EXISTS (SELECT 1 FROM ${t.tableName} t2 WHERE t2."${grpCol.name}" = t1."${grpCol.name}" AND t2."${numCol.name}" > ${high});`,
      hint: `Use EXISTS with a correlated subquery to check for the existence of matching rows.`,
    };
  },

  // 12. NTILE
  (t) => {
    const numCols = t.columns.filter(c => c.type === 'numeric');
    if (!numCols.length) return null;
    const col = pick(numCols);
    const n = pick([3, 4]);
    return {
      question: `Divide the records in ${t.tableName} into ${n} equal groups (quartiles/tiles) based on ${col.name}.`,
      answer: `SELECT *, NTILE(${n}) OVER (ORDER BY "${col.name}") AS tile FROM ${t.tableName};`,
      hint: `NTILE(N) OVER (ORDER BY ...) distributes rows into N approximately equal-sized buckets.`,
    };
  },

  // 13. PERCENT calculation
  (t) => {
    const textCols = t.columns.filter(c => c.type === 'text' && c.uniqueCount > 1 && c.uniqueCount <= 15);
    if (!textCols.length) return null;
    const col = pick(textCols);
    return {
      question: `Show each ${col.name} in ${t.tableName} with its count and percentage of the total.`,
      answer: `SELECT "${col.name}", COUNT(*) AS count, ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM ${t.tableName}), 2) AS percentage FROM ${t.tableName} GROUP BY "${col.name}";`,
      hint: `Calculate percentage by dividing group count by total count (from a subquery) × 100.`,
    };
  },

  // 14. LAG window function
  (t) => {
    const numCols = t.columns.filter(c => c.type === 'numeric');
    const idCols = t.columns.filter(c => c.type === 'id');
    if (!numCols.length) return null;
    const col = pick(numCols);
    const orderCol = idCols.length ? idCols[0] : col;
    return {
      question: `For each record in ${t.tableName}, show ${col.name} and the previous row's ${col.name} (ordered by ${orderCol.name}).`,
      answer: `SELECT *, LAG("${col.name}") OVER (ORDER BY "${orderCol.name}") AS prev_${col.name} FROM ${t.tableName};`,
      hint: `LAG(column) OVER (ORDER BY ...) returns the value from the previous row.`,
    };
  },

  // 15. Self-comparison with subquery (above group avg)
  (t) => {
    const textCols = t.columns.filter(c => c.type === 'text' && c.uniqueCount > 1 && c.uniqueCount <= 15);
    const numCols = t.columns.filter(c => c.type === 'numeric');
    if (!textCols.length || !numCols.length) return null;
    const grpCol = pick(textCols);
    const numCol = pick(numCols);
    return {
      question: `Find records in ${t.tableName} where ${numCol.name} is above the average ${numCol.name} for their ${grpCol.name} group.`,
      answer: `SELECT * FROM ${t.tableName} t1 WHERE "${numCol.name}" > (SELECT AVG("${numCol.name}") FROM ${t.tableName} t2 WHERE t2."${grpCol.name}" = t1."${grpCol.name}");`,
      hint: `Use a correlated subquery that calculates the group average matching the outer row's group.`,
    };
  },
];


// ─── JOIN TEMPLATES (multi-table) ───────────────────

const JOIN_TEMPLATES = [
  // 1. INNER JOIN
  (tA, tB, rel) => ({
    difficulty: 'medium',
    question: `Join ${rel.tableA} with ${rel.tableB} using an INNER JOIN and display all columns.`,
    answer: `SELECT * FROM ${rel.tableA} INNER JOIN ${rel.tableB} ON ${rel.tableA}."${rel.colA}" = ${rel.tableB}."${rel.colB}";`,
    hint: `Use INNER JOIN ... ON tableA.col = tableB.col to combine matching rows from two tables.`,
  }),

  // 2. LEFT JOIN
  (tA, tB, rel) => ({
    difficulty: 'medium',
    question: `Show all records from ${rel.tableA} with matching records from ${rel.tableB} (include unmatched rows from ${rel.tableA}).`,
    answer: `SELECT * FROM ${rel.tableA} LEFT JOIN ${rel.tableB} ON ${rel.tableA}."${rel.colA}" = ${rel.tableB}."${rel.colB}";`,
    hint: `LEFT JOIN returns all rows from the left table and matched rows from the right table (NULLs for unmatched).`,
  }),

  // 3. JOIN with specific columns
  (tA, tB, rel) => {
    const colsA = tA.columns.filter(c => c.type !== 'id').slice(0, 2);
    const colsB = tB.columns.filter(c => c.type !== 'id').slice(0, 2);
    if (!colsA.length || !colsB.length) return null;
    const selectCols = [
      ...colsA.map(c => `${rel.tableA}."${c.name}"`),
      ...colsB.map(c => `${rel.tableB}."${c.name}"`)
    ].join(', ');
    const colNames = [...colsA.map(c => c.name), ...colsB.map(c => c.name)].join(', ');
    return {
      difficulty: 'medium',
      question: `Join ${rel.tableA} with ${rel.tableB} and show only: ${colNames}.`,
      answer: `SELECT ${selectCols} FROM ${rel.tableA} INNER JOIN ${rel.tableB} ON ${rel.tableA}."${rel.colA}" = ${rel.tableB}."${rel.colB}";`,
      hint: `After JOIN, specify exact columns in SELECT using table.column syntax.`,
    };
  },

  // 4. JOIN with GROUP BY
  (tA, tB, rel) => {
    const textCol = tA.columns.find(c => c.type === 'text' && c.uniqueCount > 1 && c.uniqueCount <= 15);
    if (!textCol) return null;
    return {
      difficulty: 'hard',
      question: `Join ${rel.tableA} with ${rel.tableB} and count the number of ${rel.tableB} records per ${textCol.name} from ${rel.tableA}.`,
      answer: `SELECT ${rel.tableA}."${textCol.name}", COUNT(${rel.tableB}.rowid) AS count FROM ${rel.tableA} LEFT JOIN ${rel.tableB} ON ${rel.tableA}."${rel.colA}" = ${rel.tableB}."${rel.colB}" GROUP BY ${rel.tableA}."${textCol.name}";`,
      hint: `JOIN the tables, then use GROUP BY on a column from the primary table with COUNT.`,
    };
  },

  // 5. JOIN with WHERE
  (tA, tB, rel) => {
    const textCol = tA.columns.find(c => c.type === 'text' && c.sampleValues.length > 0);
    if (!textCol) return null;
    const val = pick(textCol.sampleValues);
    return {
      difficulty: 'medium',
      question: `Join ${rel.tableA} with ${rel.tableB} and filter where ${rel.tableA}.${textCol.name} = '${val}'.`,
      answer: `SELECT * FROM ${rel.tableA} INNER JOIN ${rel.tableB} ON ${rel.tableA}."${rel.colA}" = ${rel.tableB}."${rel.colB}" WHERE ${rel.tableA}."${textCol.name}" = '${val}';`,
      hint: `Add WHERE after the JOIN clause to filter the combined results.`,
    };
  },
];


/* ══════════════════════════════════════
   MAIN GENERATOR
   ══════════════════════════════════════ */

/**
 * Generate practice questions for the loaded tables.
 * @param {string[]} tableNames - Array of loaded table names
 * @param {object} options - { count: 10, difficulty: 'mix' }
 * @returns {{ questions: Array, errors: string[] }}
 */
export function generateQuestions(tableNames, options = {}) {
  const { count = 10, difficulty = 'mix' } = options;
  const errors = [];

  // Analyze all tables
  const schemas = {};
  for (const name of tableNames) {
    const analysis = analyzeTable(name);
    if (analysis) schemas[name] = analysis;
    else errors.push(`Could not analyze table: ${name}`);
  }

  if (Object.keys(schemas).length === 0) {
    return { questions: [], errors: ['No valid tables found to generate questions from.'] };
  }

  // Detect relationships for JOIN questions
  const relationships = detectRelationships(schemas);

  // Determine difficulty distribution
  let easyCount, medCount, hardCount;
  if (difficulty === 'easy') { easyCount = count; medCount = 0; hardCount = 0; }
  else if (difficulty === 'medium') { easyCount = 0; medCount = count; hardCount = 0; }
  else if (difficulty === 'hard') { easyCount = 0; medCount = 0; hardCount = count; }
  else { // mix
    easyCount = Math.ceil(count * 0.4);
    medCount = Math.ceil(count * 0.4);
    hardCount = count - easyCount - medCount;
    if (hardCount < 1) { hardCount = 1; medCount--; }
  }

  const questions = [];
  const usedQuestions = new Set(); // Track question text to avoid duplicates

  // Generate easy questions
  generateFromTemplates(EASY_TEMPLATES, schemas, 'easy', easyCount, questions, usedQuestions);

  // Generate medium questions (include JOIN templates if relationships exist)
  const medTemplates = [...MEDIUM_TEMPLATES];
  generateFromTemplates(medTemplates, schemas, 'medium', medCount, questions, usedQuestions, relationships);

  // Generate hard questions
  generateFromTemplates(HARD_TEMPLATES, schemas, 'hard', hardCount, questions, usedQuestions, relationships);

  // Validate all questions by running their SQL
  const validated = [];
  for (const q of questions) {
    try {
      const result = sqlEngine.exec(q.answer);
      if (result.success) {
        validated.push(q);
      } else {
        errors.push(`Skipped invalid question: ${q.question} — ${result.error}`);
      }
    } catch (e) {
      errors.push(`Skipped erroring question: ${q.question}`);
    }
  }

  return { questions: validated, errors };
}

function generateFromTemplates(templates, schemas, difficulty, count, questions, usedQuestions, relationships = []) {
  const tableList = Object.values(schemas);
  let attempts = 0;
  const maxAttempts = count * 8; // Prevent infinite loops

  // Add JOIN questions for medium/hard if relationships exist
  if ((difficulty === 'medium' || difficulty === 'hard') && relationships.length > 0) {
    const joinCount = Math.min(Math.ceil(count * 0.3), relationships.length);
    let joinAttempts = 0;

    while (questions.filter(q => q.difficulty === difficulty).length < joinCount && joinAttempts < joinCount * 5) {
      joinAttempts++;
      const rel = pick(relationships);
      const tA = schemas[rel.tableA];
      const tB = schemas[rel.tableB];
      if (!tA || !tB) continue;

      const templateFn = pick(JOIN_TEMPLATES);
      const q = templateFn(tA, tB, rel);
      if (!q) continue;
      if (q.difficulty !== difficulty) continue;
      if (usedQuestions.has(q.question)) continue;

      usedQuestions.add(q.question);
      questions.push({
        ...q,
        difficulty,
        id: `gen_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      });
    }
  }

  while (questions.filter(q => q.difficulty === difficulty).length < count && attempts < maxAttempts) {
    attempts++;
    const table = pick(tableList);
    const templateFn = pick(templates);
    const q = templateFn(table, schemas, relationships);
    if (!q) continue;
    if (usedQuestions.has(q.question)) continue;

    usedQuestions.add(q.question);
    questions.push({
      ...q,
      difficulty,
      id: `gen_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    });
  }
}

/**
 * Get a summary of the schema for display
 */
export function getTableSummary(tableName) {
  return analyzeTable(tableName);
}
