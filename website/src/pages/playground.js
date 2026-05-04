import { sqlEngine, escapeHtml, setupSyntaxHighlighting } from '../engine/sql-engine.js';

let parsedQuestions = [];
let currentQIdx = 0;
let csvRawData = {};  // tableName -> csvText for persistence

const DATASETS = [
  { value:'employees', label:'👥 Employees' },
  { value:'customers', label:'🧑‍💼 Customers' },
  { value:'products',  label:'📦 Products' },
  { value:'orders',    label:'🛒 Orders' },
  { value:'sales',     label:'💰 Sales' }
];

export function renderPlayground() {
  return `
  <div class="page-header" style="display:flex;align-items:flex-end;justify-content:space-between;">
    <div>
      <h1 class="page-title">SQL Playground</h1>
      <p class="page-subtitle">Generate AI prompts, import Q&A, and practice — all in one place.</p>
    </div>
    <div style="display:flex;gap:10px;">
      <button class="btn btn-secondary btn-sm" id="schema-btn">📋 Schema</button>
      <button class="btn btn-secondary btn-sm" id="reset-db-btn">↺ Reset DB</button>
    </div>
  </div>

  <!-- ═══ SECTION 1: Prompt Generator ═══ -->
  <div class="card" style="margin-bottom:24px;" id="prompt-section">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;cursor:pointer;" id="prompt-header-toggle">
      <div style="display:flex;align-items:center;gap:10px;">
        <span style="font-size:1.3rem;">🤖</span>
        <div>
          <div style="font-weight:800;font-size:0.85rem;color:var(--accent-primary);letter-spacing:0.5px;">STEP 1 — GENERATE AI PROMPT</div>
          <div style="font-size:0.75rem;color:var(--text-muted);font-weight:600;margin-top:2px;">Configure topic, questions & database, then copy the prompt into any AI chat.</div>
        </div>
      </div>
      <span id="prompt-chevron" style="font-size:0.9rem;color:var(--text-muted);transition:transform .3s;">▼</span>
    </div>
    <div id="prompt-body">
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:14px;">
        <div>
          <label class="pg-label">NUMBER OF QUESTIONS</label>
          <input type="number" id="prompt-count" min="1" max="30" value="5" class="pg-input">
        </div>
        <div>
          <label class="pg-label">TOPIC</label>
          <input type="text" id="prompt-topic" class="pg-input" placeholder="e.g. JOINs, GROUP BY, Window functions…">
        </div>
        <div>
          <label class="pg-label">DATASET</label>
          <select id="prompt-dataset" class="pg-input">${DATASETS.map(d=>`<option value="${d.value}">${d.label}</option>`).join('')}</select>
        </div>
      </div>
      <!-- Second dataset for JOINs -->
      <div id="join-dataset-row" style="display:none;margin-bottom:18px;animation:fadeIn .3s ease;">
        <div style="display:flex;align-items:center;gap:12px;padding:14px 18px;background:var(--accent-pink-light);border:1.5px solid var(--accent-primary);border-radius:var(--radius-md);">
          <span style="font-size:1.1rem;">🔗</span>
          <div style="flex:1;">
            <div style="font-weight:800;font-size:.75rem;color:var(--accent-primary);margin-bottom:6px;">JOIN DETECTED — Select a second dataset to join with</div>
            <select id="prompt-dataset-2" class="pg-input" style="background:var(--bg-card);">${DATASETS.map((d,i)=>`<option value="${d.value}"${i===1?' selected':''}>${d.label}</option>`).join('')}</select>
          </div>
        </div>
      </div>
      <button class="btn btn-accent" id="generate-prompt-btn" style="width:100%;margin-bottom:0;">🤖 Generate Prompt</button>

      <div id="prompt-output-wrap" style="display:none;margin-top:18px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
          <span style="font-weight:800;font-size:0.72rem;color:var(--accent-green-dark);letter-spacing:1px;">📋 COPY THIS INTO ANY AI CHAT (ChatGPT, Claude, Gemini…)</span>
          <button class="btn btn-sm btn-primary" id="copy-prompt-btn">📋 Copy</button>
        </div>
        <pre id="prompt-output" style="background:var(--bg-editor);color:#a0c4ff;padding:18px;border-radius:12px;font-size:0.78rem;line-height:1.7;white-space:pre-wrap;word-wrap:break-word;max-height:320px;overflow-y:auto;border:1.5px solid #2d323a;"></pre>
      </div>
    </div>
  </div>

  <!-- ═══ SECTION 2: Upload Dataset ═══ -->
  <div class="card" style="margin-bottom:24px;" id="upload-section">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;cursor:pointer;" id="upload-header-toggle">
      <div style="display:flex;align-items:center;gap:10px;">
        <span style="font-size:1.3rem;">📂</span>
        <div>
          <div style="font-weight:800;font-size:0.85rem;color:var(--accent-primary);letter-spacing:0.5px;">STEP 2 — UPLOAD DATASET</div>
          <div style="font-size:0.75rem;color:var(--text-muted);font-weight:600;margin-top:2px;">Run the AI's Python code to get the CSV, then upload it here to load into SQL engine.</div>
        </div>
      </div>
      <span id="upload-chevron" style="font-size:0.9rem;color:var(--text-muted);transition:transform .3s;">▼</span>
    </div>
    <div id="upload-body">
      <div class="upload-zone" id="pg-upload-zone" style="padding:32px;margin-bottom:0;">
        <div style="font-size:2rem;margin-bottom:8px;">☁️</div>
        <div style="font-weight:800;font-size:0.95rem;color:var(--text-primary);margin-bottom:4px;">Click or drag your CSV file here</div>
        <div style="font-size:0.78rem;color:var(--text-muted);font-weight:600;">Upload the .CSV file generated by the AI's Python script</div>
        <input type="file" id="pg-file-input" accept=".csv" multiple style="display:none;">
      </div>
      <div id="pg-loaded-tables" style="display:none;margin-top:14px;">
        <div style="font-weight:800;font-size:.72rem;color:var(--accent-green-dark);letter-spacing:1px;margin-bottom:8px;">✅ LOADED TABLES</div>
        <div id="pg-table-chips" style="display:flex;gap:8px;flex-wrap:wrap;"></div>
      </div>
    </div>
  </div>

  <!-- ═══ SECTION 3: Paste Q&A ═══ -->
  <div class="card" style="margin-bottom:24px;" id="qa-section">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;cursor:pointer;" id="qa-header-toggle">
      <div style="display:flex;align-items:center;gap:10px;">
        <span style="font-size:1.3rem;">📝</span>
        <div>
          <div style="font-weight:800;font-size:0.85rem;color:var(--accent-primary);letter-spacing:0.5px;">STEP 3 — PASTE QUESTIONS</div>
          <div style="font-size:0.75rem;color:var(--text-muted);font-weight:600;margin-top:2px;">Paste the Q&A part from the AI response. Questions will load based on your uploaded dataset.</div>
        </div>
      </div>
      <span id="qa-chevron" style="font-size:0.9rem;color:var(--text-muted);transition:transform .3s;">▼</span>
    </div>
    <div id="qa-body">
      <textarea id="qa-input" class="pg-textarea" placeholder="Paste the Q&A section from the AI response here (all ---QUESTION--- / ---END--- blocks)..."></textarea>
      <div style="display:flex;gap:10px;margin-top:14px;">
        <button class="btn btn-accent" id="parse-qa-btn" style="flex:1;">🎯 Parse & Start Practice</button>
        <button class="btn btn-secondary" id="clear-qa-btn">Clear</button>
      </div>
      <div id="parse-feedback" style="margin-top:12px;"></div>

      <!-- Practice zone appears inline here after parsing -->
      <div id="practice-zone" style="display:none;margin-top:20px;">
        <div style="padding:16px;margin-bottom:20px;background:var(--accent-pink-light);border:1.5px solid var(--accent-primary);border-radius:var(--radius-md);">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div style="display:flex;align-items:center;gap:12px;">
              <span style="font-size:1.5rem;">🎯</span>
              <div>
                <div style="font-weight:800;font-size:0.9rem;color:var(--accent-primary);">PRACTICE MODE</div>
                <span id="q-progress" style="font-size:0.75rem;font-weight:700;color:var(--text-muted);"></span>
              </div>
            </div>
            <div style="display:flex;gap:8px;">
              <button class="btn btn-sm btn-secondary" id="exit-practice-btn">✕ Exit</button>
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
          <div style="font-size:1.5rem;margin-bottom:6px;">📝</div>
          <div style="font-weight:700;font-size:.82rem;">Run your answer to check results</div>
        </div>

        <!-- Expected Answer (hidden until clicked) -->
        <div id="answer-reveal" style="display:none;margin-top:16px;">
          <div class="card" style="border-color:var(--accent-green-border);">
            <div style="font-weight:800;font-size:.72rem;color:var(--accent-green-dark);letter-spacing:1px;margin-bottom:6px;">📎 EXPECTED SQL</div>
            <pre id="expected-sql" style="background:var(--bg-editor);color:#a0c4ff;padding:14px;border-radius:8px;font-size:.82rem;white-space:pre-wrap;border:1px solid #2d323a;"></pre>
            <div id="expected-output" style="margin-top:12px;"></div>
          </div>
        </div>

        <div style="display:flex;justify-content:space-between;margin-top:20px;">
          <button class="btn btn-secondary" id="prev-q-btn" disabled>← Previous</button>
          <button class="btn btn-secondary" id="show-answer-btn">👁 Show Answer</button>
          <button class="btn btn-primary" id="next-q-btn">Next →</button>
        </div>

        <!-- Completion Bar (hidden until all done) -->
        <div id="completion-bar" style="display:none;margin-top:24px;">
          <div style="padding:24px;background:linear-gradient(135deg,#e8f5e9,#c8e6c9);border:2px solid #66bb6a;border-radius:var(--radius-md);text-align:center;">
            <div style="font-size:2.5rem;margin-bottom:8px;">🎉</div>
            <div style="font-weight:900;font-size:1.1rem;color:#2e7d32;margin-bottom:4px;">All Questions Completed!</div>
            <div style="font-size:0.82rem;color:#388e3c;font-weight:600;margin-bottom:20px;">Save your progress to practice again later.</div>
            <div style="display:flex;gap:10px;max-width:450px;margin:0 auto;">
              <input type="text" id="save-filename" class="pg-input" placeholder="Name your practice file..." value="" style="flex:1;">
              <button class="btn btn-primary" id="save-complete-btn">💾 Save</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Saved Sessions -->
  <div id="saved-sessions" style="display:none;margin-top:24px;">
    <div style="font-weight:800;font-size:0.85rem;color:var(--text-muted);letter-spacing:0.5px;margin-bottom:12px;">📚 SAVED SESSIONS</div>
    <div id="saved-list" style="display:flex;flex-direction:column;gap:10px;"></div>
  </div>


  <!-- Schema Modal -->
  <div id="schema-modal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:1000;display:none;align-items:center;justify-content:center;backdrop-filter:blur(4px);">
    <div class="card" style="max-width:700px;width:90%;max-height:85vh;overflow-y:auto;margin:5vh auto;">
      <div class="card-header">
        <span class="card-title">📋 Database Schema</span>
        <button class="btn btn-sm btn-secondary" id="close-schema-btn">✕ Close</button>
      </div>
      <div id="schema-content" style="margin-top:16px;"></div>
    </div>
  </div>`;
}

