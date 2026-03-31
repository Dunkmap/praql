/**
 * AI SQL Assistant - Natural Language to SQL using Groq API
 * Uses Groq's free LLM API to convert plain English to SQL queries
 */

let aiSchema = {};        // Schema of loaded tables
let generatedSQL = '';    // Last generated SQL query
let isEditing = false;    // Track edit mode

// ===== INIT =====
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await sqlEngine.init();
    await sqlEngine.loadAllDatasets();
    buildSchemaFromDB();
  } catch (e) {
    console.error('SQL Engine init failed:', e);
  }

  loadApiKey();
  setupEventListeners();
  updateGenerateButtonState();
});

// ===== SCHEMA HELPERS =====
function buildSchemaFromDB() {
  // Introspect the database for all tables
  try {
    const result = sqlEngine.exec("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;");
    if (result.success && result.results && result.results.length > 0) {
      result.results[0].values.forEach(row => {
        const tableName = row[0];
        const colResult = sqlEngine.exec(`PRAGMA table_info(${tableName})`);
        if (colResult.success && colResult.results && colResult.results.length > 0) {
          aiSchema[tableName] = colResult.results[0].values.map(v => ({
            name: v[1],
            type: v[2]
          }));
        }
      });
    }
  } catch (e) {
    console.error('Schema introspection failed:', e);
  }
}

function getSchemaDescription() {
  const tables = Object.entries(aiSchema);
  if (tables.length === 0) return 'No tables loaded.';
  
  return tables.map(([table, cols]) => {
    const colStr = cols.map(c => `  ${c.name} (${c.type})`).join('\n');
    return `Table: ${table}\nColumns:\n${colStr}`;
  }).join('\n\n');
}

// ===== API KEY MANAGEMENT =====
function loadApiKey() {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['groqApiKey'], (result) => {
      if (result.groqApiKey) {
        document.getElementById('api-key-input').value = result.groqApiKey;
        setApiStatus(true);
      }
    });
  } else {
    const key = localStorage.getItem('groqApiKey');
    if (key) {
      document.getElementById('api-key-input').value = key;
      setApiStatus(true);
    }
  }
}

function saveApiKey() {
  const key = document.getElementById('api-key-input').value.trim();
  if (!key) {
    setApiStatus(false);
    return;
  }

  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.set({ groqApiKey: key }, () => {
      setApiStatus(true);
      showToast('API Key saved successfully! ✅');
    });
  } else {
    localStorage.setItem('groqApiKey', key);
    setApiStatus(true);
    showToast('API Key saved successfully! ✅');
  }
  updateGenerateButtonState();
}

function getApiKey() {
  return document.getElementById('api-key-input').value.trim();
}

function setApiStatus(connected) {
  const statusEl = document.getElementById('api-status');
  const statusText = document.getElementById('api-status-text');
  if (connected) {
    statusEl.className = 'api-key-status connected';
    statusText.textContent = 'CONNECTED';
  } else {
    statusEl.className = 'api-key-status disconnected';
    statusText.textContent = 'NOT CONNECTED';
  }
}

function updateGenerateButtonState() {
  const btn = document.getElementById('generate-btn');
  const key = getApiKey();
  btn.disabled = !key;
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
  // Save API key
  document.getElementById('save-key-btn').addEventListener('click', saveApiKey);

  // Toggle key visibility
  document.getElementById('toggle-key-visibility').addEventListener('click', () => {
    const input = document.getElementById('api-key-input');
    input.type = input.type === 'password' ? 'text' : 'password';
  });

  // API key input change
  document.getElementById('api-key-input').addEventListener('input', updateGenerateButtonState);

  // How-to accordion
  document.getElementById('howto-toggle').addEventListener('click', () => {
    const toggle = document.getElementById('howto-toggle');
    const content = document.getElementById('howto-content');
    toggle.classList.toggle('open');
    content.classList.toggle('open');
  });

  // Generate button
  document.getElementById('generate-btn').addEventListener('click', generateSQL);

  // Copy SQL
  document.getElementById('copy-sql-btn').addEventListener('click', copySQL);

  // Edit SQL
  document.getElementById('edit-sql-btn').addEventListener('click', toggleEditMode);

  // Run SQL
  document.getElementById('run-sql-btn').addEventListener('click', runGeneratedSQL);

  // Example prompts
  document.querySelectorAll('.example-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.getElementById('ai-prompt').value = chip.dataset.prompt;
      document.getElementById('ai-prompt').focus();
    });
  });

  // Ctrl+Enter to generate
  document.getElementById('ai-prompt').addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      generateSQL();
    }
  });

  // File upload
  setupFileUpload();
}

