/**
 * AI Challenges — Upload questions from any AI + your own dataset.
 * Progressive practice: easy → hard, next unlocks only after correct answer.
 * All data stored in browser storage (chrome.storage.local or localStorage).
 */

let challengeSets = [];
let queuedQuestions = [];    // Questions being prepared before publishing
let uploadedDatasets = [];   // Names of user-uploaded datasets
let activeSetIndex = -1;
let activeQuestionIndex = 0;
let arenaStartTime = Date.now();
let activeArenaDataset = '';

// ===== INIT =====
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await sqlEngine.init();
    await sqlEngine.loadAllDatasets();
  } catch (e) {
    console.error('SQL Engine init failed:', e);
  }

  loadChallengeSets();
  setupListeners();
  refreshDatasetChips();
});

// ===== EVENT LISTENERS =====
function setupListeners() {
  // --- Dataset upload ---
  const dropZone = document.getElementById('dataset-upload-zone');
  const fileInput = document.getElementById('dataset-file-input');
  dropZone.addEventListener('click', () => fileInput.click());
  dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('dragover'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
  dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (e.dataTransfer.files.length) handleDatasetFiles(e.dataTransfer.files);
  });
  fileInput.addEventListener('change', e => {
    if (e.target.files.length) handleDatasetFiles(e.target.files);
  });

  // --- Tabs ---
  document.querySelectorAll('.upload-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.upload-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
    });
  });

  // --- Manual add ---
  document.getElementById('add-question-btn').addEventListener('click', addManualQuestion);

  // --- AI Bulk Import ---
  const importBtn = document.getElementById('import-text-btn');
  if (importBtn) importBtn.addEventListener('click', importPlainText);
  
  const copyBtn = document.getElementById('copy-prompt-btn');
  if (copyBtn) copyBtn.addEventListener('click', copyAiPrompt);
  
  const countInput = document.getElementById('prompt-count');
  const topicInput = document.getElementById('prompt-topic');
  const datasetInput = document.getElementById('prompt-dataset');
  const joinCheck = document.getElementById('prompt-allow-joins');

  if (countInput) countInput.addEventListener('input', updateAiPrompt);
  if (topicInput) topicInput.addEventListener('input', updateAiPrompt);
  if (datasetInput) datasetInput.addEventListener('change', updateAiPrompt);
  if (joinCheck) joinCheck.addEventListener('change', updateAiPrompt);
  
  updateAiPrompt(); // Initial generation



  // --- Publish / Clear ---
  document.getElementById('publish-set-btn').addEventListener('click', publishChallengeSet);
  document.getElementById('clear-queue-btn').addEventListener('click', clearQueue);

  // --- Arena controls ---
  document.getElementById('arena-hint-btn').addEventListener('click', showArenaHint);
  document.getElementById('arena-run-btn').addEventListener('click', runArenaQuery);
  document.getElementById('arena-submit-btn').addEventListener('click', submitArenaAnswer);
  document.getElementById('arena-prev-btn').addEventListener('click', () => arenaNav(-1));
  document.getElementById('arena-next-btn').addEventListener('click', () => arenaNav(1));
  document.getElementById('arena-schema-toggle').addEventListener('click', toggleArenaSchema);
  document.getElementById('completion-back-btn').addEventListener('click', backToSets);

  // Keyboard shortcuts
  document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.key === 'Enter' && activeSetIndex >= 0) runArenaQuery();
  });
}

// ========================================================
//  DATASET UPLOAD
// ========================================================
async function handleDatasetFiles(files) {
  for (const file of files) {
    const ext = file.name.split('.').pop().toLowerCase();
    let tableName = file.name.split('.')[0].replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
    if (/^\d/.test(tableName)) tableName = 't_' + tableName;

    if (ext === 'csv') {
      const text = await file.text();
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => loadCSVData(tableName, results.data)
      });
    } else if (ext === 'sql') {
      const sql = await file.text();
      try {
        sqlEngine.exec(sql);
        if (!uploadedDatasets.includes(tableName)) uploadedDatasets.push(tableName);
        refreshDatasetChips();
        showToast(`Loaded SQL file "${file.name}" ✅`);
      } catch (e) {
        showToast(`Error loading "${file.name}": ${e.message}`, true);
      }
    } else {
      showToast(`Unsupported file: ${file.name}`, true);
    }
  }
}

function loadCSVData(tableName, data) {
  if (!data || data.length === 0) return;
  const headers = Object.keys(data[0]);
  const colsDefs = headers.map(h => `"${h}" TEXT`).join(', ');
  sqlEngine.exec(`DROP TABLE IF EXISTS "${tableName}"; CREATE TABLE "${tableName}" (${colsDefs});`);

  try {
    const placeholders = headers.map(() => '?').join(',');
    const stmt = sqlEngine.db.prepare(`INSERT INTO "${tableName}" VALUES (${placeholders})`);
    data.forEach(row => {
      const values = headers.map(h => {
        let val = row[h];
        if (val === undefined || val === null) return '';
        return val.toString();
      });
      stmt.run(values);
    });
    stmt.free();

    if (!uploadedDatasets.includes(tableName)) uploadedDatasets.push(tableName);
    refreshDatasetChips();
    showToast(`Loaded "${tableName}" (${data.length} rows) ✅`);
  } catch (e) {
    showToast(`Failed to load "${tableName}": ${e.message}`, true);
  }
}