export function initPlayground() {
  const s = document.createElement('style');
  s.textContent = `
    .pg-label{font-size:.72rem;font-weight:800;color:var(--text-muted);display:block;margin-bottom:6px;letter-spacing:.5px;}
    .pg-input{width:100%;padding:10px 14px;border:1.5px solid var(--border-color);border-radius:var(--radius-sm);font-family:var(--font-mono);font-size:.85rem;background:var(--bg-input);color:var(--text-primary);outline:none;box-sizing:border-box;transition:border .2s;}
    .pg-input:focus{border-color:var(--accent-primary);}
    .pg-textarea{width:100%;min-height:180px;padding:16px;border:1.5px dashed var(--border-color);border-radius:var(--radius-md);font-family:var(--font-mono);font-size:.82rem;background:var(--bg-input);color:var(--text-primary);resize:vertical;outline:none;box-sizing:border-box;transition:border .2s;}
    .pg-textarea:focus{border-color:var(--accent-primary);border-style:solid;}
  `;
  document.head.appendChild(s);

  // header buttons
  document.getElementById('schema-btn')?.addEventListener('click', showSchema);
  document.getElementById('close-schema-btn')?.addEventListener('click', ()=>document.getElementById('schema-modal').style.display='none');
  document.getElementById('reset-db-btn')?.addEventListener('click', async()=>{await sqlEngine.resetAndReload();uploadedTables=[];renderUploadedChips();alert('Database reset!');});

  // collapsible sections
  setupCollapse('prompt-header-toggle','prompt-body','prompt-chevron');
  setupCollapse('upload-header-toggle','upload-body','upload-chevron');
  setupCollapse('qa-header-toggle','qa-body','qa-chevron');

  // prompt generator
  document.getElementById('generate-prompt-btn')?.addEventListener('click', generatePrompt);
  document.getElementById('copy-prompt-btn')?.addEventListener('click', copyPrompt);

  // detect JOIN in topic
  const topicInput = document.getElementById('prompt-topic');
  topicInput?.addEventListener('input', () => {
    const val = topicInput.value.toLowerCase();
    const isJoin = /\bjoin\b|\bjoins\b|\bleft\b|\bright\b|\binner\b|\bouter\b|\bcross\b|\bnatural\b/.test(val);
    const row = document.getElementById('join-dataset-row');
    if(row) row.style.display = isJoin ? 'block' : 'none';
  });

  // file upload
  const zone = document.getElementById('pg-upload-zone');
  const fileInput = document.getElementById('pg-file-input');
  zone?.addEventListener('click', () => fileInput?.click());
  zone?.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('dragover'); });
  zone?.addEventListener('dragleave', () => zone.classList.remove('dragover'));
  zone?.addEventListener('drop', e => { e.preventDefault(); zone.classList.remove('dragover'); handleCSVFiles(e.dataTransfer.files); });
  fileInput?.addEventListener('change', e => handleCSVFiles(e.target.files));

  // practice
  document.getElementById('parse-qa-btn')?.addEventListener('click', parseQA);
  document.getElementById('clear-qa-btn')?.addEventListener('click', ()=>{document.getElementById('qa-input').value='';document.getElementById('parse-feedback').innerHTML='';});
  document.getElementById('submit-answer-btn')?.addEventListener('click', runPractice);
  document.getElementById('show-answer-btn')?.addEventListener('click', showAnswer);
  document.getElementById('next-q-btn')?.addEventListener('click', ()=>navigateQ(1));
  document.getElementById('prev-q-btn')?.addEventListener('click', ()=>navigateQ(-1));
  document.getElementById('hint-btn')?.addEventListener('click', showHint);
  document.getElementById('exit-practice-btn')?.addEventListener('click', exitPractice);
  document.getElementById('save-complete-btn')?.addEventListener('click', saveToFile);

  document.addEventListener('keydown', e=>{if(e.ctrlKey&&e.key==='Enter') runPractice();});
  setTimeout(setupSyntaxHighlighting, 100);

  // Restore auto-saved session or show saved list
  restoreSession();
  renderSavedSessions();
}