// ===== FILE UPLOAD (similar to studio) =====
function setupFileUpload() {
  const uploadZone = document.getElementById('ai-upload-zone');
  const fileInput = document.getElementById('ai-file-input');

  uploadZone.addEventListener('click', () => fileInput.click());
  uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('dragover');
  });
  uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('dragover'));
  uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('dragover');
    if (e.dataTransfer.files.length) handleAIFiles(e.dataTransfer.files);
  });
  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length) handleAIFiles(e.target.files);
  });
}

async function handleAIFiles(files) {
  for (const file of files) {
    const ext = file.name.split('.').pop().toLowerCase();
    let tableName = file.name.split('.')[0].replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
    if (/^\d/.test(tableName)) tableName = 't_' + tableName;

    if (ext === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => loadAIData(tableName, results.data)
      });
    } else if (ext === 'xls' || ext === 'xlsx') {
      const reader = new FileReader();
      reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);
        loadAIData(tableName, json);
      };
      reader.readAsArrayBuffer(file);
    }
  }
}

function loadAIData(tableName, data) {
  if (!data || data.length === 0) return;

  const headers = Object.keys(data[0]);
  const colsDefs = headers.map(h => `"${h}" TEXT`).join(', ');
  sqlEngine.exec(`DROP TABLE IF EXISTS ${tableName}; CREATE TABLE ${tableName} (${colsDefs});`);

  try {
    const bindingsArr = headers.map(() => '?').join(',');
    const insertStmt = `INSERT INTO ${tableName} VALUES (${bindingsArr})`;
    const stmt = sqlEngine.db.prepare(insertStmt);
    data.forEach(row => {
      const values = headers.map(h => {
        let val = row[h];
        if (val === undefined || val === null) return '';
        return val.toString();
      });
      stmt.run(values);
    });
    stmt.free();

    // Update schema
    aiSchema[tableName] = headers.map(h => ({ name: h, type: 'TEXT' }));
    updateAITableChips();
    showToast(`Loaded table "${tableName}" (${data.length} rows) ✅`);
  } catch (e) {
    showToast(`Failed to load "${tableName}": ${e.message}`, true);
  }
}

function updateAITableChips() {
  const container = document.getElementById('ai-tables-container');
  const chipBox = document.getElementById('ai-table-chips');
  chipBox.innerHTML = '';

  // Show all tables (built-in + uploaded)
  buildSchemaFromDB(); // Refresh
  const tables = Object.keys(aiSchema);

  if (tables.length === 0) {
    container.style.display = 'none';
    return;
  }

  container.style.display = 'block';
  tables.forEach(table => {
    const chip = document.createElement('div');
    chip.className = 'table-chip';
    chip.innerHTML = `📊 <span style="text-decoration: underline; text-underline-offset: 3px;">${table}</span>
      <span style="font-size:0.7rem; color:#a0aacc; font-weight:600;">(${aiSchema[table].length} cols)</span>`;
    chipBox.appendChild(chip);
  });
}

// ===== GROQ API CALL =====
async function generateSQL() {
  const apiKey = getApiKey();
  const prompt = document.getElementById('ai-prompt').value.trim();

  if (!apiKey) {
    showToast('Please enter your Groq API key first! 🔑', true);
    return;
  }
  if (!prompt) {
    showToast('Please describe what you want to query! 💬', true);
    return;
  }

  // Rebuild schema knowledge
  buildSchemaFromDB();
  const schemaDesc = getSchemaDescription();

  // Show loading
  document.getElementById('ai-loading').style.display = 'flex';
  document.getElementById('generated-section').classList.remove('visible');
  document.getElementById('result-section').style.display = 'none';
  document.getElementById('generate-btn').disabled = true;

  const systemPrompt = `You are an expert SQL query generator. You convert natural language descriptions into valid SQLite SQL queries.

AVAILABLE DATABASE SCHEMA:
${schemaDesc}

RULES:
1. Generate ONLY valid SQLite SQL queries based on the schema above.
2. Column and table names are CASE-SENSITIVE. Always wrap them in double quotes exactly as shown in the schema. For example: SELECT "Price", "Name" FROM "employees";
3. Return ONLY the SQL query — no explanations, no markdown, no code blocks.
4. If the user's request is ambiguous, make reasonable assumptions.
5. SQL keywords must be in UPPERCASE (SELECT, FROM, WHERE, etc.).
6. Always end with a semicolon.
7. If joining tables, use explicit JOIN syntax.
8. For aggregate queries, always include GROUP BY where needed.
9. NEVER change the case of column or table names. Use them EXACTLY as provided in the schema.

After the SQL query, add a separator "---EXPLANATION---" followed by a brief 1-2 sentence explanation of what the query does.`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 1024,
        top_p: 1,
        stream: false
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim() || '';

    // Parse SQL and explanation
    let sql = content;
    let explanation = '';

    if (content.includes('---EXPLANATION---')) {
      const parts = content.split('---EXPLANATION---');
      sql = parts[0].trim();
      explanation = parts[1]?.trim() || '';
    }

    // Clean up SQL — remove markdown code blocks if present
    sql = sql.replace(/```sql\n?/gi, '').replace(/```\n?/g, '').trim();

    generatedSQL = sql;
    displayGeneratedSQL(sql, explanation);

  } catch (error) {
    console.error('Groq API Error:', error);
    document.getElementById('ai-loading').style.display = 'none';

    let errorMsg = error.message;
    if (errorMsg.includes('401') || errorMsg.includes('Invalid API Key')) {
      errorMsg = 'Invalid API key. Please check your Groq API key and try again.';
      setApiStatus(false);
    } else if (errorMsg.includes('429')) {
      errorMsg = 'Rate limit exceeded. Groq free tier allows ~30 requests/min. Wait a moment and try again.';
    } else if (errorMsg.includes('Failed to fetch') || errorMsg.includes('NetworkError')) {
      errorMsg = 'Network error. Check your internet connection.';
    }

    showToast(`❌ ${errorMsg}`, true);
  } finally {
    document.getElementById('generate-btn').disabled = !getApiKey();
  }
}

