/**
 * SQL Engine — Web-adapted version (no Chrome APIs)
 * Uses fetch() for WASM and dataset loading
 */
export class SQLEngine {
  constructor() {
    this.db = null;
    this.initialized = false;
    this.datasets = {};
  }

  async init() {
    if (this.initialized) return;
    try {
      const SQL = await initSqlJs({
        locateFile: file => `/${file}`
      });
      this.db = new SQL.Database();
      this.initialized = true;
    } catch (e) {
      this.initialized = false;
      console.error('SQL Engine init failed:', e);
      throw new Error(`SQL Engine failure: ${e.message}`);
    }
  }

  async loadDataset(name) {
    if (!this.initialized) await this.init();
    if (this.datasets[name]) return;
    try {
      const response = await fetch(`/datasets/${name}.sql`);
      const sql = await response.text();
      this.db.run(sql);
      this.datasets[name] = true;
    } catch (e) {
      console.error(`Failed to load dataset: ${name}`, e);
      throw e;
    }
  }

  async loadAllDatasets() {
    const names = ['employees', 'customers', 'products', 'orders', 'sales'];
    for (const name of names) {
      await this.loadDataset(name);
    }
  }

  exec(sql) {
    if (!this.db) throw new Error('Database not initialized.');
    const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);
    let lastResults = null;
    try {
      for (const statement of statements) {
        const isDatabaseCmd = /^\s*(CREATE|DROP)\s+DATABASE/i.test(statement);
        if (isDatabaseCmd) {
          lastResults = [{ columns: ['status'], values: [['Database operation successful (Simulated)']] }];
          continue;
        }
        lastResults = this.db.exec(statement);
      }
      return { success: true, results: lastResults };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  reset() {
    if (this.db) this.db.close();
    this.db = null;
    this.initialized = false;
    this.datasets = {};
  }

  async resetAndReload() {
    this.reset();
    await this.init();
    await this.loadAllDatasets();
  }

  renderResults(results) {
    if (!results || results.length === 0) {
      return '<div class="feedback feedback-info"><span class="feedback-icon">ℹ</span><span>Query executed successfully. No results returned.</span></div>';
    }
    let html = '';
    for (const result of results) {
      if (!result.columns || result.columns.length === 0) continue;
      html += `
        <div class="result-container">
          <div class="result-stats">
            Returned ${result.values.length} row${result.values.length !== 1 ? 's' : ''}
          </div>
          <div class="result-table-wrapper" style="border: 1px solid var(--border-color); border-radius: 16px; overflow: auto; max-height: 180px; background: var(--bg-card); box-shadow: var(--shadow-md); scrollbar-width: thin;">
            <table class="result-table">
              <thead><tr>`;
      for (const col of result.columns) {
        html += `<th>${escapeHtml(col)}</th>`;
      }
      html += `</tr></thead><tbody>`;
      if (result.values.length === 0) {
        html += `<tr><td colspan="${result.columns.length}" class="empty-row">No results found.</td></tr>`;
      } else {
        for (const row of result.values) {
          html += '<tr>';
          for (const val of row) {
            html += `<td>${val === null ? '<em class="null-val">NULL</em>' : escapeHtml(String(val))}</td>`;
          }
          html += '</tr>';
        }
      }
      html += `</tbody></table></div></div>`;
    }
    return html;
  }
}

export function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export function highlightSQL(code) {
  const keywords = ['SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'NOT', 'IN', 'BETWEEN', 'LIKE',
    'ORDER BY', 'GROUP BY', 'HAVING', 'LIMIT', 'OFFSET', 'JOIN', 'INNER JOIN', 'LEFT JOIN',
    'RIGHT JOIN', 'FULL JOIN', 'CROSS JOIN', 'ON', 'AS', 'DISTINCT', 'INSERT INTO', 'VALUES',
    'UPDATE', 'SET', 'DELETE', 'CREATE TABLE', 'ALTER TABLE', 'DROP TABLE', 'CREATE VIEW',
    'CREATE INDEX', 'DROP VIEW', 'DROP INDEX', 'IF EXISTS', 'IF NOT EXISTS',
    'BEGIN', 'COMMIT', 'ROLLBACK', 'TRANSACTION', 'UNION', 'UNION ALL', 'CASE', 'WHEN',
    'THEN', 'ELSE', 'END', 'IS NULL', 'IS NOT NULL', 'EXISTS', 'NOT EXISTS', 'ASC', 'DESC',
    'PRIMARY KEY', 'FOREIGN KEY', 'REFERENCES', 'UNIQUE', 'NOT NULL', 'DEFAULT', 'CHECK',
    'ADD COLUMN', 'RENAME TO', 'RENAME COLUMN', 'PARTITION BY', 'OVER', 'ROWS', 'RANGE',
    'PRECEDING', 'FOLLOWING', 'CURRENT ROW', 'UNBOUNDED', 'NULL', 'INTEGER', 'TEXT', 'REAL',
    'VARCHAR', 'CHAR', 'INT', 'DECIMAL', 'FLOAT', 'DOUBLE', 'BOOLEAN', 'DATE', 'DATETIME',
    'TIMESTAMP', 'BIGINT', 'SMALLINT', 'TINYINT', 'BLOB', 'ENUM', 'AUTO_INCREMENT',
    'UNSIGNED', 'SIGNED', 'TRUNCATE', 'EXPLAIN', 'SHOW TABLES', 'DESCRIBE', 'USE',
    'CREATE DATABASE', 'DROP DATABASE', 'ALTER DATABASE', 'GRANT', 'REVOKE'];
  
  const functions = ['COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'ROUND', 'COALESCE', 'CAST',
    'UPPER', 'LOWER', 'LENGTH', 'SUBSTR', 'INSTR', 'REPLACE', 'TRIM', 'LTRIM', 'RTRIM',
    'DATE', 'TIME', 'DATETIME', 'STRFTIME', 'JULIANDAY', 'ABS', 'TYPEOF', 'PRINTF',
    'ROW_NUMBER', 'RANK', 'DENSE_RANK', 'NTILE', 'LEAD', 'LAG', 'PERCENT_RANK',
    'FIRST_VALUE', 'LAST_VALUE', 'NTH_VALUE', 'TOTAL', 'GROUP_CONCAT', 'IIF', 'IFNULL',
    'NULLIF', 'RANDOM', 'UNICODE', 'HEX', 'ZEROBLOB'];

  let escaped = escapeHtml(code);
  escaped = escaped.replace(/(--.*?)(\n|$)/g, '<span class="sql-comment">$1</span>$2');
  escaped = escaped.replace(/&#39;([^&#]*?(?:&#39;&#39;[^&#]*?)*)&#39;/g, '<span class="sql-string">\'$1\'</span>');
  for (const fn of functions) {
    const regex = new RegExp(`\\b(${fn})\\s*\\(`, 'gi');
    escaped = escaped.replace(regex, '<span class="sql-function">$1</span>(');
  }
  const sortedKeywords = [...keywords].sort((a, b) => b.length - a.length);
  for (const kw of sortedKeywords) {
    const regex = new RegExp(`\\b(${kw.replace(/\s+/g, '\\s+')})\\b`, 'gi');
    escaped = escaped.replace(regex, (match) => `<span class="sql-keyword">${match}</span>`);
  }
  return escaped;
}

// Syntax highlighting setup for textarea editors
export function setupSyntaxHighlighting() {
  const editors = document.querySelectorAll('textarea.sql-editor:not([data-highlighted="true"])');
  editors.forEach(textarea => {
    textarea.setAttribute('data-highlighted', 'true');
    textarea.spellcheck = false;
    const wrapper = document.createElement('div');
    wrapper.className = 'editor-highlight-wrapper';
    const pre = document.createElement('pre');
    pre.className = textarea.className + ' editor-highlight-bg';
    const styles = window.getComputedStyle(textarea);
    ['fontFamily', 'fontSize', 'lineHeight', 'fontWeight', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
      'letterSpacing', 'textAlign', 'wordSpacing', 'textTransform', 'whiteSpace', 'wordBreak', 'tabSize'
    ].forEach(s => pre.style[s] = styles[s]);
    pre.style.margin = '0'; pre.style.boxSizing = 'border-box'; pre.style.width = '100%'; pre.style.height = '100%';
    pre.style.position = 'absolute'; pre.style.top = '0'; pre.style.left = '0'; pre.style.zIndex = '1';
    pre.style.pointerEvents = 'none'; pre.style.color = 'inherit'; pre.style.display = 'block'; pre.style.overflow = 'hidden';
    const code = document.createElement('code');
    code.style.fontFamily = 'inherit'; code.style.fontSize = 'inherit'; code.style.lineHeight = 'inherit';
    code.style.padding = '0'; code.style.margin = '0'; code.style.display = 'block';
    pre.appendChild(code);
    textarea.parentNode.insertBefore(wrapper, textarea);
    wrapper.style.position = 'relative'; wrapper.style.width = '100%'; wrapper.style.margin = styles.margin;
    wrapper.appendChild(pre); wrapper.appendChild(textarea);
    textarea.style.position = 'relative'; textarea.style.zIndex = '2'; textarea.style.display = 'block';
    pre.style.color = '#e6edf3'; textarea.style.caretColor = '#a0c4ff';
    textarea.style.color = 'transparent'; textarea.style.webkitTextFillColor = 'transparent';
    const update = () => {
      let text = textarea.value;
      if (text.endsWith('\n')) text += ' ';
      code.innerHTML = highlightSQL(text);
    };
    textarea.addEventListener('input', update);
    textarea.addEventListener('scroll', () => { pre.scrollTop = textarea.scrollTop; pre.scrollLeft = textarea.scrollLeft; });
    const descriptor = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value');
    if (!textarea._valuePatched && descriptor) {
      textarea._valuePatched = true;
      Object.defineProperty(textarea, 'value', {
        get() { return descriptor.get.call(this); },
        set(val) { descriptor.set.call(this, val); update(); }
      });
    }
    update();
  });
}

// Global instance
export const sqlEngine = new SQLEngine();
