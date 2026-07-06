import { sqlEngine, escapeHtml, setupSyntaxHighlighting } from '../engine/sql-engine.js';
import { generateQuestions, getTableSummary } from '../engine/question-generator.js';

let uploadedTables = [];
let csvRawData = {};
let generatedQuestions = [];
let currentQIdx = 0;
let activeTab = 'upload'; // 'upload' | 'builtin'
let activeMode = 'practice'; // 'practice' | 'freequery'

const BUILTIN_DATASETS = [
  { value: 'employees', label: 'Employees', icon: '👥', desc: '50 employees with departments, salaries, cities', cols: 11, rows: 50 },
  { value: 'customers', label: 'Customers', icon: '🛒', desc: 'Customer records with cities and spend amounts', cols: 5, rows: 30 },
  { value: 'products',  label: 'Products',  icon: '📦', desc: 'Product catalog with categories and pricing', cols: 6, rows: 30 },
  { value: 'orders',    label: 'Orders',     icon: '📋', desc: 'Order history with quantities and totals', cols: 7, rows: 40 },
  { value: 'sales',     label: 'Sales',      icon: '💰', desc: 'Sales data with regions and revenue', cols: 6, rows: 40 },
];

/* ══════════════════════════════════════
   RENDER
   ══════════════════════════════════════ */