function setupCollapse(toggleId, bodyId, chevronId) {
  const toggle = document.getElementById(toggleId);
  const body = document.getElementById(bodyId);
  const chevron = document.getElementById(chevronId);
  if(!toggle||!body) return;
  toggle.addEventListener('click', ()=>{
    const open = body.style.display !== 'none';
    body.style.display = open ? 'none' : 'block';
    if(chevron) chevron.style.transform = open ? 'rotate(-90deg)' : 'rotate(0deg)';
  });
}

/* ── Prompt Generator ── */
function isJoinTopic(topic) {
  return /\bjoin\b|\bjoins\b|\bleft\b|\bright\b|\binner\b|\bouter\b|\bcross\b|\bnatural\b/i.test(topic);
}

function generatePrompt() {
  const count = document.getElementById('prompt-count')?.value||5;
  const topic = document.getElementById('prompt-topic')?.value.trim();
  const dataset = document.getElementById('prompt-dataset')?.value||'employees';
  const joinMode = isJoinTopic(topic);
  const dataset2 = joinMode ? (document.getElementById('prompt-dataset-2')?.value||'customers') : null;

  if(!topic) { alert('Please enter a topic first.'); return; }
  if(joinMode && dataset === dataset2) { alert('Please pick two different datasets for JOINs.'); return; }

  const datasetLabel = joinMode ? `${dataset} + ${dataset2}` : dataset;

  // Schema definitions for each dataset
  const SCHEMAS = {
    employees: `   ${dataset === 'employees' ? dataset : 'employees'}:
     - id (PRIMARY KEY)
     - name
     - department
     - salary
     - hire_date
     - manager_id
     - age
     - city
     - email
     - status`,
    customers: `   ${dataset === 'customers' ? dataset : 'customers'}:
     - customer_id (PRIMARY KEY)
     - customer_name
     - employee_id (FOREIGN KEY → employees.id)
     - city
     - spent_amount`,
    products: `   products:
     - product_id (PRIMARY KEY)
     - product_name
     - category
     - price
     - stock_quantity
     - supplier`,
    orders: `   orders:
     - order_id (PRIMARY KEY)
     - customer_id (FOREIGN KEY → customers.customer_id)
     - product_id (FOREIGN KEY → products.product_id)
     - order_date
     - quantity
     - total_amount
     - status`,
    sales: `   sales:
     - sale_id (PRIMARY KEY)
     - product_id (FOREIGN KEY → products.product_id)
     - sale_date
     - quantity
     - revenue
     - region`
  };

  const ds1Schema = SCHEMAS[dataset] || SCHEMAS.employees;
  const ds2Schema = joinMode ? (SCHEMAS[dataset2] || SCHEMAS.customers) : '';

  const fileList = joinMode
    ? `   - /mnt/data/${dataset}.csv\n   - /mnt/data/${dataset2}.csv`
    : `   - /mnt/data/${dataset}.csv`;

  const downloadLinks = joinMode
    ? `   [Download ${dataset}.csv](sandbox:/mnt/data/${dataset}.csv)\n   [Download ${dataset2}.csv](sandbox:/mnt/data/${dataset2}.csv)`
    : `   [Download ${dataset}.csv](sandbox:/mnt/data/${dataset}.csv)`;

  const datasetCount = joinMode ? 'TWO' : 'ONE';
  const datasetList = joinMode
    ? `   - ${dataset} (minimum 20 rows)\n   - ${dataset2} (minimum 20 rows)`
    : `   - ${dataset} (minimum 20 rows)`;

  const joinRules = joinMode ? `
3. Data rules:
   - Use realistic names, cities, and values
   - Include some NULL foreign key values for LEFT JOIN practice
   - Ensure multiple related rows between tables` : `
3. Data rules:
   - Use realistic names, cities, and values
   - Include variety in column values for interesting queries`;

  const prompt = `You are an expert SQL instructor. Generate a practice set with the following specs:

**Config:**
- Number of questions: ${count}
- Topic: ${topic}
- Dataset${joinMode ? 's' : ''}: ${datasetLabel}
- Difficulty: mix of Easy, Medium, and Hard (ordered easy to hard)

═══════════════════════════════════════
STEP 1 — DATASET${joinMode ? 'S' : ''} (MANDATORY - FILE OUTPUT)
═══════════════════════════════════════
You MUST generate REAL downloadable files using the python_user_visible tool.

Requirements:
1. Create ${datasetCount} dataset${joinMode ? 's' : ''}:
${datasetList}

2. Schema:
${ds1Schema}
${joinMode ? '\n' + ds2Schema : ''}
${joinRules}

4. Save files EXACTLY as:
${fileList}

5. After execution, provide download links in this format:
${downloadLinks}

DO NOT:
- Print raw tables
- Give only Python code without execution
- Skip file generation

═══════════════════════════════════════
STEP 2 — QUESTIONS & ANSWERS
═══════════════════════════════════════
For each question, use EXACTLY this format:

---QUESTION---
Difficulty: [Easy/Medium/Hard]
Q: [Clear question text]
Hint: [A helpful hint without giving away the answer]
Answer:
\`\`\`sql
[The correct SQL query]
\`\`\`
---END---

Rules:
- Questions MUST be solvable using the ${datasetLabel} dataset${joinMode ? 's' : ''} from Step 1${joinMode ? '\n- All questions MUST require JOINing the two tables' : ''}
- Order from Easy to Hard
- Each answer must be valid SQLite SQL
- Include variety within the topic
- Keep questions practical and real-world oriented`;

  document.getElementById('prompt-output').textContent = prompt;
  document.getElementById('prompt-output-wrap').style.display = 'block';
}

