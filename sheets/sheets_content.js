/**
 * SQL Master - Google Sheets Content Script
 * With AI prompt-to-SQL via Groq API
 */

(function() {
  'use strict';

  if (document.getElementById('sqlmaster-sheets-panel')) return;

  let capturedHeaders = [];
  let capturedRows = [];
  let currentSheetName = 'sheet';
  let isDragging = false;
  let dragOffset = { x: 0, y: 0 };
  let lastResults = null;
  let groqApiKey = '';

  function getSheetInfo() {
    const url = window.location.href;
    const idMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
    const gidMatch = url.match(/[#&]gid=(\d+)/);
    return {
      spreadsheetId: idMatch ? idMatch[1] : null,
      gid: gidMatch ? gidMatch[1] : '0'
    };
  }

  function getActiveSheetName() {
    const activeTab = document.querySelector('.docs-sheet-active-tab .docs-sheet-tab-name');
    if (activeTab) {
      const name = activeTab.textContent.trim();
      if (name) return name;
    }
    return 'sheet';
  }

  function sanitizeName(name) {
    let safe = name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
    if (/^\d/.test(safe)) safe = 'tbl_' + safe;
    return safe || 'sheet';
  }

  function parseCSV(text) {
    const rows = [];
    let row = [];
    let cell = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      const next = text[i + 1];
      if (inQuotes) {
        if (ch === '"' && next === '"') { cell += '"'; i++; }
        else if (ch === '"') { inQuotes = false; }
        else { cell += ch; }
      } else {
        if (ch === '"') { inQuotes = true; }
        else if (ch === ',') { row.push(cell); cell = ''; }
        else if (ch === '\n' || (ch === '\r' && next === '\n')) {
          row.push(cell); cell = ''; rows.push(row); row = [];
          if (ch === '\r') i++;
        } else { cell += ch; }
      }
    }
    if (cell || row.length > 0) { row.push(cell); rows.push(row); }
    return rows;
  }

  async function autoReadSheet() {
    const info = getSheetInfo();
    if (!info.spreadsheetId) throw new Error('No spreadsheet ID');
    const response = await chrome.runtime.sendMessage({
      type: 'FETCH_SHEET_CSV',
      spreadsheetId: info.spreadsheetId,
      gid: info.gid
    });
    if (!response.success) throw new Error(response.error);
    const rows = parseCSV(response.csv);
    if (rows.length < 2) throw new Error('Sheet too small');
    const headers = rows[0].map((h, i) => {
      let name = String(h || '').trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
      return name || 'col' + i;
    });
    const dataRows = rows.slice(1).filter(row => row.some(c => c && c.trim() !== ''));
    return { headers, rows: dataRows };
  }

  // Load saved API key
  function loadApiKey() {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['groqApiKey'], (result) => {
        if (result.groqApiKey) {
          groqApiKey = result.groqApiKey;
          const keyInput = document.getElementById('sqm-api-key');
          if (keyInput) keyInput.value = groqApiKey;
          updateAIStatus(true);
        }
      });
    }
  }

  function saveApiKey(key) {
    groqApiKey = key;
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ groqApiKey: key });
    }
  }

  function updateAIStatus(connected) {
    const dot = document.getElementById('sqm-ai-dot');
    if (dot) {
      dot.style.background = connected ? '#22c55e' : '#ef4444';
      dot.title = connected ? 'API key set' : 'No API key';
    }
  }

  function createPanel() {
    currentSheetName = getActiveSheetName();
    const safeName = sanitizeName(currentSheetName);
    const panel = document.createElement('div');
    panel.id = 'sqlmaster-sheets-panel';
    panel.innerHTML = `
      <div class="sqm-header" id="sqm-drag-handle">
        <div class="sqm-header-left">
          <span class="sqm-logo">SQL</span>
          <span class="sqm-title">Master</span>
        </div>
        <div class="sqm-header-actions">
          <button class="sqm-header-btn" id="sqm-refresh-btn" title="Refresh">🔄</button>
          <button class="sqm-header-btn" id="sqm-collapse-btn">−</button>
          <button class="sqm-header-btn" id="sqm-close-btn">✕</button>
        </div>
      </div>
      <div class="sqm-body">
        <div class="sqm-section">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span class="sqm-label">📋 Sheet Data</span>
            <span id="sqm-sheet-name" style="font-size:11px; color:#67e8f9;">${escapeHtml(currentSheetName)}</span>
          </div>
          <div id="sqm-data-status" class="sqm-status sqm-status-info">⏳ Loading...</div>
        </div>

        <!-- AI Prompt Section -->
        <div class="sqm-section sqm-ai-section">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 10px;">
            <span class="sqm-label" style="margin-bottom:0;">✨ AI Prompt</span>
            <span id="sqm-ai-dot" class="sqm-ai-dot" title="No API key" style="width:8px;height:8px;border-radius:50%;background:#ef4444;display:inline-block;"></span>
          </div>
          
          <!-- API Key Row (collapsible) -->
          <div id="sqm-api-row" class="sqm-api-row">
            <input type="password" class="sqm-input sqm-api-input" id="sqm-api-key" placeholder="Paste Groq API key (gsk_...)" autocomplete="off" spellcheck="false">
            <button class="sqm-btn-mini sqm-btn-save-key" id="sqm-save-key">💾</button>
            <button class="sqm-btn-mini sqm-btn-toggle-key" id="sqm-toggle-api" title="Show/Hide key">👁</button>
          </div>
          <button class="sqm-link-btn" id="sqm-toggle-api-row">🔑 <span id="sqm-api-toggle-text">Setup API Key</span></button>
          <a href="https://console.groq.com/keys" target="_blank" class="sqm-link-btn" style="margin-left:10px; color:#6366f1;">Get free key →</a>
          
          <!-- Prompt Input -->
          <textarea class="sqm-ai-prompt" id="sqm-ai-prompt" placeholder="Describe what you want in English...&#10;e.g. Show top 5 rows sorted by revenue"></textarea>
          <div class="sqm-btn-row" style="margin-top:8px;">
            <button class="sqm-btn sqm-btn-ai" id="sqm-ai-btn" disabled>✨ Generate & Run</button>
          </div>
          <div id="sqm-ai-status" style="display:none;"></div>
        </div>

        <div class="sqm-section">
          <span class="sqm-label">⚡ SQL Query</span>
          <div style="font-size:10px; color:#475569; margin-bottom:4px;">Table: <strong style="color:#6366f1;" id="sqm-tbl-name">${safeName}</strong></div>
          <textarea class="sqm-editor" id="sqm-editor">SELECT * FROM ${safeName} LIMIT 10</textarea>
          <div class="sqm-btn-row" style="margin-top:10px;">
            <button class="sqm-btn sqm-btn-primary" id="sqm-run-btn" disabled>▶ Run Query</button>
            <button class="sqm-btn sqm-btn-success" id="sqm-download-btn" disabled>💾 Download CSV</button>
          </div>
        </div>
        <div class="sqm-section" id="sqm-results-section" style="display:none;">
          <span class="sqm-label">📊 Results</span>
          <div id="sqm-status"></div>
          <div class="sqm-result-wrapper" id="sqm-result-wrapper"></div>
        </div>
      </div>
    `;
    document.body.appendChild(panel);
    setupEventListeners(panel);
    setupDragging(panel);
    loadSheetData(safeName);
    loadApiKey();
  }

  function setupEventListeners(panel) {
    document.getElementById('sqm-run-btn').addEventListener('click', runQuery);
    document.getElementById('sqm-download-btn').addEventListener('click', downloadResults);
    document.getElementById('sqm-refresh-btn').addEventListener('click', () => loadSheetData(sanitizeName(currentSheetName)));
    document.getElementById('sqm-collapse-btn').addEventListener('click', (e) => { e.stopPropagation(); panel.classList.toggle('collapsed'); });
    document.getElementById('sqm-close-btn').addEventListener('click', () => panel.remove());
    document.getElementById('sqm-editor').addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') runQuery();
    });

    // AI prompt events
    document.getElementById('sqm-ai-btn').addEventListener('click', generateAndRunAI);
    document.getElementById('sqm-ai-prompt').addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') generateAndRunAI();
    });
    document.getElementById('sqm-ai-prompt').addEventListener('input', () => {
      const btn = document.getElementById('sqm-ai-btn');
      btn.disabled = !document.getElementById('sqm-ai-prompt').value.trim() || !groqApiKey;
    });

    // API key management
    const apiRow = document.getElementById('sqm-api-row');
    apiRow.style.display = 'none'; // hidden by default if key exists

    document.getElementById('sqm-toggle-api-row').addEventListener('click', () => {
      const isHidden = apiRow.style.display === 'none';
      apiRow.style.display = isHidden ? 'flex' : 'none';
      document.getElementById('sqm-api-toggle-text').textContent = isHidden ? 'Hide API Key' : 'Setup API Key';
    });

    document.getElementById('sqm-save-key').addEventListener('click', () => {
      const key = document.getElementById('sqm-api-key').value.trim();
      if (key) {
        saveApiKey(key);
        updateAIStatus(true);
        apiRow.style.display = 'none';
        document.getElementById('sqm-api-toggle-text').textContent = 'Setup API Key';
        showAIStatus('✅ API key saved!', 'ok');
        // Enable the generate button if there's text
        const btn = document.getElementById('sqm-ai-btn');
        btn.disabled = !document.getElementById('sqm-ai-prompt').value.trim();
      }
    });

    document.getElementById('sqm-toggle-api').addEventListener('click', () => {
      const input = document.getElementById('sqm-api-key');
      input.type = input.type === 'password' ? 'text' : 'password';
    });
  }

  function setupDragging(panel) {
    const handle = document.getElementById('sqm-drag-handle');
    handle.addEventListener('mousedown', (e) => {
      if (e.target.closest('.sqm-header-btn')) return;
      isDragging = true;
      const rect = panel.getBoundingClientRect();
      dragOffset.x = e.clientX - rect.left;
      dragOffset.y = e.clientY - rect.top;
    });
    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      panel.style.left = (e.clientX - dragOffset.x) + 'px';
      panel.style.top = (e.clientY - dragOffset.y) + 'px';
      panel.style.right = 'auto'; panel.style.bottom = 'auto';
    });
    document.addEventListener('mouseup', () => isDragging = false);
  }

  async function loadSheetData(safeName) {
    const statusEl = document.getElementById('sqm-data-status');
    const runBtn = document.getElementById('sqm-run-btn');
    try {
      const data = await autoReadSheet();
      capturedHeaders = data.headers;
      capturedRows = data.rows;
      statusEl.textContent = `✅ ${capturedRows.length} rows loaded`;
      statusEl.className = 'sqm-status sqm-status-ok';
      runBtn.disabled = false;
    } catch (err) {
      statusEl.textContent = '❌ ' + err.message;
      statusEl.className = 'sqm-status sqm-status-err';
    }
  }

  // ===== AI: Generate SQL from prompt, then run it =====
  async function generateAndRunAI() {
    const prompt = document.getElementById('sqm-ai-prompt').value.trim();
    if (!prompt) return;
    if (!groqApiKey) {
      showAIStatus('🔑 Please set your Groq API key first', 'err');
      return;
    }
    if (capturedHeaders.length === 0) {
      showAIStatus('❌ Sheet data not loaded yet', 'err');
      return;
    }

    const safeName = sanitizeName(currentSheetName);
    const schemaDesc = `Table: ${safeName}\nColumns:\n` + capturedHeaders.map(h => `  ${h} (TEXT)`).join('\n');

    showAIStatus('✨ AI is thinking...', 'info');
    document.getElementById('sqm-ai-btn').disabled = true;

    const systemPrompt = `You are an expert SQL query generator. Convert natural language into valid SQLite SQL queries.

AVAILABLE SCHEMA:
${schemaDesc}

RULES:
1. Generate ONLY a valid SQLite SQL query.
2. Column and table names are CASE-SENSITIVE. Always wrap them in double quotes exactly as shown in the schema. For example: SELECT "Price", "Name" FROM "sheet";
3. Return ONLY the SQL query — no explanations, no markdown, no code blocks, no backticks.
4. SQL keywords must be in UPPERCASE (SELECT, FROM, WHERE, etc.).
5. End with a semicolon.
6. If the user says "show all" or similar, add LIMIT 50 to avoid huge output.
7. NEVER change the case of column or table names. Use them EXACTLY as provided in the schema.`;

    try {
      const aiResponse = await chrome.runtime.sendMessage({
        type: 'GROQ_AI_GENERATE',
        apiKey: groqApiKey,
        systemPrompt: systemPrompt,
        userPrompt: prompt
      });

      if (!aiResponse.success) {
        let msg = aiResponse.error || 'Unknown error';
        if (aiResponse.status === 401) {
          msg = 'Invalid API key. Check your Groq key.';
          updateAIStatus(false);
        }
        if (aiResponse.status === 429) msg = 'Rate limit hit. Wait a moment.';
        throw new Error(msg);
      }

      let sql = aiResponse.sql;

      if (!sql) throw new Error('AI returned empty response');

      // Put the generated SQL into the editor
      document.getElementById('sqm-editor').value = sql;
      showAIStatus(`✅ Generated: ${sql.substring(0, 60)}${sql.length > 60 ? '...' : ''}`, 'ok');

      // Now auto-run the query
      await runQuery();

    } catch (err) {
      showAIStatus('❌ ' + err.message, 'err');
    } finally {
      const btn = document.getElementById('sqm-ai-btn');
      btn.disabled = !document.getElementById('sqm-ai-prompt').value.trim() || !groqApiKey;
    }
  }

  function showAIStatus(msg, type) {
    const el = document.getElementById('sqm-ai-status');
    el.style.display = 'block';
    el.textContent = msg;
    el.className = 'sqm-status sqm-status-' + type;
  }

  async function runQuery() {
    const query = document.getElementById('sqm-editor').value.trim();
    if (!query) return;
    showStatus('⏳ Running...', 'info');
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'EXECUTE_SHEET_SQL',
        headers: capturedHeaders,
        rows: capturedRows,
        query: query,
        tableName: sanitizeName(currentSheetName)
      });
      if (!response.success) throw new Error(response.error);
      lastResults = response;
      if (response.count === 0) {
        showStatus('✅ 0 rows matched', 'ok');
        document.getElementById('sqm-result-wrapper').innerHTML = '';
        document.getElementById('sqm-download-btn').disabled = true;
      } else {
        showStatus(`✅ ${response.count} rows`, 'ok');
        renderResults(response.columns, response.values);
        document.getElementById('sqm-download-btn').disabled = false;
      }
    } catch (err) {
      showStatus('❌ ' + err.message, 'err');
    }
  }

  function renderResults(columns, values) {
    document.getElementById('sqm-results-section').style.display = 'block';
    const wrapper = document.getElementById('sqm-result-wrapper');
    let html = '<table class="sqm-result-table"><thead><tr>';
    columns.forEach(c => html += `<th>${escapeHtml(c)}</th>`);
    html += '</tr></thead><tbody>';
    values.slice(0, 50).forEach(row => {
      html += '<tr>';
      row.forEach(v => html += `<td>${escapeHtml(String(v ?? 'NULL'))}</td>`);
      html += '</tr>';
    });
    html += '</tbody></table>';
    wrapper.innerHTML = html;
  }

  function downloadResults() {
    if (!lastResults) return;
    let csv = lastResults.columns.join(',') + '\n';
    lastResults.values.forEach(row => {
      csv += row.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',') + '\n';
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SQL_Export_${Date.now()}.csv`;
    a.click();
    showStatus('💾 Downloaded!', 'ok');
  }

  function showStatus(msg, type) {
    document.getElementById('sqm-results-section').style.display = 'block';
    const el = document.getElementById('sqm-status');
    el.textContent = msg;
    el.className = 'sqm-status sqm-status-' + type;
  }
  function escapeHtml(t) { const d = document.createElement('div'); d.textContent = t; return d.innerHTML; }

  const check = () => {
    if (document.querySelector('.docs-sheet-tab') || document.querySelector('.waffle')) createPanel();
    else setTimeout(check, 1000);
  };
  setTimeout(check, 2000);
})();