export function renderPlayground() {
  return `
  <div class="page-header" style="display:flex;align-items:flex-end;justify-content:space-between;">
    <div>
      <h1 class="page-title">SQL Playground</h1>
      <p class="page-subtitle">Upload your CSV or pick a built-in dataset — get instant practice questions.</p>
    </div>
    <div style="display:flex;gap:10px;">
      <button class="btn btn-secondary btn-sm" id="schema-btn">📋 Schema</button>
      <button class="btn btn-secondary btn-sm" id="reset-all-btn">↺ Reset All</button>
    </div>
  </div>

  <!-- ═══ SECTION 1: Data Source ═══ -->
  <div class="card" style="margin-bottom:24px;" id="data-source-section">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px;">
      <span style="font-size:1.3rem;">📊</span>
      <div>
        <div style="font-weight:800;font-size:0.95rem;color:var(--text-primary);">Choose Your Data</div>
        <div style="font-size:0.75rem;color:var(--text-muted);font-weight:600;">Upload a CSV file or use one of our built-in datasets</div>
      </div>
    </div>

    <!-- Tab Bar -->
    <div class="pg-tab-bar" id="source-tabs">
      <button class="pg-tab-btn active" data-tab="upload">📁 Upload CSV</button>
      <button class="pg-tab-btn" data-tab="builtin">🗃️ Built-in Datasets</button>
    </div>

    <!-- Upload Tab -->
    <div id="tab-upload" class="pg-tab-content active">
      <div class="upload-zone" id="pg-upload-zone" style="padding:36px;margin-top:16px;">
        <div style="font-size:2.5rem;margin-bottom:10px;">📤</div>
        <div style="font-weight:800;font-size:1rem;color:var(--text-primary);margin-bottom:6px;">Drop your CSV files here</div>
        <div style="font-size:0.8rem;color:var(--text-muted);font-weight:600;">or click to browse · Max 5MB per file · Up to 10,000 rows</div>
        <input type="file" id="pg-file-input" accept=".csv" multiple style="display:none;">
      </div>
    </div>

    <!-- Built-in Datasets Tab -->
    <div id="tab-builtin" class="pg-tab-content" style="display:none;">
      <div class="pg-dataset-grid" style="margin-top:16px;">
        ${BUILTIN_DATASETS.map(ds => `
          <div class="pg-dataset-card" data-dataset="${ds.value}" id="ds-card-${ds.value}">
            <div class="pg-dataset-icon">${ds.icon}</div>
            <div class="pg-dataset-info">
              <div class="pg-dataset-name">${ds.label}</div>
              <div class="pg-dataset-desc">${ds.desc}</div>
              <div class="pg-dataset-meta">${ds.rows} rows · ${ds.cols} columns</div>
            </div>
            <div class="pg-dataset-check" id="ds-check-${ds.value}" style="display:none;">✅</div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Loaded Tables Chips -->
    <div id="pg-loaded-tables" style="display:none;margin-top:18px;">
      <div style="font-weight:800;font-size:.72rem;color:var(--accent-green-dark);letter-spacing:1px;margin-bottom:10px;">✅ LOADED TABLES</div>
      <div id="pg-table-chips" style="display:flex;gap:8px;flex-wrap:wrap;"></div>
    </div>
  </div>

  <!-- ═══ SECTION 2: Generate & Practice ═══ -->
  <div id="practice-section" style="display:none;">
    <!-- Mode Tabs -->
    <div style="display:flex;gap:10px;margin-bottom:20px;">
      <button class="btn btn-accent" id="mode-practice-btn" style="flex:1;">🎯 Practice Questions</button>
      <button class="btn btn-secondary" id="mode-freequery-btn" style="flex:1;">⚡ Free Query</button>
    </div>

    <!-- ─── Practice Mode ─── -->
    <div id="practice-mode">
      <!-- Config Bar -->
      <div class="card" style="margin-bottom:20px;padding:20px;">
        <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;">
          <div style="flex:1;min-width:200px;">
            <label class="pg-label">DIFFICULTY</label>
            <div style="display:flex;gap:6px;" id="diff-selector">
              <button class="btn btn-sm diff-select-btn active" data-diff="mix" style="flex:1;">🎲 Mix</button>
              <button class="btn btn-sm diff-select-btn" data-diff="easy" style="flex:1;">Easy</button>
              <button class="btn btn-sm diff-select-btn" data-diff="medium" style="flex:1;">Medium</button>
              <button class="btn btn-sm diff-select-btn" data-diff="hard" style="flex:1;">Hard</button>
            </div>
          </div>
          <div style="min-width:120px;">
            <label class="pg-label">QUESTIONS</label>
            <select id="q-count-select" class="pg-input" style="padding:7px 12px;">
              <option value="5">5 Questions</option>
              <option value="10" selected>10 Questions</option>
              <option value="15">15 Questions</option>
            </select>
          </div>
          <div style="align-self:flex-end;">
            <button class="btn btn-accent" id="generate-btn">🚀 Generate Questions</button>
          </div>
        </div>
      </div>

      <!-- Questions Zone (hidden until generated) -->
      <div id="questions-zone" style="display:none;">
        <!-- Progress Header -->
        <div style="padding:16px 20px;margin-bottom:20px;background:var(--accent-pink-light);border:1.5px solid var(--accent-primary);border-radius:var(--radius-md);">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div style="display:flex;align-items:center;gap:12px;">
              <span style="font-size:1.5rem;">🎯</span>
              <div>
                <div style="font-weight:800;font-size:0.9rem;color:var(--accent-primary);">PRACTICE MODE</div>
                <span id="q-progress" style="font-size:0.75rem;font-weight:700;color:var(--text-muted);"></span>
              </div>
            </div>
            <div style="display:flex;gap:8px;">
              <button class="btn btn-sm btn-secondary" id="regenerate-btn">🔄 New Set</button>
            </div>
          </div>
          <div style="width:100%;height:6px;background:rgba(255,255,255,0.5);border-radius:3px;margin-top:14px;overflow:hidden;">
            <div id="q-progress-bar" style="height:100%;background:var(--accent-green);border-radius:3px;transition:width .4s ease;width:0%;"></div>
          </div>
        </div>

        <!-- Question Card -->
        <div class="card" id="q-card" style="margin-bottom:20px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
            <span id="q-difficulty" class="diff-tag easy">EASY</span>
            <span id="q-number" style="font-size:0.75rem;font-weight:800;color:var(--text-muted);">Q1</span>
          </div>
          <div id="q-text" style="font-size:1rem;font-weight:700;color:var(--text-primary);line-height:1.7;margin-bottom:16px;"></div>
          <div id="q-hint-area"></div>
        </div>

        <!-- Editor -->
        <div class="editor-chrome">
          <div class="editor-chrome-bar">
            <span class="editor-chrome-label">>_ YOUR_ANSWER <span style="opacity:.5;font-size:.7rem;margin-left:8px;">CTRL+ENTER</span></span>
            <div style="display:flex;gap:8px;">
              <button class="btn btn-sm btn-secondary" id="hint-btn" style="background:rgba(178,173,213,.2);border-color:#b2add5;color:#b2add5;">💡 Hint</button>
              <button class="btn btn-sm btn-accent" id="submit-answer-btn">▶ Run</button>
            </div>
          </div>
          <textarea class="sql-editor" id="practice-editor" placeholder="-- Write your SQL answer here..."></textarea>
        </div>

        <!-- Your Output -->
        <div id="practice-result" style="margin-top:16px;min-height:80px;border:1.5px dashed var(--border-color);border-radius:var(--radius-md);padding:20px;color:var(--text-muted);text-align:center;">
          <div style="font-size:1.5rem;margin-bottom:6px;">⌨️</div>
          <div style="font-weight:700;font-size:.82rem;">Run your answer to check results</div>
        </div>

        <!-- Expected Answer -->
        <div id="answer-reveal" style="display:none;margin-top:16px;">
          <div class="card" style="border-color:var(--accent-green-border);">
            <div style="font-weight:800;font-size:.72rem;color:var(--accent-green-dark);letter-spacing:1px;margin-bottom:6px;">✅ EXPECTED SQL</div>
            <pre id="expected-sql" style="background:var(--bg-editor);color:#a0c4ff;padding:14px;border-radius:8px;font-size:.82rem;white-space:pre-wrap;border:1px solid #2d323a;"></pre>
            <div id="expected-output" style="margin-top:12px;"></div>
          </div>
        </div>

        <div style="display:flex;justify-content:space-between;margin-top:20px;">
          <button class="btn btn-secondary" id="prev-q-btn" disabled>← Previous</button>
          <button class="btn btn-secondary" id="show-answer-btn">👁 Show Answer</button>
          <button class="btn btn-primary" id="next-q-btn">Next →</button>
        </div>

        <!-- Completion -->
        <div id="completion-bar" style="display:none;margin-top:24px;">
          <div style="padding:24px;background:linear-gradient(135deg,#e8f5e9,#c8e6c9);border:2px solid #66bb6a;border-radius:var(--radius-md);text-align:center;">
            <div style="font-size:2.5rem;margin-bottom:8px;">🎉</div>
            <div style="font-weight:900;font-size:1.1rem;color:#2e7d32;margin-bottom:4px;">All Questions Completed!</div>
            <div style="font-size:0.82rem;color:#388e3c;font-weight:600;margin-bottom:20px;">Great job! Generate a new set to keep practicing.</div>
            <button class="btn btn-primary" id="new-set-btn">🔄 Generate New Questions</button>
          </div>
        </div>
      </div>
    </div>

    <!-- ─── Free Query Mode ─── -->
    <div id="freequery-mode" style="display:none;">
      <div class="card" style="margin-bottom:20px;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
          <span style="font-size:1.3rem;">⚡</span>
          <div>
            <div style="font-weight:800;font-size:0.9rem;color:var(--text-primary);">Free Query Sandbox</div>
            <div style="font-size:0.75rem;color:var(--text-muted);font-weight:600;">Write any SQL query against your loaded tables</div>
          </div>
        </div>
        <div class="editor-chrome">
          <div class="editor-chrome-bar">
            <span class="editor-chrome-label">>_ FREE_QUERY <span style="opacity:.5;font-size:.7rem;margin-left:8px;">CTRL+ENTER</span></span>
            <button class="btn btn-sm btn-accent" id="free-run-btn">▶ Run</button>
          </div>
          <textarea class="sql-editor" id="free-editor" placeholder="-- Write any SQL query here...
-- Example: SELECT * FROM employees LIMIT 10;"></textarea>
        </div>
        <div id="free-result" style="margin-top:16px;"></div>
      </div>
    </div>
  </div>

  <!-- Schema Modal -->
  <div id="schema-modal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:1000;align-items:center;justify-content:center;backdrop-filter:blur(4px);">
    <div class="card" style="max-width:700px;width:90%;max-height:85vh;overflow-y:auto;margin:5vh auto;">
      <div class="card-header">
        <span class="card-title">📋 Database Schema</span>
        <button class="btn btn-sm btn-secondary" id="close-schema-btn">✕ Close</button>
      </div>
      <div id="schema-content" style="margin-top:16px;"></div>
    </div>
  </div>`;
}


/* ══════════════════════════════════════
   INIT
   ══════════════════════════════════════ */

export function initPlayground() {
  injectStyles();

  // Header buttons
  document.getElementById('schema-btn')?.addEventListener('click', showSchema);
  document.getElementById('close-schema-btn')?.addEventListener('click', () => {
    document.getElementById('schema-modal').style.display = 'none';
  });
  document.getElementById('reset-all-btn')?.addEventListener('click', resetAll);

  // Tab switching
  document.querySelectorAll('.pg-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // File upload
  const zone = document.getElementById('pg-upload-zone');
  const fileInput = document.getElementById('pg-file-input');
  zone?.addEventListener('click', () => fileInput?.click());
  zone?.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('dragover'); });
  zone?.addEventListener('dragleave', () => zone.classList.remove('dragover'));
  zone?.addEventListener('drop', e => { e.preventDefault(); zone.classList.remove('dragover'); handleCSVFiles(e.dataTransfer.files); });
  fileInput?.addEventListener('change', e => handleCSVFiles(e.target.files));

  // Built-in dataset cards
  document.querySelectorAll('.pg-dataset-card').forEach(card => {
    card.addEventListener('click', () => loadBuiltinDataset(card.dataset.dataset));
  });

  // Mode tabs
  document.getElementById('mode-practice-btn')?.addEventListener('click', () => switchMode('practice'));
  document.getElementById('mode-freequery-btn')?.addEventListener('click', () => switchMode('freequery'));

  // Difficulty selector
  document.querySelectorAll('.diff-select-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.diff-select-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Generate button
  document.getElementById('generate-btn')?.addEventListener('click', handleGenerate);
  document.getElementById('regenerate-btn')?.addEventListener('click', handleGenerate);
  document.getElementById('new-set-btn')?.addEventListener('click', handleGenerate);

  // Practice controls
  document.getElementById('submit-answer-btn')?.addEventListener('click', runPractice);
  document.getElementById('show-answer-btn')?.addEventListener('click', showAnswer);
  document.getElementById('next-q-btn')?.addEventListener('click', () => navigateQ(1));
  document.getElementById('prev-q-btn')?.addEventListener('click', () => navigateQ(-1));
  document.getElementById('hint-btn')?.addEventListener('click', showHint);

  // Free query
  document.getElementById('free-run-btn')?.addEventListener('click', runFreeQuery);

  // Keyboard shortcuts
  document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.key === 'Enter') {
      if (activeMode === 'freequery') runFreeQuery();
      else runPractice();
    }
  });

  setTimeout(setupSyntaxHighlighting, 100);

  // Restore session if any
  restoreSession();
}


/* ══════════════════════════════════════
   STYLES
   ══════════════════════════════════════ */

function injectStyles() {
  const s = document.createElement('style');
  s.textContent = `
    .pg-label{font-size:.72rem;font-weight:800;color:var(--text-muted);display:block;margin-bottom:6px;letter-spacing:.5px;}
    .pg-input{width:100%;padding:10px 14px;border:1.5px solid var(--border-color);border-radius:var(--radius-sm);font-family:var(--font-mono);font-size:.85rem;background:var(--bg-input);color:var(--text-primary);outline:none;box-sizing:border-box;transition:border .2s;}
    .pg-input:focus{border-color:var(--accent-primary);}

    .pg-tab-bar{display:flex;gap:0;border-bottom:2px solid var(--border-color);}
    .pg-tab-btn{
      flex:1;padding:12px 20px;background:none;border:none;border-bottom:3px solid transparent;
      font-family:var(--font-mono);font-weight:800;font-size:0.82rem;color:var(--text-muted);
      cursor:pointer;transition:all .2s;text-transform:uppercase;letter-spacing:0.5px;
    }
    .pg-tab-btn:hover{color:var(--accent-primary);background:var(--accent-pink-light);}
    .pg-tab-btn.active{color:var(--accent-primary);border-bottom-color:var(--accent-primary);background:var(--accent-pink-light);}

    .pg-dataset-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px;}
    .pg-dataset-card{
      display:flex;align-items:center;gap:14px;padding:16px 20px;
      background:var(--bg-card);border:1.5px solid var(--border-color);border-radius:var(--radius-md);
      cursor:pointer;transition:all .2s;position:relative;
    }
    .pg-dataset-card:hover{border-color:var(--accent-primary);background:var(--bg-card-hover);transform:translateY(-2px);box-shadow:var(--shadow-md);}
    .pg-dataset-card.loaded{border-color:var(--accent-green-border);background:var(--accent-green-light);}
    .pg-dataset-icon{font-size:2rem;flex-shrink:0;}
    .pg-dataset-info{flex:1;min-width:0;}
    .pg-dataset-name{font-weight:800;font-size:0.9rem;color:var(--text-primary);}
    .pg-dataset-desc{font-size:0.75rem;color:var(--text-muted);font-weight:600;margin-top:2px;}
    .pg-dataset-meta{font-size:0.68rem;color:var(--text-muted);margin-top:4px;font-weight:700;opacity:0.7;}
    .pg-dataset-check{font-size:1.2rem;flex-shrink:0;}

    @media(max-width:600px){
      .pg-dataset-grid{grid-template-columns:1fr;}
    }
  `;
  document.head.appendChild(s);
}


/* ══════════════════════════════════════
   TAB & MODE SWITCHING
   ══════════════════════════════════════ */

function switchTab(tab) {
  activeTab = tab;
  document.querySelectorAll('.pg-tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  document.getElementById('tab-upload').style.display = tab === 'upload' ? 'block' : 'none';
  document.getElementById('tab-builtin').style.display = tab === 'builtin' ? 'block' : 'none';
}

function switchMode(mode) {
  activeMode = mode;
  const practiceBtn = document.getElementById('mode-practice-btn');
  const freeBtn = document.getElementById('mode-freequery-btn');
  const practiceMode = document.getElementById('practice-mode');
  const freeMode = document.getElementById('freequery-mode');

  if (mode === 'practice') {
    practiceBtn.className = 'btn btn-accent'; practiceBtn.style.flex = '1';
    freeBtn.className = 'btn btn-secondary'; freeBtn.style.flex = '1';
    practiceMode.style.display = 'block';
    freeMode.style.display = 'none';
  } else {
    freeBtn.className = 'btn btn-accent'; freeBtn.style.flex = '1';
    practiceBtn.className = 'btn btn-secondary'; practiceBtn.style.flex = '1';
    practiceMode.style.display = 'none';
    freeMode.style.display = 'block';
  }
  setTimeout(setupSyntaxHighlighting, 100);
}


/* ══════════════════════════════════════
   CSV UPLOAD HANDLER
   ══════════════════════════════════════ */

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuotes = !inQuotes; continue; }
    if (ch === ',' && !inQuotes) { result.push(current.trim()); current = ''; continue; }
    current += ch;
  }
  result.push(current.trim());
  return result;
}

function cleanColumnName(name) {
  return name.replace(/[\r\n]/g, '').replace(/^\uFEFF/, '').replace(/"/g, '').trim().replace(/\s+/g, '_').toLowerCase();
}

async function handleCSVFiles(files) {
  for (const file of files) {
    if (!file.name.endsWith('.csv')) continue;

    // File size check (5MB)
    if (file.size > 5 * 1024 * 1024) {
      showUploadError(`File "${file.name}" exceeds the 5MB limit.`);
      continue;
    }

    let text = await file.text();
    text = text.replace(/^\uFEFF/, '');
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) { showUploadError(`File "${file.name}" must have at least 2 rows (header + data).`); continue; }

    // Row count check
    if (lines.length > 10001) {
      showUploadError(`File "${file.name}" exceeds the 10,000 row limit (${lines.length - 1} rows found).`);
      continue;
    }

    const rawHeaders = parseCSVLine(lines[0]);
    const headers = rawHeaders.map(cleanColumnName).filter(h => h);
    if (!headers.length) continue;

    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const vals = parseCSVLine(lines[i]);
      if (vals.length === 0 || (vals.length === 1 && !vals[0])) continue;
      const row = {};
      headers.forEach((h, idx) => row[h] = vals[idx] !== undefined ? vals[idx] : '');
      rows.push(row);
    }

    const tableName = file.name.replace(/\.csv$/i, '').replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();

    try {
      sqlEngine.exec(`DROP TABLE IF EXISTS ${tableName}`);
      const colDefs = headers.map(c => `"${c}" TEXT`).join(', ');
      sqlEngine.exec(`CREATE TABLE ${tableName} (${colDefs})`);
      for (const row of rows) {
        const vals = headers.map(c => `'${String(row[c] || '').replace(/'/g, "''")}'`).join(', ');
        sqlEngine.exec(`INSERT INTO ${tableName} VALUES (${vals})`);
      }
      // Remove existing table with same name if re-uploading
      uploadedTables = uploadedTables.filter(t => t.name !== tableName);
      uploadedTables.push({ name: tableName, columns: headers, rowCount: rows.length, source: 'csv' });
      csvRawData[tableName] = text;
      renderUploadedChips();
      showPracticeSection();
    } catch (e) {
      showUploadError(`Error importing "${file.name}": ${e.message}`);
    }
  }
}