function copyPrompt() {
  const text = document.getElementById('prompt-output')?.textContent;
  if(text) navigator.clipboard.writeText(text).then(()=>{
    const b = document.getElementById('copy-prompt-btn');
    b.textContent='✅ Copied!'; setTimeout(()=>b.textContent='📋 Copy',2000);
  });
}

/* ── File Upload Handler ── */
let uploadedTables = [];

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
    let text = await file.text();
    // Remove BOM
    text = text.replace(/^\uFEFF/, '');
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) continue;

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
      uploadedTables.push({ name: tableName, columns: headers, rowCount: rows.length });
      csvRawData[tableName] = text;
      renderUploadedChips();
    } catch (e) { console.error('CSV import error:', e); }
  }
}

function renderUploadedChips() {
  const container = document.getElementById('pg-table-chips');
  const wrapper = document.getElementById('pg-loaded-tables');
  if (!container || !wrapper) return;
  wrapper.style.display = uploadedTables.length > 0 ? 'block' : 'none';
  container.innerHTML = uploadedTables.map((t, i) => `
    <span style="display:inline-flex;align-items:center;gap:8px;padding:8px 14px;background:var(--accent-green-light);border:1.5px solid var(--accent-green-border);border-radius:var(--radius-sm);font-size:0.8rem;font-weight:800;color:var(--accent-green-dark);">
      📊 ${t.name} <span style="opacity:0.6">(${t.rowCount} rows, ${t.columns.length} cols)</span>
      <span style="color:var(--accent-red);cursor:pointer;" data-idx="${i}" class="remove-pg-table">✕</span>
    </span>
  `).join('');
  container.querySelectorAll('.remove-pg-table').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.idx);
      sqlEngine.exec(`DROP TABLE IF EXISTS ${uploadedTables[idx].name}`);
      uploadedTables.splice(idx, 1);
      renderUploadedChips();
    });
  });
}

