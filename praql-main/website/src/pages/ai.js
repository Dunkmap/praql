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
  apiKey = localStorage.getItem('sqlmaster_groq_key') || '';
  const keyInput = document.getElementById('api-key-input');
  if (keyInput && apiKey) keyInput.value = '••••••••••••';

  document.getElementById('save-key-btn')?.addEventListener('click', () => {
    const val = document.getElementById('api-key-input')?.value.trim();
    if (val && !val.startsWith('••')) { apiKey = val; localStorage.setItem('sqlmaster_groq_key', val); alert('Key saved!'); }
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
    if (!apiKey) return alert('Please set your Groq API key first.');

    const outputDiv = document.getElementById('ai-output');
    outputDiv.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-muted);"> Generating...</div>';

    try {
      const schemaResult = sqlEngine.exec(`PRAGMA table_info(${selectedDs})`);
      const columns = schemaResult.success && schemaResult.results?.length > 0 ? schemaResult.results[0].values.map(v => `${v[1]} (${v[2]})`).join(', ') : '';

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

      const data = await response.json();
      const sql = data.choices?.[0]?.message?.content?.trim().replace(/```sql\n?/g, '').replace(/```/g, '').trim();

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
    resDiv.innerHTML = result.success ? sqlEngine.renderResults(result.results) : `<div class="feedback feedback-error"><span class="feedback-icon"></span><span>${escapeHtml(result.error)}</span></div>`;
  });

  setTimeout(setupSyntaxHighlighting, 100);
}