function showUploadError(msg) {
  const zone = document.getElementById('pg-upload-zone');
  if (!zone) return;
  const existing = zone.parentElement.querySelector('.upload-error');
  if (existing) existing.remove();
  const el = document.createElement('div');
  el.className = 'upload-error feedback feedback-error';
  el.style.marginTop = '12px';
  el.innerHTML = `<span class="feedback-icon">❌</span><span>${escapeHtml(msg)}</span>`;
  zone.parentElement.appendChild(el);
  setTimeout(() => el.remove(), 6000);
}


/* ══════════════════════════════════════
   BUILT-IN DATASET LOADER
   ══════════════════════════════════════ */

async function loadBuiltinDataset(name) {
  const card = document.getElementById(`ds-card-${name}`);
  const check = document.getElementById(`ds-check-${name}`);

  // Check if already loaded
  if (uploadedTables.some(t => t.name === name)) {
    // Unload it
    sqlEngine.exec(`DROP TABLE IF EXISTS ${name}`);
    uploadedTables = uploadedTables.filter(t => t.name !== name);
    delete csvRawData[name];
    card?.classList.remove('loaded');
    if (check) check.style.display = 'none';
    renderUploadedChips();
    if (uploadedTables.length === 0) hidePracticeSection();
    return;
  }

  // Show loading state
  card?.classList.add('loaded');

  try {
    // The built-in datasets are loaded via sqlEngine.loadDataset which loads .sql files
    await sqlEngine.loadDataset(name);
    
    // Get schema info
    const info = sqlEngine.exec(`PRAGMA table_info(${name})`);
    const count = sqlEngine.exec(`SELECT COUNT(*) FROM ${name}`);
    const cols = info.success && info.results?.length ? info.results[0].values.map(r => r[1]) : [];
    const rowCount = count.success && count.results?.length ? count.results[0].values[0][0] : 0;

    uploadedTables.push({ name, columns: cols, rowCount, source: 'builtin' });
    if (check) check.style.display = 'block';
    renderUploadedChips();
    showPracticeSection();
  } catch (e) {
    card?.classList.remove('loaded');
    console.error('Failed to load built-in dataset:', e);
  }
}