/* ── Q/A Parser ── */
function parseQA() {
  const raw = document.getElementById('qa-input')?.value||'';
  const fb = document.getElementById('parse-feedback');
  if(!raw.trim()){fb.innerHTML='<div class="feedback feedback-info"><span class="feedback-icon">ℹ️</span><span>Paste Q&A from AI response first.</span></div>';return;}

  if(uploadedTables.length === 0){
    fb.innerHTML='<div class="feedback feedback-info"><span class="feedback-icon">⚠️</span><span>Upload your dataset CSV first (Step 2) so questions can run against it.</span></div>';
    return;
  }

  parsedQuestions = [];
  const blocks = raw.split(/---\s*QUESTION\s*---/i).slice(1);
  for(const block of blocks){
    const content = block.split(/---\s*END\s*---/i)[0]||'';
    const diff = content.match(/Difficulty\s*:\s*(Easy|Medium|Hard)/i);
    const q = content.match(/Q\s*:\s*(.+?)(?=\nHint\s*:|\nAnswer\s*:)/s);
    const hint = content.match(/Hint\s*:\s*(.+?)(?=\nAnswer\s*:)/s);
    // Try multiple patterns for the SQL answer
    let ansText = null;
    const ans1 = content.match(/```\s*sql\s*\n?([\s\S]*?)```/i);
    const ans2 = content.match(/```\s*\n?(SELECT[\s\S]*?)```/i);
    const ans3 = content.match(/```([\s\S]*?)```/);
    const ans4 = content.match(/Answer\s*:\s*\n?\s*(SELECT[\s\S]*?)$/is);
    if(ans1) ansText = ans1[1].trim();
    else if(ans2) ansText = ans2[1].trim();
    else if(ans3) ansText = ans3[1].trim();
    else if(ans4) ansText = ans4[1].trim();
    if(q) parsedQuestions.push({
      difficulty:(diff?.[1]||'Easy').toLowerCase(),
      question:q[1].trim(),
      hint:hint?.[1]?.trim()||'No hint available.',
      answer:ansText||'N/A'
    });
  }

  const order={easy:0,medium:1,hard:2};
  parsedQuestions.sort((a,b)=>(order[a.difficulty]||0)-(order[b.difficulty]||0));

  if(!parsedQuestions.length){
    fb.innerHTML='<div class="feedback feedback-error"><span class="feedback-icon">❌</span><span>Could not parse questions. Ensure AI used the ---QUESTION--- / ---END--- format.</span></div>';
    return;
  }

  fb.innerHTML=`<div class="feedback feedback-success"><span class="feedback-icon">✅</span><span>Found ${parsedQuestions.length} questions! Starting practice on ${uploadedTables.map(t=>t.name).join(', ')}...</span></div>`;
  currentQIdx=0;
  saveSession();
  setTimeout(()=>{
    document.getElementById('practice-zone').style.display='block';
    document.getElementById('practice-zone').scrollIntoView({behavior:'smooth',block:'start'});
    renderQuestion();
  },500);
}