function refreshDatasetChips() {
  const container = document.getElementById('loaded-datasets');
  container.innerHTML = '';

  // Show uploaded datasets
  uploadedDatasets.forEach(name => {
    const chip = document.createElement('div');
    chip.className = 'dataset-chip';
    chip.innerHTML = `📊 ${escHtml(name)} <span class="chip-remove" data-name="${name}">✕</span>`;
    container.appendChild(chip);
  });

  // Remove handlers
  container.querySelectorAll('.chip-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.dataset.name;
      sqlEngine.exec(`DROP TABLE IF EXISTS "${name}"`);
      uploadedDatasets = uploadedDatasets.filter(n => n !== name);
      refreshDatasetChips();
      showToast(`Removed "${name}" 🗑️`);
    });
  });
}

// ========================================================
//  QUESTION QUEUE (before publishing)
// ========================================================
function addManualQuestion() {
  const question = document.getElementById('q-question').value.trim();
  const difficulty = document.getElementById('q-difficulty').value;
  const datasetRaw = document.getElementById('q-dataset').value.trim();
  const expected = document.getElementById('q-expected').value.trim();
  const hint = document.getElementById('q-hint').value.trim();
  const topic = document.getElementById('q-topic').value.trim();

  if (!question) { showToast('Please enter a question text! 📝', true); return; }
  if (!datasetRaw) { showToast('Please enter the dataset table name! 📊', true); return; }
  if (!expected) { showToast('Please enter the expected SQL query! 💻', true); return; }

  // Support comma-separated datasets for JOIN questions
  const datasetList = datasetRaw.split(',').map(d => d.trim()).filter(Boolean);
  const dataset = datasetList[0]; // primary dataset
  const datasets = datasetList.length > 1 ? datasetList : undefined;

  queuedQuestions.push({ question, difficulty, dataset, datasets, expected_query: expected, hint, topic });

  // Clear form
  document.getElementById('q-question').value = '';
  document.getElementById('q-expected').value = '';
  document.getElementById('q-hint').value = '';
  document.getElementById('q-topic').value = '';

  renderQueue();
  showToast('Question added to queue! ✅');
}

function getTableSchema(tableName) {
  try {
    const result = sqlEngine.exec(`PRAGMA table_info("${tableName}")`);
    if (result.success && result.results && result.results.length > 0) {
      return result.results[0].values.map(row => ({
        name: row[1],
        type: row[2]
      }));
    }
  } catch (e) {
    console.error(`Failed to get schema for ${tableName}:`, e);
  }
  return null;
}

function getSchemaBlock(datasetName) {
  if (datasetName === 'custom') return '';

  const builtInTables = ['employees', 'customers', 'products', 'orders', 'sales'];
  const tablesToShow = [datasetName];

  // For JOINs, include all built-in tables
  const topic = document.getElementById('prompt-topic').value || '';
  const joinCheck = document.getElementById('prompt-allow-joins');
  if (topic.toLowerCase().includes('join') && joinCheck && joinCheck.checked) {
    builtInTables.forEach(t => {
      if (!tablesToShow.includes(t)) tablesToShow.push(t);
    });
  }

  let schemaText = '\n\nHere is the EXACT schema of the database. You MUST ONLY use these column names:\n';
  tablesToShow.forEach(table => {
    const cols = getTableSchema(table);
    if (cols && cols.length > 0) {
      schemaText += `\nTable: ${table}\nColumns:\n`;
      cols.forEach(c => {
        schemaText += `  - ${c.name} (${c.type})\n`;
      });
    }
  });
  schemaText += '\nCRITICAL: Do NOT invent or assume column names. Use ONLY the exact column names listed above. For example, if a table has "supplier" but no "brand", you must use "supplier".';
  return schemaText;
}

