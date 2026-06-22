import { sqlEngine, escapeHtml, setupSyntaxHighlighting } from '../engine/sql-engine.js';

let apiKey = '';

export function renderAi() {
  return `
  <div class="page-header">
    <h1 class="page-title"> AI SQL Assistant</h1>
    <p class="page-subtitle">Describe what you want in English — get valid SQL instantly.</p>
  </div>

  <div class="card" style="margin-bottom:24px;">
    <div class="card-header">
      <span class="card-title"> API Configuration</span>
    </div>
    <div style="display:flex;gap:10px;align-items:center;">
      <input type="password" id="api-key-input" class="sql-editor" style="height:42px;min-height:42px;background:var(--bg-input);color:var(--text-primary);border:1.5px solid var(--border-color);border-radius:var(--radius-sm);font-size:0.85rem;padding:8px 14px;" placeholder="Paste your Groq API key here">
      <button class="btn btn-sm btn-primary" id="save-key-btn">Save</button>
    </div>
    <p style="font-size:0.72rem;color:var(--text-muted);margin-top:8px;">Get a free API key from <a href="https://console.groq.com" target="_blank" style="color:var(--accent-primary);">console.groq.com</a>. Stored locally only.</p>
  </div>

  <div class="card" style="margin-bottom:24px;">
    <div style="font-size:0.75rem;color:var(--text-muted);font-weight:800;margin-bottom:12px;"> SELECT A DATASET</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;" id="ai-dataset-tabs">
      ${['employees','customers','products','orders','sales'].map(d => `<button class="btn btn-sm btn-secondary ai-ds-tab" data-ds="${d}">${d}</button>`).join('')}
    </div>
  </div>

  <div class="card" style="margin-bottom:24px;">
    <div style="font-size:0.75rem;color:var(--text-muted);font-weight:800;margin-bottom:12px;"> DESCRIBE WHAT YOU WANT</div>
    <textarea id="ai-prompt" class="sql-editor" style="height:80px;min-height:80px;background:var(--bg-input);color:var(--text-primary);border:1.5px solid var(--border-color);border-radius:var(--radius-md);font-size:0.9rem;" placeholder="e.g. Show me the top 5 highest paid employees with their department"></textarea>
    <div style="display:flex;justify-content:flex-end;margin-top:12px;">
      <button class="btn btn-accent" id="ai-generate-btn"> Generate SQL</button>
    </div>
  </div>

  <div id="ai-output" style="margin-bottom:24px;"></div>

  <div class="card">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
      <div style="font-size:0.75rem;color:var(--text-muted);font-weight:800;"> SANDBOX — EDIT & RUN</div>
      <button class="btn btn-sm btn-accent" id="ai-run-btn"> Run</button>
    </div>
    <div class="editor-chrome">
      <textarea class="sql-editor" id="ai-editor" placeholder="Generated SQL will appear here..."></textarea>
    </div>
    <div id="ai-result" style="margin-top:16px;"></div>
  </div>`;
}