/* ── Practice Mode ── */
function renderQuestion() {
  const q = parsedQuestions[currentQIdx]; if(!q) return;
  document.getElementById('q-number').textContent=`Q${currentQIdx+1} / ${parsedQuestions.length}`;
  document.getElementById('q-text').textContent=q.question;
  document.getElementById('q-progress').textContent=`${currentQIdx+1} of ${parsedQuestions.length}`;
  document.getElementById('q-progress-bar').style.width=`${((currentQIdx+1)/parsedQuestions.length)*100}%`;
  const tag=document.getElementById('q-difficulty');
  tag.textContent=q.difficulty.toUpperCase(); tag.className='diff-tag '+q.difficulty;
  document.getElementById('practice-editor').value='';
  document.getElementById('practice-result').innerHTML='<div style="text-align:center;padding:20px;color:var(--text-muted);"><div style="font-size:2rem;margin-bottom:8px;">📝</div><div style="font-weight:700;font-size:.85rem;">Run your answer to check results</div></div>';
  document.getElementById('answer-reveal').style.display='none';
  document.getElementById('q-hint-area').innerHTML='';
  document.getElementById('prev-q-btn').disabled=currentQIdx===0;
  document.getElementById('next-q-btn').disabled=false;
  document.getElementById('next-q-btn').textContent=currentQIdx===parsedQuestions.length-1?'🎉 Finish':'Next →';
  document.getElementById('completion-bar').style.display='none';
}