/* ══════════════════════════════════════
   TABLE CHIPS
   ══════════════════════════════════════ */

function renderUploadedChips() {
  const container = document.getElementById('pg-table-chips');
  const wrapper = document.getElementById('pg-loaded-tables');
  if (!container || !wrapper) return;
  wrapper.style.display = uploadedTables.length > 0 ? 'block' : 'none';
  container.innerHTML = uploadedTables.map((t, i) => `
    <span style="display:inline-flex;align-items:center;gap:8px;padding:8px 14px;background:var(--accent-green-light);border:1.5px solid var(--accent-green-border);border-radius:var(--radius-sm);font-size:0.8rem;font-weight:800;color:var(--accent-green-dark);">
      🗄️ ${escapeHtml(t.name)} <span style="opacity:0.6">(${t.rowCount} rows, ${t.columns.length} cols)</span>
      <span style="color:var(--accent-red);cursor:pointer;font-size:1rem;" data-idx="${i}" class="remove-pg-table">×</span>
    </span>
  `).join('');
  container.querySelectorAll('.remove-pg-table').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.idx);
      const table = uploadedTables[idx];
      sqlEngine.exec(`DROP TABLE IF EXISTS ${table.name}`);
      // Update built-in card state
      const card = document.getElementById(`ds-card-${table.name}`);
      const check = document.getElementById(`ds-check-${table.name}`);
      if (card) card.classList.remove('loaded');
      if (check) check.style.display = 'none';
      delete csvRawData[table.name];
      uploadedTables.splice(idx, 1);
      renderUploadedChips();
      if (uploadedTables.length === 0) hidePracticeSection();
    });
  });
}


