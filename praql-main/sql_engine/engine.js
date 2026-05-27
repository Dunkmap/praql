/**
 * SQL Engine - Shared module for initializing and managing sql.js database
 */
class SQLEngine {
  constructor() {
    this.db = null;
    this.initialized = false;
    this.datasets = {};
  }

  async init() {
    if (this.initialized) return;
    
    try {
      const SQL = await initSqlJs({
        locateFile: file => {
          const url = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL 
            ? chrome.runtime.getURL(`sql_engine/${file}`) 
            : `../sql_engine/${file}`;
          return url;
        },
        print: (text) => console.log('SQL.js:', text),
        printErr: (text) => console.error('SQL.js Error:', text)
      });
      
      this.db = new SQL.Database();
      this.initialized = true;
    } catch (e) {
      this.initialized = false;
      console.error('CRITICAL: SQL.js initialization aborted.', e);
      throw new Error(`SQL Engine failure: ${e.message || 'Check WASM availability'}`);
    }
  }

  async loadDataset(name) {
    if (!this.initialized) await this.init();
    if (this.datasets[name]) return;

    try {
      const url = chrome.runtime.getURL(`datasets/${name}.sql`);
      const response = await fetch(url);
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
    if (!this.db) throw new Error('Database not initialized. Please wait a moment.');
    
    // Split into individual statements and handle CREATE/DROP DATABASE specifically for SQLite
    const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);
    let lastResults = null;

    try {
      for (const statement of statements) {
        // Special case for CREATE/DROP DATABASE as SQLite doesn't support them but we teach them
        const isDatabaseCmd = /^\s*(CREATE|DROP)\s+DATABASE/i.test(statement);
        
        if (isDatabaseCmd) {
          lastResults = [{
            columns: ['status'],
            values: [['Database operation successful (Simulated)']]
          }];
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
      return '<div class="feedback feedback-info"><span class="feedback-icon">ℹ️</span><span>Query executed successfully. No results returned.</span></div>';
    }

    let html = '';
    for (const result of results) {
      if (!result.columns || result.columns.length === 0) continue;
      
      html += `
        <div class="result-container" style="margin-top:24px; animation: slideUp 0.4s ease;">
          <div class="result-stats" style="font-size:0.8rem; color:var(--text-muted); margin-bottom:10px; font-weight:800; text-transform:uppercase; letter-spacing:1px;">
            Returned ${result.values.length} row${result.values.length !== 1 ? 's' : ''}
          </div>
          <div class="result-table-wrapper" style="border: 1px solid var(--border-color); border-radius: 16px; overflow: auto; max-height: 180px; background: var(--bg-card); box-shadow: var(--shadow-md); scrollbar-width: thin;">
            <table class="result-table" style="width:100%; border-collapse: collapse;">
              <thead>
                <tr style="background: var(--bg-tertiary);">`;
      
      for (const col of result.columns) {
        html += `<th style="position: sticky; top: 0; z-index: 10; background: var(--bg-tertiary); padding:16px; text-align:left; font-weight:800; font-size:0.85rem; color:var(--accent-pink); border-bottom: 1px solid var(--border-color); text-transform: uppercase; letter-spacing: 1px;">${escapeHtml(col)}</th>`;
      }
      
      html += `</tr></thead><tbody>`;
      
      if (result.values.length === 0) {
        html += `<tr><td colspan="${result.columns.length}" style="padding:32px; text-align:center; color:var(--text-muted); font-style:italic;">No results found for this query.</td></tr>`;
      } else {
        for (const row of result.values) {
          html += '<tr style="border-bottom: 1px solid var(--border-color); transition: background 0.2s;">';
          for (const val of row) {
            html += `<td style="padding:14px 16px; font-size:0.95rem; color:var(--text-secondary);">${val === null ? '<em style="color:#ff6b6b; font-weight:800; opacity:0.6;">NULL</em>' : escapeHtml(String(val))}</td>`;
          }
          html += '</tr>';
        }
      }
      
      html += `</tbody></table></div></div>`;
    }
    return html;

  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function highlightSQL(code) {
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
  
  // Highlight comments
  escaped = escaped.replace(/(--.*?)(\n|$)/g, '<span class="comment">$1</span>$2');
  
  // Highlight strings
  escaped = escaped.replace(/&#39;([^&#]*?(?:&#39;&#39;[^&#]*?)*)&#39;/g, '<span class="string-val">\'$1\'</span>');
  
  // Highlight functions
  for (const fn of functions) {
    const regex = new RegExp(`\\b(${fn})\\s*\\(`, 'gi');
    escaped = escaped.replace(regex, '<span class="function-name">$1</span>(');
  }
  
  // Highlight keywords (sort by length to match longer keywords first)
  const sortedKeywords = [...keywords].sort((a, b) => b.length - a.length);
  for (const kw of sortedKeywords) {
    const regex = new RegExp(`\\b(${kw.replace(/\s+/g, '\\s+')})\\b`, 'gi');
    escaped = escaped.replace(regex, (match) => {
      // Don't re-highlight if already inside a span
      return `<span class="keyword">${match}</span>`;
    });
  }
  
  return escaped;
}

// Progress Manager
class ProgressManager {
  static _KEYS = [
    'userName', 'topicsCompleted', 'questionsSolved', 'questionsAttempted', 'solvedQuestionIds',
    'questionTimes', 'totalSolveTimeMs', 'dailyChallenge', 'streak', 'lastChallengeDate',
    'clausesMastered', 'leetcodeScore', 'leetcodeStreak', 'leetcodeAttempted', 'leetcodeCorrect'
  ];

  static async getProgress() {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.get(this._KEYS, (data) => {
          resolve(this._normalize(data));
        });
      } else {
        const data = JSON.parse(localStorage.getItem('sqlmaster_progress') || '{}');
        resolve(this._normalize(data));
      }
    });
  }

  static _normalize(data) {
    return {
      userName: data.userName || '',
      topicsCompleted: data.topicsCompleted || [],
      questionsSolved: data.questionsSolved || 0,
      questionsAttempted: data.questionsAttempted || 0,
      solvedQuestionIds: data.solvedQuestionIds || [],
      questionTimes: data.questionTimes || [],
      totalSolveTimeMs: data.totalSolveTimeMs || 0,
      dailyChallenge: data.dailyChallenge || null,
      streak: data.streak || 0,
      lastChallengeDate: data.lastChallengeDate || null,
      clausesMastered: data.clausesMastered || [],
      leetcodeScore: data.leetcodeScore || 0,
      leetcodeStreak: data.leetcodeStreak || 0,
      leetcodeAttempted: data.leetcodeAttempted || 0,
      leetcodeCorrect: data.leetcodeCorrect || 0
    };
  }

  static async saveLeetcodeStats(stats) {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.set({
          leetcodeScore: stats.score,
          leetcodeStreak: stats.streak,
          leetcodeAttempted: stats.attempted,
          leetcodeCorrect: stats.correct
        }, resolve);
      } else {
        const data = JSON.parse(localStorage.getItem('sqlmaster_progress') || '{}');
        data.leetcodeScore = stats.score;
        data.leetcodeStreak = stats.streak;
        data.leetcodeAttempted = stats.attempted;
        data.leetcodeCorrect = stats.correct;
        localStorage.setItem('sqlmaster_progress', JSON.stringify(data));
        resolve();
      }
    });
  }

  static async saveUserName(name) {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.set({ userName: name }, resolve);
      } else {
        const data = JSON.parse(localStorage.getItem('sqlmaster_progress') || '{}');
        data.userName = name;
        localStorage.setItem('sqlmaster_progress', JSON.stringify(data));
        resolve();
      }
    });
  }

  static async saveTopic(topicId) {
    const progress = await this.getProgress();
    if (!progress.topicsCompleted.includes(topicId)) {
      progress.topicsCompleted.push(topicId);
      await this._save(progress);
    }
  }

  static async saveQuestion(questionId, correct, timeMs) {
    // Don't add the data of AI_Challenges into progress part
    if (String(questionId).startsWith('ch_')) return;

    const progress = await this.getProgress();
    progress.questionsAttempted = (progress.questionsAttempted || 0) + 1;

    // Track solve time
    if (timeMs && timeMs > 0) {
      progress.questionTimes.push({ id: questionId, time: timeMs, correct, date: new Date().toISOString() });
      if (correct) {
        progress.totalSolveTimeMs = (progress.totalSolveTimeMs || 0) + timeMs;
      }
    }

    if (correct && !progress.solvedQuestionIds.includes(questionId)) {
      progress.questionsSolved = (progress.questionsSolved || 0) + 1;
      progress.solvedQuestionIds.push(questionId);
    }

    await this._save(progress);
  }

  static async saveClauseMastered(clauseName) {
    const progress = await this.getProgress();
    if (!progress.clausesMastered.includes(clauseName)) {
      progress.clausesMastered.push(clauseName);
      await this._save(progress);
    }
  }

  // ===== DAILY CHALLENGE =====
  static getTodayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  static async getDailyChallenge(allQuestions) {
    const progress = await this.getProgress();
    const today = this.getTodayStr();

    // If challenge already exists for today, return it
    if (progress.dailyChallenge && progress.dailyChallenge.date === today) {
      return progress.dailyChallenge;
    }

    // Generate new daily challenge — pick 3 random questions
    const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
    // Pick 1 easy, 1 medium, 1 hard if possible
    const easy = shuffled.find(q => q.difficulty === 'easy');
    const medium = shuffled.find(q => q.difficulty === 'medium');
    const hard = shuffled.find(q => q.difficulty === 'hard');
    const picked = [easy, medium, hard].filter(Boolean);
    // Fallback: just pick 3 random
    while (picked.length < 3 && shuffled.length > picked.length) {
      const q = shuffled.find(sq => !picked.includes(sq));
      if (q) picked.push(q);
      else break;
    }

    const challenge = {
      date: today,
      questions: picked.map(q => ({ id: q.id, difficulty: q.difficulty, solved: false })),
      completed: false,
      startTime: Date.now()
    };

    // Update streak
    if (progress.lastChallengeDate) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth()+1).padStart(2,'0')}-${String(yesterday.getDate()).padStart(2,'0')}`;
      if (progress.lastChallengeDate === yStr) {
        // Streak continues (don't increment yet - increment when completed)
      } else if (progress.lastChallengeDate !== today) {
        // Streak broken
        progress.streak = 0;
      }
    }

    progress.dailyChallenge = challenge;
    await this._save(progress);
    return challenge;
  }

  static async solveDailyChallengeQuestion(questionId) {
    const progress = await this.getProgress();
    if (!progress.dailyChallenge) return;

    const qEntry = progress.dailyChallenge.questions.find(q => q.id === questionId);
    if (qEntry) qEntry.solved = true;

    // Check if all solved
    const allSolved = progress.dailyChallenge.questions.every(q => q.solved);
    if (allSolved && !progress.dailyChallenge.completed) {
      progress.dailyChallenge.completed = true;
      progress.dailyChallenge.completedTime = Date.now();
      progress.streak = (progress.streak || 0) + 1;
      progress.lastChallengeDate = this.getTodayStr();
    }

    await this._save(progress);
    return progress.dailyChallenge;
  }

  // ===== SPEED STATS =====
  static getSpeedStats(progress) {
    const times = progress.questionTimes || [];
    const correctTimes = times.filter(t => t.correct);
    if (correctTimes.length === 0) return { avg: 0, fastest: 0, total: 0, count: 0 };

    const totalMs = correctTimes.reduce((sum, t) => sum + t.time, 0);
    const fastest = Math.min(...correctTimes.map(t => t.time));
    return {
      avg: Math.round(totalMs / correctTimes.length),
      fastest: Math.round(fastest),
      total: Math.round(totalMs),
      count: correctTimes.length
    };
  }

  // ===== ACTIVITY STATS =====
  static getActivityData(progress) {
    const times = progress.questionTimes || [];
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
      const count = times.filter(t => t.date && t.date.startsWith(dateStr) && t.correct).length;
      last7Days.push({ date: dateStr, label: dayLabel, count });
    }
    return last7Days;
  }

  static renderActivityChart(containerId, progress, heightPixels = 200) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const data = this.getActivityData(progress);
    const maxCount = Math.max(...data.map(d => d.count), 5); // Min scale of 5
    
    let html = `
      <div class="activity-chart-wrapper" style="width: 100%; height: ${heightPixels}px; display: flex; align-items: flex-end; justify-content: space-between; padding: 10px 5px 30px 5px; position: relative;">
        <!-- Background Grid Lines -->
        <div style="position: absolute; top:0; left:0; right:0; bottom:30px; border-bottom: 2px solid var(--bg-grid); z-index: 0;"></div>
        <div style="position: absolute; top:50%; left:0; right:0; height:1px; border-top: 1.5px dashed var(--bg-grid); z-index: 0; transform: translateY(-15px);"></div>
    `;

    data.forEach((d, i) => {
      const height = (d.count / maxCount) * 100;
      const isToday = i === 6;
      const barColor = isToday ? '#b86a7c' : '#b9e1c6';
      const textColor = isToday ? '#b86a7c' : '#718096';
      
      html += `
        <div class="activity-bar-group" style="flex: 1; display: flex; flex-direction: column; align-items: center; z-index: 1;">
          <div class="activity-bar-value" style="font-size: 0.65rem; font-weight: 800; color: ${barColor}; margin-bottom: 2px; opacity: ${d.count > 0 ? 1 : 0}; transition: all 0.3s ease;">${d.count}</div>
          <div class="activity-bar" title="${d.count} questions solved" style="width: ${heightPixels > 150 ? '30px' : '20px'}; height: ${height}%; background: ${barColor}; border-radius: 6px 6px 3px 3px; transition: height 1s cubic-bezier(0.175, 0.885, 0.32, 1.275); position: relative; min-height: ${d.count > 0 ? '4px' : '0px'}; box-shadow: 0 4px 0 rgba(0,0,0,0.05);">
            ${isToday ? '<div style="position:absolute; top:-12px; left:50%; transform:translateX(-50%); font-size:10px;">✨</div>' : ''}
          </div>
          <div class="activity-day" style="font-size: 0.65rem; font-weight: 700; color: ${textColor}; margin-top: 10px; text-transform: uppercase; letter-spacing: 0.5px;">${d.label}</div>
        </div>
      `;
    });

    html += `</div>`;
    container.innerHTML = html;

    // Small delay to trigger transitions
    setTimeout(() => {
      const bars = container.querySelectorAll('.activity-bar');
      bars.forEach(bar => {
        const finalHeight = bar.style.height;
        bar.style.height = '0';
        setTimeout(() => bar.style.height = finalHeight, 50);
      });
    }, 100);
  }

  static formatTime(ms) {
    if (ms === 0) return '--';
    if (ms < 1000) return ms + 'ms';
    const secs = (ms / 1000).toFixed(1);
    if (secs < 60) return secs + 's';
    const mins = Math.floor(ms / 60000);
    const remSecs = Math.round((ms % 60000) / 1000);
    return `${mins}m ${remSecs}s`;
  }

  static async resetProgress() {
    const p = await this.getProgress();
    const emptyProgress = {
      userName: p.userName || '',
      topicsCompleted: [],
      questionsSolved: 0,
      questionsAttempted: 0,
      solvedQuestionIds: [],
      questionTimes: [],
      totalSolveTimeMs: 0,
      dailyChallenge: null,
      streak: 0,
      lastChallengeDate: null,
      clausesMastered: []
    };
    await this._save(emptyProgress);
  }

  static async _save(progress) {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.set(progress, resolve);
      } else {
        localStorage.setItem('sqlmaster_progress', JSON.stringify(progress));
        resolve();
      }
    });
  }
}

// Global instance
const sqlEngine = new SQLEngine();

// Initialize Syntax Highlighting for all textarea.sql-editor on the page
function setupSyntaxHighlighting() {
  const editors = document.querySelectorAll('textarea.sql-editor:not([data-highlighted="true"])');
  editors.forEach(textarea => {
    textarea.setAttribute('data-highlighted', 'true');
    textarea.spellcheck = false;
    
    // Create wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'editor-highlight-wrapper';
    
    // Create background pre element
    const pre = document.createElement('pre');
    pre.className = textarea.className + ' editor-highlight-bg';
    
    // Match styles exactly to prevent misalignment
    const styles = window.getComputedStyle(textarea);
    const syncStyles = [
      'fontFamily', 'fontSize', 'lineHeight', 'fontWeight', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
      'letterSpacing', 'textAlign', 'wordSpacing', 'textTransform', 'whiteSpace', 'wordBreak', 'tabSize'
    ];
    syncStyles.forEach(s => pre.style[s] = styles[s]);
    
    pre.style.margin = '0';
    pre.style.boxSizing = 'border-box';
    pre.style.width = '100%';
    pre.style.height = '100%';
    pre.style.position = 'absolute';
    pre.style.top = '0';
    pre.style.left = '0';
    pre.style.zIndex = '1';
    pre.style.pointerEvents = 'none';
    pre.style.color = 'inherit';
    pre.style.display = 'block';
    pre.style.overflow = 'hidden';
    
    const code = document.createElement('code');
    code.style.fontFamily = 'inherit';
    code.style.fontSize = 'inherit';
    code.style.lineHeight = 'inherit';
    code.style.padding = '0';
    code.style.margin = '0';
    code.style.display = 'block';
    pre.appendChild(code);
    
    // Insert into DOM
    textarea.parentNode.insertBefore(wrapper, textarea);
    wrapper.style.position = 'relative';
    wrapper.style.width = '100%';
    wrapper.style.margin = styles.margin;
    wrapper.appendChild(pre);
    wrapper.appendChild(textarea);
    
    // Final style overrides for visibility
    textarea.style.position = 'relative';
    textarea.style.zIndex = '2';
    textarea.style.display = 'block';
    
    pre.style.color = '#e6edf3'; 
    textarea.style.caretColor = '#a0c4ff';
    textarea.style.color = 'transparent';
    textarea.style.webkitTextFillColor = 'transparent';
    
    const update = () => {
      let text = textarea.value;
      if (text.endsWith('\n')) text += ' '; // Fix scroll jitter on last line
      code.innerHTML = highlightSQL(text);
    };
    
    textarea.addEventListener('input', update);
    textarea.addEventListener('scroll', () => {
      pre.scrollTop = textarea.scrollTop;
      pre.scrollLeft = textarea.scrollLeft;
    });

    // Handle programmatic value changes (e.g., loading practice questions)
    const descriptor = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value');
    if (!textarea._valuePatched && descriptor) {
        textarea._valuePatched = true;
        Object.defineProperty(textarea, 'value', {
            get: function() { return descriptor.get.call(this); },
            set: function(val) {
                descriptor.set.call(this, val);
                update();
            }
        });
    }

    update();
  });
}

// Auto-init on load
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(setupSyntaxHighlighting, 100);
});