function resultToString(result) {
  if (!result.success || !result.results || !result.results.length) return '';
  const r = result.results[0];
  if (!r.values || !r.values.length) return '';
  return r.values.map(row => row.join('|')).sort().join('\n');
}

function runPractice() {
  const editor=document.getElementById('practice-editor');
  const res=document.getElementById('practice-result');
  if(!editor||!res) return;
  const query=editor.value.trim();
  if(!query){res.innerHTML='<div class="feedback feedback-info"><span class="feedback-icon">ℹ️</span><span>Write your SQL answer first.</span></div>';return;}
  const start=performance.now();
  const userResult=sqlEngine.exec(query);
  const elapsed=(performance.now()-start).toFixed(1);
  if(!userResult.success){
    res.innerHTML=`<div class="feedback feedback-error"><span class="feedback-icon">❌</span><span>${escapeHtml(userResult.error)}</span></div>`;
    return;
  }

  // Compare with expected output
  const q = parsedQuestions[currentQIdx];
  const expectedResult = q?.answer && q.answer !== 'N/A' ? sqlEngine.exec(q.answer) : null;
  const userStr = resultToString(userResult);
  const expectedStr = expectedResult ? resultToString(expectedResult) : null;
  const isMatch = expectedStr !== null && userStr === expectedStr;

  let matchBadge = '';
  if(expectedStr !== null) {
    matchBadge = isMatch
      ? '<div style="padding:10px 16px;background:var(--accent-green-light);border:1.5px solid var(--accent-green-border);border-radius:var(--radius-sm);margin-bottom:12px;"><span style="font-weight:800;color:var(--accent-green-dark);font-size:.85rem;">✅ Correct! Your output matches the expected result.</span></div>'
      : '<div style="padding:10px 16px;background:#fff0f0;border:1.5px solid #ffb3b3;border-radius:var(--radius-sm);margin-bottom:12px;"><span style="font-weight:800;color:#c0392b;font-size:.85rem;">❌ Output mismatch. Try again or check the expected answer.</span></div>';
  }

  res.innerHTML= matchBadge + `<div style="font-size:.75rem;color:var(--text-muted);margin-bottom:8px;font-weight:700;">⏱ ${elapsed}ms</div>` + sqlEngine.renderResults(userResult.results);
}

function showAnswer() {
  const q=parsedQuestions[currentQIdx]; if(!q) return;
  document.getElementById('expected-sql').textContent=q.answer;
  // Run expected query and show its output
  const expectedResult = q.answer && q.answer !== 'N/A' ? sqlEngine.exec(q.answer) : null;
  const outputDiv = document.getElementById('expected-output');
  if(expectedResult && expectedResult.success && outputDiv) {
    outputDiv.innerHTML = '<div style="font-weight:800;font-size:.72rem;color:var(--text-muted);letter-spacing:1px;margin-bottom:6px;">📋 EXPECTED OUTPUT</div>' + sqlEngine.renderResults(expectedResult.results);
  } else if(outputDiv) {
    outputDiv.innerHTML = '';
  }
  document.getElementById('answer-reveal').style.display='block';
}

function showHint() {
  const q=parsedQuestions[currentQIdx]; if(!q) return;
  document.getElementById('q-hint-area').innerHTML=`<div class="hint-box visible" style="display:block;">💡 ${escapeHtml(q.hint)}</div>`;
}

function navigateQ(dir) {
  const next=currentQIdx+dir;
  if(next<0) return;
  if(next>=parsedQuestions.length){
    // Show completion bar
    document.getElementById('completion-bar').style.display='block';
    document.getElementById('completion-bar').scrollIntoView({behavior:'smooth',block:'center'});
    document.getElementById('next-q-btn').disabled=true;
    return;
  }
  currentQIdx=next;
  saveSession();
  renderQuestion();
}

function exitPractice() {
  document.getElementById('practice-zone').style.display='none';
  parsedQuestions=[]; currentQIdx=0; csvRawData={};
  clearSession();
}

/* ── Session Persistence ── */
const STORAGE_KEY = 'pg_practice_session';
const SAVED_KEY = 'pg_saved_sessions';

function saveSession() {
  try {
    const data = {
      questions: parsedQuestions,
      currentIdx: currentQIdx,
      csvData: csvRawData,
      tables: uploadedTables
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch(e) { console.warn('Could not save session:', e); }
}

function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
}

function restoreSession() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    const data = JSON.parse(saved);
    if (!data.questions || !data.questions.length) return;
    loadSessionData(data);
    const fb = document.getElementById('parse-feedback');
    if(fb) fb.innerHTML = '<div class="feedback feedback-success"><span class="feedback-icon">🔄</span><span>Session restored! Continuing from Q' + (currentQIdx+1) + '/' + parsedQuestions.length + '.</span></div>';
  } catch(e) { console.warn('Could not restore session:', e); clearSession(); }
}