/* ══════════════════════════════════════
   PRACTICE SECTION VISIBILITY
   ══════════════════════════════════════ */

function showPracticeSection() {
  const section = document.getElementById('practice-section');
  if (section) {
    section.style.display = 'block';
    section.style.animation = 'fadeIn 0.3s ease';
  }
}

function hidePracticeSection() {
  const section = document.getElementById('practice-section');
  if (section) section.style.display = 'none';
  const qZone = document.getElementById('questions-zone');
  if (qZone) qZone.style.display = 'none';
  generatedQuestions = [];
  currentQIdx = 0;
}


/* ══════════════════════════════════════
   QUESTION GENERATION
   ══════════════════════════════════════ */

function handleGenerate() {
  if (uploadedTables.length === 0) {
    alert('Please load at least one dataset first.');
    return;
  }

  const diff = document.querySelector('.diff-select-btn.active')?.dataset.diff || 'mix';
  const count = parseInt(document.getElementById('q-count-select')?.value || '10');

  const tableNames = uploadedTables.map(t => t.name);
  const result = generateQuestions(tableNames, { count, difficulty: diff });

  if (result.questions.length === 0) {
    alert('Could not generate questions. Try adding more data or a different difficulty.');
    return;
  }

  generatedQuestions = result.questions;
  currentQIdx = 0;

  // Sort: easy → medium → hard
  const diffOrder = { easy: 0, medium: 1, hard: 2 };
  generatedQuestions.sort((a, b) => (diffOrder[a.difficulty] || 0) - (diffOrder[b.difficulty] || 0));

  // Show questions zone
  const qZone = document.getElementById('questions-zone');
  if (qZone) {
    qZone.style.display = 'block';
    qZone.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  renderQuestion();
  saveSession();
  setTimeout(setupSyntaxHighlighting, 100);
}


/* ══════════════════════════════════════
   PRACTICE MODE
   ══════════════════════════════════════ */

function renderQuestion() {
  const q = generatedQuestions[currentQIdx];
  if (!q) return;

  document.getElementById('q-number').textContent = `Q${currentQIdx + 1} / ${generatedQuestions.length}`;
  document.getElementById('q-text').textContent = q.question;
  document.getElementById('q-progress').textContent = `${currentQIdx + 1} of ${generatedQuestions.length}`;
  document.getElementById('q-progress-bar').style.width = `${((currentQIdx + 1) / generatedQuestions.length) * 100}%`;

  const tag = document.getElementById('q-difficulty');
  tag.textContent = q.difficulty.toUpperCase();
  tag.className = 'diff-tag ' + q.difficulty;

  document.getElementById('practice-editor').value = '';
  document.getElementById('practice-result').innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-muted);"><div style="font-size:2rem;margin-bottom:8px;">⌨️</div><div style="font-weight:700;font-size:.85rem;">Run your answer to check results</div></div>';
  document.getElementById('answer-reveal').style.display = 'none';
  document.getElementById('q-hint-area').innerHTML = '';
  document.getElementById('prev-q-btn').disabled = currentQIdx === 0;
  document.getElementById('next-q-btn').disabled = false;
  document.getElementById('next-q-btn').textContent = currentQIdx === generatedQuestions.length - 1 ? '🏁 Finish' : 'Next →';
  document.getElementById('completion-bar').style.display = 'none';
}

