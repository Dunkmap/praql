importScripts('sql_engine/sql-wasm.js');
console.log("[SQL Master] Background Service Worker Starting...");

let SQL = null;
let db = null;

// Initialize SQL.js
async function ensureSQL() {
  if (SQL) return;
  SQL = await initSqlJs({
    locateFile: file => chrome.runtime.getURL(`sql_engine/${file}`)
  });
}

// Listen for messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("[SQL Master] Received message:", message.type);
  if (message.type === 'EXECUTE_SHEET_SQL') {
    handleSheetSQL(message).then(sendResponse).catch(e => sendResponse({ success: false, error: e.message }));
    return true;
  }
  if (message.type === 'FETCH_SHEET_CSV') {
    fetchSheetCSV(message).then(sendResponse).catch(e => sendResponse({ success: false, error: e.message }));
    return true;
  }
  if (message.type === 'GROQ_AI_GENERATE') {
    handleGroqAI(message).then(sendResponse).catch(e => sendResponse({ success: false, error: e.message }));
    return true;
  }
});

// ===== GROQ AI PROXY =====
async function handleGroqAI({ apiKey, systemPrompt, userPrompt }) {
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
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1,
        max_tokens: 512,
        stream: false
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      let msg = errData.error?.message || `HTTP ${response.status}`;
      return { success: false, error: msg, status: response.status };
    }

    const data = await response.json();
    let sql = (data.choices?.[0]?.message?.content || '').trim();
    sql = sql.replace(/```sql\n?/gi, '').replace(/```\n?/g, '').trim();
    return { success: true, sql };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// ===== FETCH SHEET DATA =====
async function fetchSheetCSV({ spreadsheetId, gid }) {
  try {
    // Try gviz endpoint first
    const gvizUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&gid=${gid}`;
    let response = await fetch(gvizUrl, { credentials: 'include' });

    if (response.ok) {
      const text = await response.text();
      if (text && text.trim().length > 0 && !text.includes('<!DOCTYPE')) {
        return { success: true, csv: text };
      }
    }

    // Fallback: export endpoint
    const exportUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`;
    response = await fetch(exportUrl, { credentials: 'include' });

    if (response.ok) {
      const text = await response.text();
      if (text && text.trim().length > 0 && !text.includes('<!DOCTYPE')) {
        return { success: true, csv: text };
      }
    }

    return { success: false, error: `HTTP ${response.status} — check sheet access` };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// ===== EXECUTE SQL =====
async function handleSheetSQL(message) {
  try {
    await ensureSQL();
    if (!SQL) throw new Error('SQL engine not available');

    const { headers, rows, query, tableName } = message;

    // Fresh database each query
    if (db) { try { db.close(); } catch(e) {} }
    db = new SQL.Database();

    // CREATE TABLE with auto-detected types
    const colDefs = headers.map((h, i) => {
      const safe = '"' + h.replace(/"/g, '""') + '"';
      const sample = rows[0] ? rows[0][i] : '';
      const isNum = typeof sample === 'number' ||
        (String(sample).trim() !== '' && !isNaN(Number(sample)));
      return safe + (isNum ? ' REAL' : ' TEXT');
    });

    const safeTbl = '"' + tableName.replace(/"/g, '""') + '"';
    db.run('CREATE TABLE ' + safeTbl + ' (' + colDefs.join(', ') + ')');

    // INSERT
    const ph = headers.map(() => '?').join(',');
    const stmt = db.prepare('INSERT INTO ' + safeTbl + ' VALUES (' + ph + ')');

    for (const row of rows) {
      const vals = row.map(v => {
        if (v === null || v === undefined || v === '') return null;
        if (typeof v === 'number') return v;
        const n = Number(v);
        if (!isNaN(n) && String(v).trim() !== '') return n;
        return String(v);
      });
      stmt.run(vals);
    }
    stmt.free();

    // Run user query
    const results = db.exec(query);
    db.close();
    db = null;

    if (!results || results.length === 0) {
      return { success: true, columns: [], values: [], count: 0 };
    }
    return {
      success: true,
      columns: results[0].columns,
      values: results[0].values,
      count: results[0].values.length
    };
  } catch (e) {
    if (db) { try { db.close(); } catch(ex) {} db = null; }
    return { success: false, error: e.message };
  }
}