// ===== DISPLAY =====
function displayGeneratedSQL(sql, explanation) {
  document.getElementById('ai-loading').style.display = 'none';

  const section = document.getElementById('generated-section');
  section.classList.add('visible');

  // Syntax-highlight the SQL
  const outputEl = document.getElementById('sql-output');
  outputEl.innerHTML = highlightSQL(sql);

  // Show explanation if available
  const explEl = document.getElementById('ai-explanation');
  const explText = document.getElementById('ai-explanation-text');
  if (explanation) {
    explEl.style.display = 'block';
    explText.textContent = explanation;
  } else {
    explEl.style.display = 'none';
  }

  // Reset edit mode
  isEditing = false;
  document.getElementById('edit-sql-btn').innerHTML = '✏️ EDIT';

  // Smooth scroll to generated section
  section.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function highlightSQL(sql) {
  // Simple SQL syntax highlighting
  const keywords = ['SELECT', 'FROM', 'WHERE', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER',
    'ON', 'AND', 'OR', 'NOT', 'IN', 'LIKE', 'BETWEEN', 'IS', 'NULL', 'AS',
    'ORDER', 'BY', 'GROUP', 'HAVING', 'LIMIT', 'OFFSET', 'UNION', 'ALL',
    'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE', 'CREATE', 'TABLE',
    'DROP', 'ALTER', 'INDEX', 'DISTINCT', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END',
    'ASC', 'DESC', 'EXISTS', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'CAST',
    'COALESCE', 'IFNULL', 'CROSS', 'NATURAL', 'USING', 'WITH', 'RECURSIVE',
    'EXCEPT', 'INTERSECT', 'OVER', 'PARTITION', 'ROW_NUMBER', 'RANK', 'DENSE_RANK',
    'LAG', 'LEAD', 'FIRST_VALUE', 'LAST_VALUE', 'NTILE', 'FULL'];

  const functions = ['COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'ROUND', 'UPPER', 'LOWER',
    'LENGTH', 'SUBSTR', 'TRIM', 'REPLACE', 'COALESCE', 'IFNULL', 'CAST',
    'DATE', 'TIME', 'DATETIME', 'STRFTIME', 'ABS', 'RANDOM', 'TYPEOF',
    'GROUP_CONCAT', 'TOTAL', 'PRINTF', 'INSTR', 'LTRIM', 'RTRIM', 'HEX',
    'ZEROBLOB', 'NULLIF', 'IIF', 'UNICODE', 'QUOTE'];

  let escaped = escapeHtml(sql);

  // Highlight strings
  escaped = escaped.replace(/'([^']*)'/g, '<span class="sql-string">\'$1\'</span>');

  // Highlight numbers
  escaped = escaped.replace(/\b(\d+\.?\d*)\b/g, '<span class="sql-number">$1</span>');

  // Highlight keywords (word boundary match, case insensitive)
  keywords.forEach(kw => {
    const regex = new RegExp(`\\b(${kw})\\b`, 'gi');
    escaped = escaped.replace(regex, (match) => {
      // Don't re-highlight if already inside a span
      return `<span class="sql-keyword">${match}</span>`;
    });
  });

  return escaped;
}