function resultToString(result) {
  if (!result.success || !result.results || !result.results.length) return '';
  const r = result.results[0];
  if (!r.values || !r.values.length) return '';
  return r.values.map(row => row.join('|')).sort().join('\n');
}

function runPractice() {
  const editor = document.getElementById('practice-editor');
  const res = document.getElementById('practice-result');
  if (!editor || !res) return;
  const query = editor.value.trim();
  if (!query) { res.innerHTML = '<div class="feedback feedback-info"><span class="feedback-icon">ℹ</span><span>Write your SQL answer first.</span></div>'; return; }

  const start = performance.now();
  const userResult = sqlEngine.exec(query);
  const elapsed = (performance.now() - start).toFixed(1);

  if (!userResult.success) {
    res.innerHTML = `<div class="feedback feedback-error"><span class="feedback-icon">❌</span><span>${escapeHtml(userResult.error)}</span></div>`;
    return;
  }

  // Compare with expected
  const q = generatedQuestions[currentQIdx];
  const expectedResult = q?.answer ? sqlEngine.exec(q.answer) : null;
  const userStr = resultToString(userResult);
  const expectedStr = expectedResult ? resultToString(expectedResult) : null;
  const isMatch = expectedStr !== null && userStr === expectedStr;

  let matchBadge = '';
  if (expectedStr !== null) {
    matchBadge = isMatch
      ? '<div style="padding:10px 16px;background:var(--accent-green-light);border:1.5px solid var(--accent-green-border);border-radius:var(--radius-sm);margin-bottom:12px;"><span style="font-weight:800;color:var(--accent-green-dark);font-size:.85rem;">✅ Correct! Your output matches the expected result.</span></div>'
      : '<div style="padding:10px 16px;background:#fff0f0;border:1.5px solid #ffb3b3;border-radius:var(--radius-sm);margin-bottom:12px;"><span style="font-weight:800;color:#c0392b;font-size:.85rem;">❌ Output mismatch. Try again or check the expected answer.</span></div>';
  }

  res.innerHTML = matchBadge + `<div style="font-size:.75rem;color:var(--text-muted);margin-bottom:8px;font-weight:700;">⚡ ${elapsed}ms</div>` + sqlEngine.renderResults(userResult.results);
}