function updateAiPrompt() {
  const count = document.getElementById('prompt-count').value || 5;
  const topic = document.getElementById('prompt-topic').value || 'general topics';
  const dataset = document.getElementById('prompt-dataset').value;
  const joinCheck = document.getElementById('prompt-allow-joins');
  const joinRow = document.getElementById('join-toggle-row');
  const box = document.getElementById('generated-prompt-box');
  
  // Auto-detect if user wants JOINS
  const wantsJoins = topic.toLowerCase().includes('join');
  if (joinRow) {
    joinRow.style.display = wantsJoins ? 'block' : 'none';
  }
  
  const allowJoins = wantsJoins && joinCheck.checked;
  let datasetText = `the '${dataset}' dataset`;
  let datasetConstraint = `Base ALL questions on the '${dataset}' table. NO Joins allowed.`;
  let exampleTable = dataset;
  let exampleQuery = `SELECT * FROM ${exampleTable}`;
  
  if (allowJoins) {
    datasetConstraint = `Base questions on '${dataset}' but you MUST INCLUDE JOINs with other relevant tables where it makes sense.`;
    exampleQuery = `SELECT t1.*, t2.name FROM ${dataset} t1 JOIN other_table t2 ON t1.id = t2.id`;
  }

  if (dataset === 'custom') {
    datasetText = "a custom dataset";
    datasetConstraint = allowJoins 
      ? "Base questions on a primary table but ALLOW Joins with other related tables."
      : "EVERY question must be based on the SAME SINGLE table. NO Joins allowed.";
    exampleTable = "your_table";
    exampleQuery = allowJoins ? `SELECT * FROM ${exampleTable} JOIN another_table ...` : `SELECT * FROM ${exampleTable}`;
  }

  // Get actual schema from the database
  const schemaBlock = getSchemaBlock(dataset);
  
  // Ask AI to also provide a downloadable dataset
  const datasetDownloadInstr = `\n\nALSO: PROVIDE the dataset for these questions. Generate a dataset and create a downloadable CSV file using python_user_visible. Save it to /mnt/data/dataset.csv and provide ONLY the download link for the dataset in the response.\n`;

  const prompt = `Act as a SQL expert. Generate ${count} challenging SQL practice questions about ${topic} using ${datasetText}.
IMPORTANT: ${datasetConstraint} All queries must be compatible with standard SQLite.
${schemaBlock}${datasetDownloadInstr}

Return the questions data in this EXACT format, separated by blank lines:

Q: [The question text]
A: [The correct SQL query]
D: [Difficulty: easy, medium, or hard]
T: [The table name(s) used, comma separated if JOIN]
H: [A short hint]

Example Question:
Q: Show records from ${exampleTable}
A: ${exampleQuery}
D: medium
T: ${exampleTable}${allowJoins ? ', other_table' : ''}
H: Use ${allowJoins ? 'a JOIN clause' : 'a simple SELECT'}`;

  if (box) box.textContent = prompt;
}

function copyAiPrompt() {
  const text = document.getElementById('generated-prompt-box').textContent;
  navigator.clipboard.writeText(text).then(() => {
    showToast('Prompt copied! Paste it in ChatGPT/Gemini 🚀');
  });
}

// ========================================================
//  PLAIN TEXT IMPORT  (Q: / A: / D: / T: / H: format)
// ========================================================
function importPlainText() {
  const raw = document.getElementById('text-input').value.trim();
  if (!raw) { showToast('Paste your questions first! 📝', true); return; }

  // Split into question blocks by blank lines
  const blocks = raw.split(/\n\s*\n/).filter(b => b.trim());
  let count = 0;

  blocks.forEach(block => {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    let question = '', answer = '', difficulty = 'easy', dataset = 'employees', hint = '', datasets;

    lines.forEach(line => {
      // Match Q: / A: / D: / T: / H: prefixes (case-insensitive)
      const match = line.match(/^([QADTH]):\s*(.+)/i);
      if (match) {
        const key = match[1].toUpperCase();
        const val = match[2].trim();
        switch (key) {
          case 'Q': question = val; break;
          case 'A': answer = val; break;
          case 'D': difficulty = val.toLowerCase(); break;
          case 'T': {
            const parts = val.split(',').map(d => d.trim()).filter(Boolean);
            dataset = parts[0];
            if (parts.length > 1) datasets = parts;
            break;
          }
          case 'H': hint = val; break;
        }
      }
    });

    // Normalize difficulty
    if (!['easy', 'medium', 'hard'].includes(difficulty)) difficulty = 'easy';

    if (question && answer) {
      queuedQuestions.push({
        question,
        difficulty,
        dataset,
        datasets,
        expected_query: answer,
        hint,
        topic: '',
      });
      count++;
    }
  });

  if (count > 0) {
    // Validate expected queries against the database
    let invalidCount = 0;
    queuedQuestions.forEach(q => {
      const testResult = sqlEngine.exec(q.expected_query);
      if (!testResult.success) {
        q._invalid = true;
        q._error = testResult.error;
        invalidCount++;
      } else {
        q._invalid = false;
      }
    });

    renderQueue();
    if (invalidCount > 0) {
      showToast(`Imported ${count} questions — ⚠️ ${invalidCount} have invalid SQL! Check the queue.`, true);
    } else {
      showToast(`Imported ${count} questions from text! All queries validated ✅`);
    }
  } else {
    showToast('No valid questions found. Use Q: and A: prefixes.', true);
  }
}