// ===== ACTIONS =====
function copySQL() {
  const sql = generatedSQL;
  if (!sql) return;

  navigator.clipboard.writeText(sql).then(() => {
    showToast('SQL copied to clipboard! 📋');
    const btn = document.getElementById('copy-sql-btn');
    btn.innerHTML = '✅ COPIED!';
    setTimeout(() => { btn.innerHTML = '📋 COPY'; }, 2000);
  }).catch(() => {
    // Fallback
    const ta = document.createElement('textarea');
    ta.value = sql;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showToast('SQL copied! 📋');
  });
}

function toggleEditMode() {
  const container = document.getElementById('sql-output-container');
  const editBtn = document.getElementById('edit-sql-btn');

  if (!isEditing) {
    // Enter edit mode
    isEditing = true;
    editBtn.innerHTML = '💾 SAVE';
    container.innerHTML = `<textarea class="sql-edit-textarea" id="sql-edit-area">${escapeHtml(generatedSQL)}</textarea>`;
    document.getElementById('sql-edit-area').focus();
  } else {
    // Save edits
    isEditing = false;
    editBtn.innerHTML = '✏️ EDIT';
    const edited = document.getElementById('sql-edit-area').value.trim();
    generatedSQL = edited;
    container.innerHTML = `<div class="sql-output-box" id="sql-output">${highlightSQL(edited)}</div>`;
  }
}

function runGeneratedSQL() {
  // If in edit mode, save first
  if (isEditing) {
    const edited = document.getElementById('sql-edit-area')?.value?.trim();
    if (edited) generatedSQL = edited;
    isEditing = false;
    document.getElementById('edit-sql-btn').innerHTML = '✏️ EDIT';
    const container = document.getElementById('sql-output-container');
    container.innerHTML = `<div class="sql-output-box" id="sql-output">${highlightSQL(generatedSQL)}</div>`;
  }

  if (!generatedSQL) return;

  const resultSection = document.getElementById('result-section');
  const resultDiv = document.getElementById('ai-result');
  const execTimeEl = document.getElementById('ai-exec-time');

  resultSection.style.display = 'block';

  const startTime = performance.now();
  const result = sqlEngine.exec(generatedSQL);
  const elapsed = (performance.now() - startTime).toFixed(1);

  execTimeEl.textContent = `⏱ ${elapsed}ms`;

  if (result.success) {
    if (result.results && result.results.length > 0) {
      resultDiv.innerHTML = sqlEngine.renderResults(result.results);
    } else {
      resultDiv.innerHTML = `
        <div style="padding: 40px; text-align: center; border: 1.5px dashed #eae1d7; border-radius: 20px; color: #718096;">
          <div style="font-size: 2rem; margin-bottom: 10px;">✅</div>
          <div style="font-weight: 800; color: #32475b;">Query executed successfully!</div>
          <div style="font-size: 0.85rem; margin-top: 5px;">No rows returned.</div>
        </div>`;
    }
  } else {
    resultDiv.innerHTML = `
      <div style="padding: 24px; background: #fef2f2; border: 1.5px solid #fecaca; border-radius: 18px;">
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
          <span style="font-size: 1.3rem;">❌</span>
          <span style="font-weight: 800; color: #b91c1c;">Query Error</span>
        </div>
        <div style="font-size: 0.85rem; color: #991b1b; font-weight: 600; line-height: 1.5;">
          ${escapeHtml(result.error || 'Unknown error occurred')}
        </div>
        <div style="margin-top: 12px; font-size: 0.78rem; color: #b91c1c; opacity: 0.7;">
          Tip: Click ✏️ EDIT to fix the query, or re-describe your request.
        </div>
      </div>`;
  }

  // Scroll to results
  resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ===== TOAST NOTIFICATION =====
function showToast(message, isError = false) {
  // Remove existing toast
  const existing = document.querySelector('.ai-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'ai-toast';
  toast.style.cssText = `
    position: fixed;
    bottom: 30px;
    left: 50%;
    transform: translateX(-50%) translateY(20px);
    padding: 14px 28px;
    background: ${isError ? '#fef2f2' : '#ffffff'};
    border: 1.5px solid ${isError ? '#fecaca' : '#eae1d7'};
    border-radius: 16px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.85rem;
    font-weight: 700;
    color: ${isError ? '#b91c1c' : '#32475b'};
    box-shadow: 0 10px 40px rgba(0,0,0,0.1);
    z-index: 10000;
    opacity: 0;
    transition: all 0.3s ease;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
  });

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(20px)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ===== UTILITY =====
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