function showAnswer() {
  const q = generatedQuestions[currentQIdx];
  if (!q) return;
  document.getElementById('expected-sql').textContent = q.answer;
  const expectedResult = q.answer ? sqlEngine.exec(q.answer) : null;
  const outputDiv = document.getElementById('expected-output');
  if (expectedResult?.success && outputDiv) {
    outputDiv.innerHTML = '<div style="font-weight:800;font-size:.72rem;color:var(--text-muted);letter-spacing:1px;margin-bottom:6px;">📊 EXPECTED OUTPUT</div>' + sqlEngine.renderResults(expectedResult.results);
  } else if (outputDiv) {
    outputDiv.innerHTML = '';
  }
  document.getElementById('answer-reveal').style.display = 'block';
}

function showHint() {
  const q = generatedQuestions[currentQIdx];
  if (!q) return;
  document.getElementById('q-hint-area').innerHTML = `<div class="hint-box visible" style="display:block;">💡 ${escapeHtml(q.hint)}</div>`;
}

function navigateQ(dir) {
  const next = currentQIdx + dir;
  if (next < 0) return;
  if (next >= generatedQuestions.length) {
    document.getElementById('completion-bar').style.display = 'block';
    document.getElementById('completion-bar').scrollIntoView({ behavior: 'smooth', block: 'center' });
    document.getElementById('next-q-btn').disabled = true;
    return;
  }
  currentQIdx = next;
  saveSession();
  renderQuestion();
}


/* ══════════════════════════════════════
   FREE QUERY MODE
   ══════════════════════════════════════ */

function runFreeQuery() {
  const editor = document.getElementById('free-editor');
  const res = document.getElementById('free-result');
  if (!editor || !res) return;
  const query = editor.value.trim();
  if (!query) { res.innerHTML = '<div class="feedback feedback-info"><span class="feedback-icon">ℹ</span><span>Write a query and click Run.</span></div>'; return; }

  const start = performance.now();
  const result = sqlEngine.exec(query);
  const elapsed = (performance.now() - start).toFixed(1);

  if (!result.success) {
    res.innerHTML = `<div class="feedback feedback-error"><span class="feedback-icon">❌</span><span>${escapeHtml(result.error)}</span></div>`;
    return;
  }

  res.innerHTML = `<div style="font-size:.75rem;color:var(--text-muted);margin-bottom:8px;font-weight:700;">⚡ ${elapsed}ms</div>` + sqlEngine.renderResults(result.results);
}