function renderQueue() {
  const container = document.getElementById('queued-questions');
  const list = document.getElementById('queued-list');
  const countEl = document.getElementById('queued-count');
  const publishBar = document.getElementById('publish-bar');

  if (queuedQuestions.length === 0) {
    container.style.display = 'none';
    publishBar.style.display = 'none';
    return;
  }

  container.style.display = 'block';
  publishBar.style.display = 'block';
  countEl.textContent = queuedQuestions.length;

  list.innerHTML = '';
  queuedQuestions.forEach((q, i) => {
    const item = document.createElement('div');
    item.className = 'queued-item';
    const invalidBadge = q._invalid 
      ? `<div style="margin-top:4px;font-size:0.7rem;color:#dc2626;font-weight:700;background:#fef2f2;border:1px solid #fecaca;padding:3px 10px;border-radius:8px;">⚠️ INVALID SQL: ${escHtml(q._error || 'Query fails to execute')}</div>`
      : '';
    item.innerHTML = `
      <div style="font-weight:800; font-size:0.8rem; color:${q._invalid ? '#dc2626' : '#b86a7c'}; width:28px; flex-shrink:0;">#${i + 1}</div>
      <div class="queued-item-info">
        <div class="queued-item-q">${escHtml(q.question)}</div>
        <div class="queued-item-meta">
          <span class="diff-tag ${q.difficulty}">${q.difficulty}</span>
          <span>📊 ${escHtml((q.datasets || [q.dataset]).join(', '))}</span>
          ${q.topic ? `<span>🏷 ${escHtml(q.topic)}</span>` : ''}
        </div>
        ${invalidBadge}
      </div>
      <div class="queued-item-actions">
        <button class="qi-btn delete" data-idx="${i}" title="Remove">🗑️</button>
      </div>
    `;
    list.appendChild(item);
  });

  // Delete buttons
  list.querySelectorAll('.qi-btn.delete').forEach(btn => {
    btn.addEventListener('click', () => {
      queuedQuestions.splice(parseInt(btn.dataset.idx), 1);
      renderQueue();
    });
  });
}

function clearQueue() {
  if (queuedQuestions.length === 0) return;
  if (!confirm('Clear all queued questions?')) return;
  queuedQuestions = [];
  renderQueue();
  showToast('Queue cleared 🗑️');
}

// ========================================================
//  PUBLISH → CHALLENGE SET
// ========================================================
function publishChallengeSet() {
  if (queuedQuestions.length === 0) {
    showToast('Add at least one question first! 📝', true);
    return;
  }

  const name = document.getElementById('set-name-input').value.trim() || 'Untitled Challenge';

  // Sort: easy → medium → hard
  const diffOrder = { easy: 0, medium: 1, hard: 2 };
  const sorted = [...queuedQuestions].sort((a, b) => (diffOrder[a.difficulty] || 0) - (diffOrder[b.difficulty] || 0));

  const newSet = {
    id: Date.now(),
    name,
    createdAt: new Date().toISOString(),
    questions: sorted.map((q, i) => ({
      ...q,
      id: `ch_${Date.now()}_${i}`,
      solved: false,
      unlocked: i === 0,
    })),
  };

  challengeSets.unshift(newSet);
  saveChallengeSets();
  renderSetsList();

  // Clear queue
  queuedQuestions = [];
  document.getElementById('set-name-input').value = '';
  renderQueue();

  showToast(`Challenge set "${name}" created with ${sorted.length} questions! 🚀`);
}

// ========================================================
//  STORAGE
// ========================================================
function loadChallengeSets() {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['challengeSets'], result => {
      challengeSets = result.challengeSets || [];
      renderSetsList();
    });
  } else {
    challengeSets = JSON.parse(localStorage.getItem('challengeSets') || '[]');
    renderSetsList();
  }
}

function saveChallengeSets() {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.set({ challengeSets });
  } else {
    localStorage.setItem('challengeSets', JSON.stringify(challengeSets));
  }
}