export function initAi() {
  // ── 1. Use sessionStorage (clears when tab/browser closes) ──────────────
  apiKey = sessionStorage.getItem('sqlmaster_groq_key') || '';
  const keyInput = document.getElementById('api-key-input');
  if (keyInput && apiKey) keyInput.value = '••••••••••••';

  // ── 2. Security warning banner — always visible ──────────────────────────
  const securityBanner = document.createElement('div');
  securityBanner.id = 'api-security-banner';
  securityBanner.style.cssText = `
    display:flex; align-items:flex-start; gap:12px;
    background:linear-gradient(135deg,#fff8e1,#fff3cd);
    border:1.5px solid #f59e0b;
    border-radius:12px; padding:14px 18px; margin-bottom:20px;
    font-size:0.82rem; color:#78350f; line-height:1.6;
  `;
  securityBanner.innerHTML = `
    <span style="font-size:1.4rem;flex-shrink:0;">⚠️</span>
    <div>
      <strong style="display:block;margin-bottom:4px;font-size:0.88rem;">Security Notice</strong>
      Your Groq API key is stored only for <strong>this browser session</strong> — it will be cleared automatically when you close this tab.
      Never share your API key with anyone. Do not use this on a public or shared computer.
    </div>
  `;

  // Insert banner before the first card
  const firstCard = document.querySelector('.card');
  if (firstCard) firstCard.parentNode.insertBefore(securityBanner, firstCard);

  // ── 3. "No API key" notice — shown when key is missing ───────────────────
  function updateKeyNotice() {
    let notice = document.getElementById('api-key-notice');
    if (!notice) {
      notice = document.createElement('div');
      notice.id = 'api-key-notice';
      notice.style.cssText = `
        display:flex; align-items:center; gap:12px;
        background:linear-gradient(135deg,#fef2f2,#fee2e2);
        border:1.5px solid #f87171;
        border-radius:12px; padding:14px 18px; margin-bottom:20px;
        font-size:0.85rem; color:#991b1b; font-weight:600;
      `;
      notice.innerHTML = `
        <span style="font-size:1.3rem;">🔑</span>
        <span>No API key detected. Please paste your <strong>Groq API key</strong> above and click <strong>Save</strong> to use the AI SQL Assistant.</span>
      `;
      const outputDiv = document.getElementById('ai-output');
      if (outputDiv) outputDiv.before(notice);
    }
    notice.style.display = apiKey ? 'none' : 'flex';
  }

  updateKeyNotice();

  // ── Save key handler ─────────────────────────────────────────────────────
  document.getElementById('save-key-btn')?.addEventListener('click', () => {
    const val = document.getElementById('api-key-input')?.value.trim();
    if (val && !val.startsWith('••')) {
      apiKey = val;
      // 1. sessionStorage only — NOT localStorage
      sessionStorage.setItem('sqlmaster_groq_key', val);
      // 2. Never log the key
      updateKeyNotice();
      alert('✅ API Key saved for this session! It will be cleared when you close this tab.');
    }
  });

  let selectedDs = 'employees';
  document.querySelectorAll('.ai-ds-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      selectedDs = tab.dataset.ds;
      document.querySelectorAll('.ai-ds-tab').forEach(t => t.className = 'btn btn-sm btn-secondary ai-ds-tab');
      tab.className = 'btn btn-sm btn-accent ai-ds-tab';
    });
  });

  document.getElementById('ai-generate-btn')?.addEventListener('click', async () => {
    const prompt = document.getElementById('ai-prompt')?.value.trim();
    if (!prompt) return alert('Please describe what you want.');

    // 3. Always alert user if no key set
    if (!apiKey) {
      alert('🔑 No API key found!\n\nPlease paste your Groq API key in the field above and click Save before generating SQL.\n\nGet a free key at: https://console.groq.com');
      document.getElementById('api-key-input')?.focus();
      return;
    }

    const outputDiv = document.getElementById('ai-output');
    outputDiv.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-muted);"> Generating...</div>';

    try {
      const schemaResult = sqlEngine.exec(`PRAGMA table_info(${selectedDs})`);
      const columns = schemaResult.success && schemaResult.results?.length > 0
        ? schemaResult.results[0].values.map(v => `${v[1]} (${v[2]})`).join(', ')
        : '';

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: `Generate a valid SQLite query. Table: ${selectedDs}. Columns: ${columns}. Return ONLY the SQL query, nothing else.` },
            { role: 'user', content: prompt }
          ],
          temperature: 0.1, max_tokens: 500
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const msg = errData.error?.message || `HTTP ${response.status}`;
        if (response.status === 401) {
          apiKey = '';
          sessionStorage.removeItem('sqlmaster_groq_key');
          updateKeyNotice();
          throw new Error('Invalid API key. Please re-enter your Groq key and save again.');
        }
        throw new Error(msg);
      }

      const data = await response.json();
      const sql = data.choices?.[0]?.message?.content?.trim()
        .replace(/```sql\n?/g, '').replace(/```/g, '').trim();

      if (sql) {
        outputDiv.innerHTML = `<div class="feedback feedback-success"><span class="feedback-icon"></span><span>SQL generated successfully!</span></div>`;
        document.getElementById('ai-editor').value = sql;
      } else {
        outputDiv.innerHTML = '<div class="feedback feedback-error"><span class="feedback-icon"></span><span>Failed to generate SQL.</span></div>';
      }
    } catch (e) {
      outputDiv.innerHTML = `<div class="feedback feedback-error"><span class="feedback-icon"></span><span>${escapeHtml(e.message)}</span></div>`;
    }
  });

  document.getElementById('ai-run-btn')?.addEventListener('click', () => {
    const query = document.getElementById('ai-editor')?.value.trim();
    const resDiv = document.getElementById('ai-result');
    if (!query || !resDiv) return;
    const result = sqlEngine.exec(query);
    resDiv.innerHTML = result.success
      ? sqlEngine.renderResults(result.results)
      : `<div class="feedback feedback-error"><span class="feedback-icon"></span><span>${escapeHtml(result.error)}</span></div>`;
  });

  setTimeout(setupSyntaxHighlighting, 100);
}