/* ══════════════════════════════════════
   SCHEMA MODAL
   ══════════════════════════════════════ */

function showSchema() {
  const modal = document.getElementById('schema-modal');
  const content = document.getElementById('schema-content');
  if (!modal || !content) return;
  modal.style.display = 'flex';

  if (uploadedTables.length === 0) {
    content.innerHTML = '<div style="text-align:center;padding:32px;color:var(--text-muted);font-weight:700;">No tables loaded yet. Upload a CSV or select a built-in dataset.</div>';
    return;
  }

  let html = '';
  for (const table of uploadedTables) {
    const result = sqlEngine.exec(`PRAGMA table_info(${table.name})`);
    if (result.success && result.results?.length > 0) {
      html += `<div style="margin-bottom:20px;">
        <div style="font-weight:800;color:var(--accent-primary);margin-bottom:10px;font-size:.9rem;">🗄️ ${table.name.toUpperCase()} <span style="opacity:.5;font-weight:600;">(${table.rowCount} rows)</span></div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;">
          ${result.results[0].values.map(v => `<span class="clause-chip locked">${v[1]} <span style="opacity:.5">(${v[2]})</span></span>`).join('')}
        </div>
      </div>`;
    }
  }
  content.innerHTML = html;
}


/* ══════════════════════════════════════
   SESSION PERSISTENCE
   ══════════════════════════════════════ */

const STORAGE_KEY = 'pg_v2_session';

function saveSession() {
  try {
    const data = {
      questions: generatedQuestions,
      currentIdx: currentQIdx,
      csvData: csvRawData,
      tables: uploadedTables,
      mode: activeMode,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) { console.warn('Could not save session:', e); }
}

function restoreSession() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    const data = JSON.parse(saved);
    if (!data.tables || !data.tables.length) return;

    // Reload CSV tables
    if (data.csvData) {
      for (const [tableName, csvText] of Object.entries(data.csvData)) {
        let text = csvText.replace(/^\uFEFF/, '');
        const lines = text.split(/\r?\n/).filter(l => l.trim());
        if (lines.length < 2) continue;
        const headers = parseCSVLine(lines[0]).map(cleanColumnName).filter(h => h);
        if (!headers.length) continue;
        sqlEngine.exec(`DROP TABLE IF EXISTS ${tableName}`);
        sqlEngine.exec(`CREATE TABLE ${tableName} (${headers.map(c => `"${c}" TEXT`).join(', ')})`);
        for (let i = 1; i < lines.length; i++) {
          const vals = parseCSVLine(lines[i]);
          if (vals.length === 0 || (vals.length === 1 && !vals[0])) continue;
          const row = headers.map((h, idx) => `'${String(vals[idx] || '').replace(/'/g, "''")}'`).join(', ');
          sqlEngine.exec(`INSERT INTO ${tableName} VALUES (${row})`);
        }
      }
      csvRawData = data.csvData;
    }

    // Reload built-in tables
    for (const table of data.tables) {
      if (table.source === 'builtin') {
        // Don't await here, just mark as loaded. The datasets should already be loaded by main.js
        const card = document.getElementById(`ds-card-${table.name}`);
        const check = document.getElementById(`ds-check-${table.name}`);
        if (card) card.classList.add('loaded');
        if (check) check.style.display = 'block';
      }
    }

    uploadedTables = data.tables;
    generatedQuestions = data.questions || [];
    currentQIdx = data.currentIdx || 0;

    renderUploadedChips();
    showPracticeSection();

    if (data.mode) switchMode(data.mode);

    if (generatedQuestions.length > 0) {
      const qZone = document.getElementById('questions-zone');
      if (qZone) qZone.style.display = 'block';
      renderQuestion();
    }
  } catch (e) {
    console.warn('Could not restore session:', e);
    localStorage.removeItem(STORAGE_KEY);
  }
}

function resetAll() {
  // Drop all loaded tables
  for (const table of uploadedTables) {
    sqlEngine.exec(`DROP TABLE IF EXISTS ${table.name}`);
  }
  uploadedTables = [];
  csvRawData = {};
  generatedQuestions = [];
  currentQIdx = 0;
  localStorage.removeItem(STORAGE_KEY);

  // Reset UI
  renderUploadedChips();
  hidePracticeSection();

  // Reset built-in cards
  document.querySelectorAll('.pg-dataset-card').forEach(c => c.classList.remove('loaded'));
  document.querySelectorAll('[id^="ds-check-"]').forEach(c => c.style.display = 'none');

  // Reload all datasets for the engine
  sqlEngine.resetAndReload();
}