// ========================================================
//  RENDER SETS LIST
// ========================================================
function renderSetsList() {
  const listEl = document.getElementById('sets-list');
  const countEl = document.getElementById('sets-total-count');
  countEl.textContent = `${challengeSets.length} SET${challengeSets.length !== 1 ? 'S' : ''}`;

  if (challengeSets.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📋</div>
        <div class="empty-state-text">NO CHALLENGE SETS YET</div>
        <div class="empty-state-sub">Add questions above and create your first challenge set!</div>
      </div>`;
    return;
  }

  listEl.innerHTML = '';
  challengeSets.forEach((set, idx) => {
    const card = document.createElement('div');
    card.className = `set-card${activeSetIndex === idx ? ' active' : ''}`;

    const solved = set.questions.filter(q => q.solved).length;
    const total = set.questions.length;
    const pct = Math.round((solved / total) * 100);
    const isComplete = solved === total;
    const diffCounts = {
      easy: set.questions.filter(q => q.difficulty === 'easy').length,
      medium: set.questions.filter(q => q.difficulty === 'medium').length,
      hard: set.questions.filter(q => q.difficulty === 'hard').length,
    };

    card.innerHTML = `
      <div class="set-info">
        <div class="set-name">${escHtml(set.name)} ${isComplete ? '✅' : ''}</div>
        <div class="set-meta">
          <span style="color:#15803d;">E:${diffCounts.easy}</span>
          <span style="color:#92400e;">M:${diffCounts.medium}</span>
          <span style="color:#991b1b;">H:${diffCounts.hard}</span>
          <span>📅 ${new Date(set.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
      <div class="set-progress">
        <div class="set-progress-bar"><div class="set-progress-fill" style="width:${pct}%;"></div></div>
        <div class="set-progress-text">${solved}/${total}</div>
        <button class="set-delete-btn" data-idx="${idx}" title="Delete set">🗑️</button>
      </div>`;

    card.addEventListener('click', e => {
      if (e.target.closest('.set-delete-btn')) return;
      startChallengeSet(idx);
    });

    listEl.appendChild(card);
  });

  listEl.querySelectorAll('.set-delete-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const idx = parseInt(btn.dataset.idx);
      if (!confirm('Delete this challenge set?')) return;
      challengeSets.splice(idx, 1);
      if (activeSetIndex === idx) {
        activeSetIndex = -1;
        document.getElementById('arena-container').classList.remove('visible');
      } else if (activeSetIndex > idx) activeSetIndex--;
      saveChallengeSets();
      renderSetsList();
      showToast('Set deleted 🗑️');
    });
  });
}

// ========================================================
//  CHALLENGE ARENA
// ========================================================
function startChallengeSet(idx) {
  activeSetIndex = idx;
  const set = challengeSets[idx];
  if (!set) return;

  const firstUnsolved = set.questions.findIndex(q => !q.solved);
  activeQuestionIndex = firstUnsolved >= 0 ? firstUnsolved : 0;

  if (set.questions.every(q => q.solved)) {
    document.getElementById('arena-container').classList.remove('visible');
    document.getElementById('completion-card').classList.add('visible');
    renderSetsList();
    return;
  }

  document.getElementById('completion-card').classList.remove('visible');
  document.getElementById('arena-container').classList.add('visible');
  renderSetsList();
  renderArenaQuestion();
  document.getElementById('arena-container').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderArenaQuestion() {
  const set = challengeSets[activeSetIndex];
  if (!set) return;
  const q = set.questions[activeQuestionIndex];
  if (!q) return;

  arenaStartTime = Date.now();

  document.getElementById('arena-question-num').textContent = `# CHALLENGE_${String(activeQuestionIndex + 1).padStart(2, '0')}`;
  document.getElementById('arena-question-text').textContent = q.question;
  document.getElementById('arena-dataset').textContent = `DATASET // ${q.dataset}`;
  document.getElementById('arena-counter').textContent = `${activeQuestionIndex + 1} / ${set.questions.length}`;

  const badge = document.getElementById('arena-difficulty');
  badge.textContent = (q.difficulty || 'easy').toUpperCase();
  badge.className = `arena-difficulty-badge ${q.difficulty || 'easy'}`;

  document.getElementById('arena-editor').value = '';
  document.getElementById('arena-result').innerHTML = '';
  document.getElementById('arena-feedback').innerHTML = '';
  document.getElementById('arena-hint-box').style.display = 'none';

  // Lock
  const locked = !q.unlocked && !q.solved;
  const overlay = document.getElementById('arena-locked-overlay');
  locked ? overlay.classList.add('visible') : overlay.classList.remove('visible');

  document.getElementById('arena-prev-btn').disabled = activeQuestionIndex === 0;
  document.getElementById('arena-next-btn').disabled = activeQuestionIndex === set.questions.length - 1;

  if (q.solved) {
    document.getElementById('arena-feedback').innerHTML = `
      <div style="padding:12px 20px; background:#dcfce7; border:1.5px solid #bbf7d0; border-radius:14px; display:flex; align-items:center; gap:10px;">
        <span style="font-size:1.2rem;">✅</span>
        <span style="font-weight:700; color:#15803d;">Already solved! Move to the next question.</span>
      </div>`;
  }

  // Get all datasets for this question
  const allDatasets = q.datasets || [q.dataset];
  activeArenaDataset = allDatasets[0];

  document.getElementById('arena-dataset').textContent = `DATASET // ${allDatasets.join(', ')}`;

  renderArenaDatasetTabs(allDatasets);
  loadArenaTablePreview(activeArenaDataset);
}

function renderArenaDatasetTabs(datasets) {
  const tabsContainer = document.getElementById('arena-dataset-tabs');
  if (!tabsContainer) return;
  tabsContainer.innerHTML = '';

  datasets.forEach(dsName => {
    const chip = document.createElement('button');
    chip.textContent = `[${dsName.toUpperCase()}]`;
    chip.style.cssText = `
      font-family: 'JetBrains Mono', monospace;
      font-weight: 800; font-size: 0.78rem;
      padding: 5px 14px; border-radius: 10px;
      cursor: pointer; transition: all 0.15s;
      border: 1.5px solid ${dsName === activeArenaDataset ? '#b86a7c' : '#eae1d7'};
      background: ${dsName === activeArenaDataset ? '#fbe6dd' : '#fcf6f0'};
      color: ${dsName === activeArenaDataset ? '#b86a7c' : '#718096'};
    `;
    chip.addEventListener('click', () => {
      activeArenaDataset = dsName;
      renderArenaDatasetTabs(datasets);
      loadArenaTablePreview(dsName);
      const previewDiv = document.getElementById('arena-schema-preview');
      if (previewDiv) previewDiv.style.display = 'block';
      const arrow = document.getElementById('arena-schema-arrow');
      if (arrow) arrow.style.transform = 'rotate(180deg)';
    });
    tabsContainer.appendChild(chip);
  });
}

function loadArenaTablePreview(tableName) {
  const previewDiv = document.getElementById('arena-schema-preview');
  try {
    const result = sqlEngine.exec(`SELECT * FROM "${tableName}" LIMIT 5`);
    if (result.success && result.results && result.results.length > 0) {
      const cols = result.results[0].columns;
      const rows = result.results[0].values;

      const hint = document.getElementById('arena-schema-hint');
      if (hint) {
        hint.innerHTML = `<span style="color:#718096;">Columns:</span> ` +
          cols.map(c => `<span style="background:rgba(45,212,191,0.1);color:#2dd4bf;padding:2px 8px;border-radius:4px;font-weight:700;">${c}</span>`).join('');
      }

      let html = '<table style="width:100%;border-collapse:collapse;font-size:0.8rem;">';
      html += '<thead><tr style="background:#fcf6f0;">';
      cols.forEach(c => html += `<th style="padding:10px 12px;text-align:left;color:#b86a7c;font-weight:800;white-space:nowrap;border-bottom:1px solid #eae1d7;text-transform:uppercase;letter-spacing:0.5px;font-size:0.75rem;">${escHtml(c)}</th>`);
      html += '</tr></thead><tbody>';
      rows.forEach(row => {
        html += '<tr style="border-bottom:1px solid #f2e7de;">';
        row.forEach(v => html += `<td style="padding:8px 12px;color:#32475b;white-space:nowrap;">${v === null ? '<em style="color:#ff6b6b;opacity:0.6;">NULL</em>' : escHtml(String(v))}</td>`);
        html += '</tr>';
      });
      html += '</tbody></table>';
      html += `<div style="padding:8px 12px;font-size:0.75rem;color:#718096;text-align:center;border-top:1px solid #f2e7de;">First 5 rows of <strong>${tableName}</strong></div>`;
      previewDiv.innerHTML = html;
    } else {
      previewDiv.innerHTML = `<div style="padding:16px;color:#718096;text-align:center;">Table "${tableName}" not found. Make sure you uploaded the dataset.</div>`;
    }
  } catch (e) {
    previewDiv.innerHTML = `<div style="padding:16px;color:#718096;text-align:center;">Table "${tableName}" not available. Upload the dataset first.</div>`;
  }
}

function toggleArenaSchema() {
  const el = document.getElementById('arena-schema-preview');
  const arrow = document.getElementById('arena-schema-arrow');
  if (el.style.display === 'block') { el.style.display = 'none'; arrow.style.transform = 'rotate(0deg)'; }
  else { el.style.display = 'block'; arrow.style.transform = 'rotate(180deg)'; }
}

function showArenaHint() {
  const set = challengeSets[activeSetIndex];
  if (!set) return;
  const q = set.questions[activeQuestionIndex];
  const hintBox = document.getElementById('arena-hint-box');
  hintBox.textContent = '💡 ' + (q.hint || 'No hint available.');
  hintBox.style.display = 'block';
}

function arenaNav(dir) {
  const set = challengeSets[activeSetIndex];
  if (!set) return;
  const next = activeQuestionIndex + dir;
  if (next < 0 || next >= set.questions.length) return;
  activeQuestionIndex = next;
  renderArenaQuestion();
}

function runArenaQuery() {
  const query = document.getElementById('arena-editor').value.trim();
  const resultDiv = document.getElementById('arena-result');
  if (!query) {
    resultDiv.innerHTML = '<div style="padding:12px 20px;background:#fef3c7;border:1.5px solid #fde68a;border-radius:14px;color:#92400e;font-weight:700;font-size:0.85rem;">ℹ️ Write a query and click Run.</div>';
    return;
  }
  const result = sqlEngine.exec(query);
  if (result.success) resultDiv.innerHTML = sqlEngine.renderResults(result.results);
  else resultDiv.innerHTML = `<div style="padding:12px 20px;background:#fef2f2;border:1.5px solid #fecaca;border-radius:14px;color:#991b1b;font-weight:700;font-size:0.85rem;">❌ ${escHtml(result.error)}</div>`;
}

async function submitArenaAnswer() {
  const set = challengeSets[activeSetIndex];
  if (!set) return;
  const q = set.questions[activeQuestionIndex];
  if (!q || !q.unlocked) return;
  if (q.solved) { showToast('Already solved! Move to next ➡️'); return; }

  const userQuery = document.getElementById('arena-editor').value.trim();
  const feedbackDiv = document.getElementById('arena-feedback');
  const resultDiv = document.getElementById('arena-result');

  if (!userQuery) {
    feedbackDiv.innerHTML = '<div style="padding:12px 20px;background:#fef3c7;border:1.5px solid #fde68a;border-radius:14px;color:#92400e;font-weight:700;font-size:0.85rem;">ℹ️ Please write a query first.</div>';
    return;
  }

  // Reset DB
  try { await sqlEngine.resetAndReload(); } catch (e) { console.error(e); }

  const userResult = sqlEngine.exec(userQuery);
  if (!userResult.success) {
    feedbackDiv.innerHTML = `<div style="padding:14px 20px;background:#fef2f2;border:1.5px solid #fecaca;border-radius:14px;"><div style="display:flex;align-items:center;gap:10px;"><span style="font-size:1.3rem;">❌</span><div><strong style="color:#991b1b;">Syntax Error!</strong><br><span style="font-size:0.85rem;color:#991b1b;opacity:0.7;">Check your query.</span></div></div></div>`;
    resultDiv.innerHTML = '';
    return;
  }

  try { await sqlEngine.resetAndReload(); } catch (e) { console.error(e); }

  const expectedResult = sqlEngine.exec(q.expected_query);
  if (!expectedResult.success) {
    // Mark as solved so user isn't stuck on invalid question
    q.solved = true;
    unlockNext(set, activeQuestionIndex);
    saveChallengeSets();
    renderSetsList();

    feedbackDiv.innerHTML = `
      <div style="padding:14px 20px;background:#fef3c7;border:1.5px solid #fde68a;border-radius:14px;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
          <span style="font-size:1.3rem;">⚠️</span>
          <strong style="color:#92400e;">Invalid Question — Auto-Skipped</strong>
        </div>
        <div style="font-size:0.82rem;color:#92400e;margin-bottom:8px;">
          The expected SQL query for this question has an error and cannot run against the current dataset.
        </div>
        <div style="font-size:0.78rem;color:#718096;">
          <strong>Expected query:</strong><br>
          <code style="font-family:'JetBrains Mono',monospace;color:#b86a7c;font-size:0.75rem;">${escHtml(q.expected_query)}</code>
        </div>
        <div style="font-size:0.75rem;color:#dc2626;margin-top:6px;">
          <strong>Error:</strong> ${escHtml(expectedResult.error || 'Unknown error')}
        </div>
        <div style="margin-top:10px;font-size:0.78rem;color:#15803d;font-weight:700;">
          ✅ This question has been auto-skipped. Click NEXT » to continue.
        </div>
      </div>`;
    return;
  }

  const isCorrect = compareResults(userResult.results, expectedResult.results);

  // DEBUG v3 - STAYS ON PAGE
  const _dbgUserCols = userResult.results?.[0]?.columns || [];
  const _dbgExpCols = expectedResult.results?.[0]?.columns || [];
  const _dbgUserRows = userResult.results?.[0]?.values?.length || 0;
  const _dbgExpRows = expectedResult.results?.[0]?.values?.length || 0;
  
  let debugHtml = `<div style="background:#fffbe6;border:2px solid #fbbf24;border-radius:12px;padding:15px;margin-bottom:12px;font-family:'JetBrains Mono',monospace;font-size:0.7rem;">
    <strong style="color:#b45309;">🔧 VERSION: 1.1.6 (LATEST)</strong><br>
    Cols: [U: ${_dbgUserCols.join(',')}] vs [E: ${_dbgExpCols.join(',')}]<br>
    Rows: [U: ${_dbgUserRows}] vs [E: ${_dbgExpRows}]<br>
    <strong style="color:${isCorrect ? '#059669' : '#dc2626'}">Final Check: ${isCorrect ? '✅ CORRECT' : '❌ DATA MISMATCH'}</strong><br>`;

  // If counts match but data doesn't, pinpoint the difference
  if (!isCorrect && _dbgUserCols.length === _dbgExpCols.length && _dbgUserRows === _dbgExpRows) {
    const normalize = (val) => {
      if (val === null || val === undefined) return 'NULL';
      if (typeof val === 'number') return Math.round(val * 10000) / 10000;
      return String(val).trim();
    };
    // Map columns, then find first mismatching row (reordered)
    const uFiltered = (userResult.results || []).filter(r => r.columns && r.columns.length > 0)[0];
    const eFiltered = (expectedResult.results || []).filter(r => r.columns && r.columns.length > 0)[0];
    
    if (uFiltered && eFiltered) {
        const uCols = uFiltered.columns.map(c => c.toLowerCase());
        const eCols = eFiltered.columns.map(c => c.toLowerCase());
        const colMap = eCols.map(ec => uCols.indexOf(ec));
        const uSortedRows = uFiltered.values.map(r => colMap.map(idx => String(normalize(r[idx]))).join('|')).sort();
        const eSortedRows = eFiltered.values.map(r => r.map(v => String(normalize(v))).join('|')).sort();
        
        let diffIdx = -1;
        for (let j = 0; j < uSortedRows.length; j++) {
            if (uSortedRows[j] !== eSortedRows[j]) { diffIdx = j; break; }
        }
        if (diffIdx !== -1) {
            debugHtml += `<br><span style="color:#dc2626;">Diff Row #${diffIdx}:</span><br>User: [${uSortedRows[diffIdx]}]<br>Exp: [${eSortedRows[diffIdx]}]`;
        }
    }
  }
  debugHtml += `</div>`;

  resultDiv.innerHTML = sqlEngine.renderResults(userResult.results);
  const solveTime = Date.now() - arenaStartTime;

  if (isCorrect) {
    q.solved = true;
    unlockNext(set, activeQuestionIndex);
    saveChallengeSets();
    feedbackDiv.innerHTML = debugHtml + `
      <div style="padding:14px 20px;background:#dcfce7;border:1.5px solid #bbf7d0;border-radius:14px;display:flex;align-items:center;gap:12px;">
        <span style="font-size:1.5rem;">🎉</span>
        <div><strong style="color:#15803d;">Correct!</strong> Solved in <strong>${fmtTime(solveTime)}</strong>.</div>
      </div>`;
    renderSetsList();
  } else {
    feedbackDiv.innerHTML = debugHtml + `
      <div style="padding:14px 20px;background:#fef2f2;border:1.5px solid #fecaca;border-radius:14px;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
          <span style="font-size:1.3rem;">❌</span>
          <strong style="color:#991b1b;">Wrong! Try again.</strong>
        </div>
        <div style="margin-top:10px;font-size:0.85rem;color:#718096;">
          <strong>Expected:</strong><br>
          <code style="font-family:'JetBrains Mono',monospace;color:#b86a7c;font-size:0.8rem;">${escHtml(q.expected_query)}</code>
        </div>
      </div>`;
    feedbackDiv.innerHTML += `<div style="margin-top:12px;"><div style="font-size:0.85rem;font-weight:600;color:#718096;margin-bottom:8px;">Expected Results:</div>${sqlEngine.renderResults(expectedResult.results)}</div>`;
  }
}

function unlockNext(set, idx) {
  if (idx + 1 < set.questions.length) set.questions[idx + 1].unlocked = true;
}

window.SQL_MASTER_DEBUG_VERSION = '1.1.5';

function compareResults(ur, er) {
  if (!ur && !er) return true;
  if (!ur || !er) return false;
  
  // Filter out empty result sets (sometimes produced by trailing semicolons)
  const uFiltered = (ur || []).filter(r => r.columns && r.columns.length > 0);
  const eFiltered = (er || []).filter(r => r.columns && r.columns.length > 0);
  
  if (uFiltered.length !== eFiltered.length) return false;

  for (let i = 0; i < uFiltered.length; i++) {
    const u = uFiltered[i], e = eFiltered[i];
    if (u.columns.length !== e.columns.length) return false;

    // Build case-insensitive column name mapping
    const uCols = u.columns.map(c => c.toLowerCase());
    const eCols = e.columns.map(c => c.toLowerCase());
    
    // Check column set matches
    const uColSet = [...uCols].sort();
    const eColSet = [...eCols].sort();
    for (let c = 0; c < uColSet.length; c++) {
      if (uColSet[c] !== eColSet[c]) return false;
    }

    // Map: index in expected -> index in user
    const colMap = [];
    const used = new Set();
    for (let ec = 0; ec < eCols.length; ec++) {
      const idx = uCols.findIndex((col, ci) => col === eCols[ec] && !used.has(ci));
      if (idx === -1) return false;
      colMap[ec] = idx;
      used.add(idx);
    }

    if (u.values.length !== e.values.length) return false;

    // Normalize value for comparison
    const normalize = (val) => {
      if (val === null || val === undefined) return '$$NULL$$';
      if (typeof val === 'number') {
        // Round numbers to 4 decimal places to avoid floating point issues
        return Math.round(val * 10000) / 10000;
      }
      if (typeof val === 'string') return val.trim();
      return String(val).trim();
    };

    // Prepare rows for comparison: reorder user columns to match expected, normalize, then stringify
    const usRows = u.values.map(row => colMap.map(idx => normalize(row[idx])).join('|')).sort();
    const esRows = e.values.map(row => e.columns.map((_, idx) => normalize(row[idx])).join('|')).sort();

    for (let j = 0; j < usRows.length; j++) {
      if (usRows[j] !== esRows[j]) return false;
    }
  }
  return true;
}

function backToSets() {
  activeSetIndex = -1;
  document.getElementById('arena-container').classList.remove('visible');
  document.getElementById('completion-card').classList.remove('visible');
  renderSetsList();
  document.getElementById('sets-container').scrollIntoView({ behavior: 'smooth' });
}

// ========================================================
//  UTILITIES
// ========================================================
function fmtTime(ms) {
  if (ms < 1000) return ms + 'ms';
  const s = (ms / 1000).toFixed(1);
  if (s < 60) return s + 's';
  return Math.floor(ms / 60000) + 'm ' + Math.round((ms % 60000) / 1000) + 's';
}

function escHtml(t) {
  if (!t) return '';
  const d = document.createElement('div');
  d.textContent = t;
  return d.innerHTML;
}

function showToast(msg, isErr = false) {
  const old = document.querySelector('.ch-toast');
  if (old) old.remove();
  const t = document.createElement('div');
  t.className = 'ch-toast';
  t.style.background = isErr ? '#fef2f2' : '#ffffff';
  t.style.borderColor = isErr ? '#fecaca' : '#eae1d7';
  t.style.color = isErr ? '#b91c1c' : '#32475b';
  t.textContent = msg;
  document.body.appendChild(t);
  requestAnimationFrame(() => { t.style.opacity = '1'; t.style.transform = 'translateX(-50%) translateY(0)'; });
  setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateX(-50%) translateY(20px)'; setTimeout(() => t.remove(), 300); }, 3000);
}