function loadSessionData(data) {
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
        const row = headers.map((h, idx) => `'${String(vals[idx] || '').replace(/'/g, "''")}' `).join(', ');
        sqlEngine.exec(`INSERT INTO ${tableName} VALUES (${row})`);
      }
    }
    csvRawData = data.csvData;
  }
  uploadedTables = data.tables || [];
  parsedQuestions = data.questions;
  currentQIdx = data.currentIdx || 0;
  renderUploadedChips();
  document.getElementById('practice-zone').style.display = 'block';
  renderQuestion();
}

/* ── Save to Website ── */
function saveToFile() {
  if (!parsedQuestions.length) { alert('Nothing to save.'); return; }
  const nameInput = document.getElementById('save-filename');
  const name = nameInput?.value.trim() || 'My SQL Practice';
  const entry = {
    id: Date.now(),
    name: name,
    savedAt: new Date().toISOString(),
    questionCount: parsedQuestions.length,
    questions: parsedQuestions,
    currentIdx: 0,
    csvData: csvRawData,
    tables: uploadedTables
  };
  try {
    const all = JSON.parse(localStorage.getItem(SAVED_KEY) || '[]');
    all.unshift(entry);
    localStorage.setItem(SAVED_KEY, JSON.stringify(all));
    renderSavedSessions();
    const btn = document.getElementById('save-complete-btn');
    if (btn) { btn.textContent = '✅ Saved!'; setTimeout(() => btn.textContent = '💾 Save', 2000); }
  } catch(e) { alert('Could not save: ' + e.message); }
}

function renderSavedSessions() {
  const container = document.getElementById('saved-list');
  const wrapper = document.getElementById('saved-sessions');
  if (!container || !wrapper) return;
  const all = JSON.parse(localStorage.getItem(SAVED_KEY) || '[]');
  if (!all.length) { wrapper.style.display = 'none'; return; }
  wrapper.style.display = 'block';
  container.innerHTML = all.map((s, i) => {
    const date = new Date(s.savedAt).toLocaleDateString('en-US', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });
    const tables = (s.tables || []).map(t => t.name).join(', ') || 'N/A';
    return `<div class="card" style="cursor:pointer;padding:14px 18px;transition:border .2s,transform .15s;" data-idx="${i}" class="saved-card">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div style="display:flex;align-items:center;gap:12px;" class="saved-card-click" data-idx="${i}">
          <span style="font-size:1.3rem;">📄</span>
          <div>
            <div style="font-weight:800;font-size:0.9rem;color:var(--text-primary);">${escapeHtml(s.name)}</div>
            <div style="font-size:0.72rem;color:var(--text-muted);font-weight:600;margin-top:2px;">${s.questionCount || s.questions?.length || 0} questions · ${tables} · ${date}</div>
          </div>
        </div>
        <button class="btn btn-sm btn-secondary delete-saved" data-idx="${i}" style="padding:4px 10px;">🗑</button>
      </div>
    </div>`;
  }).join('');
  container.querySelectorAll('.saved-card-click').forEach(el => {
    el.addEventListener('click', () => {
      const idx = parseInt(el.dataset.idx);
      const session = all[idx];
      if (session) { loadSessionData(session); saveSession(); }
    });
  });
  container.querySelectorAll('.delete-saved').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = parseInt(btn.dataset.idx);
      all.splice(idx, 1);
      localStorage.setItem(SAVED_KEY, JSON.stringify(all));
      renderSavedSessions();
    });
  });
}
/* ── Schema ── */
function showSchema() {
  const modal=document.getElementById('schema-modal');
  const content=document.getElementById('schema-content');
  if(!modal||!content) return;
  modal.style.display='flex';
  const tables=['employees','customers','products','orders','sales'];
  let html='';
  tables.forEach(table=>{
    const result=sqlEngine.exec(`PRAGMA table_info(${table})`);
    if(result.success&&result.results&&result.results.length>0){
      html+=`<div style="margin-bottom:16px;">
        <div style="font-weight:800;color:var(--accent-primary);margin-bottom:8px;font-size:.9rem;">📊 ${table.toUpperCase()}</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;">
          ${result.results[0].values.map(v=>`<span class="clause-chip locked">${v[1]} <span style="opacity:.5">(${v[2]})</span></span>`).join('')}
        </div>
      </div>`;
    }
  });
  content.innerHTML=html;
}
