import { sqlEngine, escapeHtml, setupSyntaxHighlighting } from '../engine/sql-engine.js';
import { ProgressManager } from '../engine/progress.js';

let currentDifficulty = 'mix';
let currentQuestionIndex = 0;
let currentQuestions = [];
let questionStartTime = Date.now();
let activeDatasetTab = '';

export function renderPractice() {
  return `
  <div class="page-header">
    <h1 class="page-title">Practice Lab</h1>
    <p class="page-subtitle">Sharpen your SQL skills with scenario-based challenges.</p>
  </div>

  <div style="display:flex;gap:8px;margin-bottom:24px;flex-wrap:wrap;" id="difficulty-tabs">
    <button class="btn btn-sm difficulty-tab" data-difficulty="mix" style="background:linear-gradient(135deg,#f59e0b,#ef4444);color:white;border:none;"> Master Mix</button>
    <button class="btn btn-sm btn-secondary difficulty-tab" data-difficulty="easy">Easy</button>
    <button class="btn btn-sm btn-secondary difficulty-tab" data-difficulty="medium">Medium</button>
    <button class="btn btn-sm btn-secondary difficulty-tab" data-difficulty="hard">Hard</button>
  </div>

  <div id="practice-streak" style="font-size:0.75rem;color:var(--accent-primary);font-weight:800;margin-bottom:16px;"></div>
  <div id="activity-chart-container" style="margin-bottom:24px;"></div>

  <div class="card" style="margin-bottom:24px;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
      <div>
        <div id="question-number" style="font-size:0.75rem;color:var(--text-muted);font-weight:800;letter-spacing:1px;"></div>
        <div id="question-dataset" style="font-size:0.7rem;color:var(--accent-primary);font-weight:700;margin-top:4px;"></div>
      </div>
      <div id="question-counter" style="font-size:0.75rem;color:var(--text-muted);font-weight:700;"></div>
    </div>
    <div id="question-text" style="font-size:1.05rem;font-weight:600;line-height:1.6;margin-bottom:20px;"></div>

    <div id="dataset-tabs" style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;"></div>
    <div id="schema-hint" style="margin-bottom:12px;font-size:0.75rem;display:flex;gap:6px;flex-wrap:wrap;"></div>

    <button class="btn btn-sm btn-secondary" id="toggle-preview-btn" style="margin-bottom:12px;">
      <span id="preview-arrow" style="transition:transform 0.2s;"></span> Table Preview
    </button>
    <div id="table-preview" style="display:none;max-height:250px;overflow:auto;border:1.5px solid var(--border-color);border-radius:var(--radius-md);margin-bottom:16px;"></div>

    <div class="editor-chrome">
      <div class="editor-chrome-bar">
        <span class="editor-chrome-label">>_ QUERY_INPUT</span>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-sm btn-secondary" id="hint-btn" style="background:rgba(178,173,213,0.2);border-color:#b2add5;color:#b2add5;"> Hint</button>
          <button class="btn btn-sm btn-accent" id="run-btn"> Run</button>
        </div>
      </div>
      <textarea class="sql-editor" id="practice-editor" placeholder="Enter your SQL query here..."></textarea>
    </div>

    <div id="hint-box" class="hint-box" style="margin-top:12px;"></div>
    <div id="practice-result" style="margin-top:16px;"></div>
    <div id="practice-feedback" style="margin-top:12px;"></div>

    <div style="display:flex;justify-content:space-between;margin-top:20px;">
      <button class="btn btn-secondary btn-sm" id="prev-btn">← Prev</button>
      <button class="btn btn-primary" id="check-btn"> Check Answer</button>
      <button class="btn btn-secondary btn-sm" id="next-btn">Next →</button>
    </div>
  </div>`;
}

export async function initPractice() {
  // QUESTIONS_DATA is loaded via script tag
  await refreshActivity();
  switchDifficulty('mix');
  setupListeners();
  setTimeout(setupSyntaxHighlighting, 200);
}

async function refreshActivity() {
  const p = await ProgressManager.getProgress();
  ProgressManager.renderActivityChart('activity-chart-container', p, 100);
  const el = document.getElementById('practice-streak');
  if (el) el.textContent = `STREAK: ${p.streak || 0} D`;
}

function setupListeners() {
  document.getElementById('prev-btn')?.addEventListener('click', () => { if (currentQuestionIndex > 0) { currentQuestionIndex--; renderQuestion(); } });
  document.getElementById('next-btn')?.addEventListener('click', () => { if (currentQuestionIndex < currentQuestions.length - 1) { currentQuestionIndex++; renderQuestion(); } });
  document.getElementById('hint-btn')?.addEventListener('click', showHint);
  document.getElementById('run-btn')?.addEventListener('click', runPractice);
  document.getElementById('check-btn')?.addEventListener('click', checkAnswer);
  document.getElementById('toggle-preview-btn')?.addEventListener('click', togglePreview);

  document.querySelectorAll('.difficulty-tab').forEach(tab => {
    tab.addEventListener('click', () => switchDifficulty(tab.dataset.difficulty));
  });

  document.addEventListener('keydown', e => { if (e.ctrlKey && e.key === 'Enter') runPractice(); });
}

async function switchDifficulty(difficulty) {
  currentDifficulty = difficulty;
  currentQuestionIndex = 0;
  if (!window.QUESTIONS_DATA) return;

  if (difficulty === 'mix') {
    const easy = [...QUESTIONS_DATA.easy].sort(() => 0.5 - Math.random()).slice(0, 2);
    const medium = [...QUESTIONS_DATA.medium].sort(() => 0.5 - Math.random()).slice(0, 2);
    const hard = [...QUESTIONS_DATA.hard].sort(() => 0.5 - Math.random()).slice(0, 1);
    currentQuestions = [...easy, ...medium, ...hard];
  } else {
    currentQuestions = QUESTIONS_DATA[difficulty] || [];
  }

  document.querySelectorAll('.difficulty-tab').forEach(t => {
    t.classList.remove('active');
    if (t.dataset.difficulty !== 'mix') { t.className = 'btn btn-sm btn-secondary difficulty-tab'; }
  });
  const active = document.querySelector(`.difficulty-tab[data-difficulty="${difficulty}"]`);
  if (active) active.classList.add('active');

  await renderQuestion();
}

async function renderQuestion() {
  const q = currentQuestions[currentQuestionIndex];
  if (!q) return;
  questionStartTime = Date.now();

  const progress = await ProgressManager.getProgress();
  const isDone = progress.solvedQuestionIds.includes(q.id);

  const qNum = document.getElementById('question-number');
  if (qNum) {
    qNum.innerHTML = `Challenge #${q.id}${isDone ? '<span style="margin-left:8px;font-size:0.65rem;background:#dcfce7;color:#15803d;padding:2px 8px;border-radius:var(--radius-pill);font-weight:800;letter-spacing:0.5px;display:inline-flex;align-items:center;gap:3px;box-shadow:0 0 10px rgba(21,128,61,0.08);">SOLVED ✓</span>' : ''}`;
  }
  const qText = document.getElementById('question-text');
  if (qText) qText.textContent = q.question;

  const allDatasets = q.datasets || [q.dataset];
  activeDatasetTab = allDatasets[0];
  const qDs = document.getElementById('question-dataset');
  if (qDs) qDs.textContent = `Database: ${allDatasets.join(', ')}`;

  const qEd = document.getElementById('practice-editor');
  if (qEd) qEd.value = '';
  const qRes = document.getElementById('practice-result');
  if (qRes) qRes.innerHTML = '';
  const qFeed = document.getElementById('practice-feedback');
  if (qFeed) qFeed.innerHTML = '';
  const hintBox = document.getElementById('hint-box');
  if (hintBox) { hintBox.style.display = 'none'; hintBox.textContent = ''; hintBox.classList.remove('visible'); }

  const qCounter = document.getElementById('question-counter');
  if (qCounter) qCounter.textContent = `${currentQuestionIndex + 1} / ${currentQuestions.length}`;

  document.getElementById('prev-btn').disabled = currentQuestionIndex === 0;
  document.getElementById('next-btn').disabled = currentQuestionIndex === currentQuestions.length - 1;

  renderDatasetTabs(allDatasets);
  loadTablePreview(activeDatasetTab);
}

function renderDatasetTabs(datasets) {
  const container = document.getElementById('dataset-tabs');
  if (!container) return;
  container.innerHTML = datasets.map(ds => `
    <button class="btn btn-sm ${ds === activeDatasetTab ? 'btn-accent' : 'btn-secondary'}" data-table="${ds}" style="font-size:0.75rem;">
      [${ds.toUpperCase()}]
    </button>
  `).join('');
  container.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      activeDatasetTab = btn.dataset.table;
      renderDatasetTabs(datasets);
      loadTablePreview(btn.dataset.table);
    });
  });
}

function loadTablePreview(tableName) {
  const previewDiv = document.getElementById('table-preview');
  if (!previewDiv) return;
  try {
    const result = sqlEngine.exec(`SELECT * FROM ${tableName} LIMIT 5`);
    if (result.success && result.results?.length > 0) {
      const cols = result.results[0].columns;
      const rows = result.results[0].values;
      const hint = document.getElementById('schema-hint');
      if (hint) hint.innerHTML = `<span style="color:var(--text-muted)">Columns:</span> ` + cols.map(c => `<span style="background:var(--accent-pink-light);color:var(--accent-primary);padding:2px 8px;border-radius:4px;font-weight:700;font-size:0.72rem;">${c}</span>`).join('');
      previewDiv.innerHTML = sqlEngine.renderResults(result.results);
    }
  } catch (e) { previewDiv.innerHTML = '<div style="padding:16px;color:var(--text-muted);text-align:center;">Preview unavailable.</div>'; }
}

function togglePreview() {
  const el = document.getElementById('table-preview');
  const arrow = document.getElementById('preview-arrow');
  if (el.style.display === 'none') { el.style.display = 'block'; arrow.style.transform = 'rotate(180deg)'; }
  else { el.style.display = 'none'; arrow.style.transform = 'rotate(0deg)'; }
}

function showHint() {
  const q = currentQuestions[currentQuestionIndex];
  const hintBox = document.getElementById('hint-box');
  if (q && hintBox) {
    hintBox.innerHTML = `<div style="display:flex;gap:10px;align-items:flex-start;">
      <span style="font-size:1.2rem;line-height:1;margin-top:2px;">💡</span>
      <div style="line-height:1.6;">
        <strong style="color:var(--accent-primary);font-size:0.75rem;letter-spacing:0.5px;text-transform:uppercase;display:block;margin-bottom:4px;">💡 Practice Hint</strong>
        <span style="font-size:0.86rem;font-weight:600;color:var(--text-secondary);">${escapeHtml(q.hint)}</span>
      </div>
    </div>`;
    hintBox.style.display = 'block';
    hintBox.classList.add('visible');
  }
}

function runPractice() {
  const query = document.getElementById('practice-editor')?.value.trim();
  const resultDiv = document.getElementById('practice-result');
  if (!query) { resultDiv.innerHTML = '<div class="feedback feedback-info"><span class="feedback-icon">ℹ</span><span>Write a query and click Run.</span></div>'; return; }
  const result = sqlEngine.exec(query);
  resultDiv.innerHTML = result.success ? sqlEngine.renderResults(result.results) : `<div class="feedback feedback-error"><span class="feedback-icon"></span><span>Error: ${escapeHtml(result.error)}</span></div>`;
}

async function checkAnswer() {
  const q = currentQuestions[currentQuestionIndex];
  const userQuery = document.getElementById('practice-editor')?.value.trim();
  const feedbackDiv = document.getElementById('practice-feedback');
  const resultDiv = document.getElementById('practice-result');
  if (!userQuery) { feedbackDiv.innerHTML = '<div class="feedback feedback-info"><span class="feedback-icon">ℹ</span><span>Please write a query first.</span></div>'; return; }

  await sqlEngine.resetAndReload();
  const userResult = sqlEngine.exec(userQuery);
  if (!userResult.success) { feedbackDiv.innerHTML = '<div class="feedback feedback-error"><span class="feedback-icon"></span><span>Syntax error. Check your query.</span></div>'; resultDiv.innerHTML = ''; return; }

  await sqlEngine.resetAndReload();
  const expectedResult = sqlEngine.exec(q.expected_query);
  if (!expectedResult.success) { feedbackDiv.innerHTML = '<div class="feedback feedback-error"><span class="feedback-icon"></span><span>Error in expected query.</span></div>'; return; }

  const isCorrect = compareResults(userResult.results, expectedResult.results);
  resultDiv.innerHTML = sqlEngine.renderResults(userResult.results);
  const solveTime = Date.now() - questionStartTime;

  if (isCorrect) {
    feedbackDiv.innerHTML = `<div class="feedback feedback-success"><span class="feedback-icon"></span><div><strong>Correct!</strong> Solved in <strong>${ProgressManager.formatTime(solveTime)}</strong>.</div></div>`;
    await ProgressManager.saveQuestion(q.id, true, solveTime);
    await ProgressManager.saveClauseMastered(q.topic);
    
    // Dynamically append the solved badge immediately
    const qNum = document.getElementById('question-number');
    if (qNum) {
      qNum.innerHTML = `Challenge #${q.id}<span style="margin-left:8px;font-size:0.65rem;background:#dcfce7;color:#15803d;padding:2px 8px;border-radius:var(--radius-pill);font-weight:800;letter-spacing:0.5px;display:inline-flex;align-items:center;gap:3px;box-shadow:0 0 10px rgba(21,128,61,0.08);">SOLVED ✓</span>`;
    }
  } else {
    feedbackDiv.innerHTML = `<div class="feedback feedback-error"><span class="feedback-icon"></span><div><strong>Wrong!</strong><div style="margin-top:6px;font-size:0.85rem;color:var(--text-muted);"><strong>Expected:</strong><br><code style="color:var(--accent-cyan);">${escapeHtml(q.expected_query)}</code></div></div></div>`;
    await ProgressManager.saveQuestion(q.id, false, solveTime);
  }
  await refreshActivity();
}

function compareResults(userResults, expectedResults) {
  if (!userResults && !expectedResults) return true;
  if (!userResults || !expectedResults) return false;
  if (userResults.length !== expectedResults.length) return false;

  for (let i = 0; i < userResults.length; i++) {
    const ur = userResults[i];
    const er = expectedResults[i];

    if (ur.columns.length !== er.columns.length) return false;

    // Build case-insensitive column name mapping (user col index -> expected col index)
    const userColsLower = ur.columns.map(c => c.toLowerCase());
    const expectedColsLower = er.columns.map(c => c.toLowerCase());

    // Check that both have the same set of column names (order-independent)
    const userColSet = [...userColsLower].sort();
    const expectedColSet = [...expectedColsLower].sort();
    for (let c = 0; c < userColSet.length; c++) {
      if (userColSet[c] !== expectedColSet[c]) return false;
    }

    // Map: for each expected column index, find the matching user column index
    const userToExpectedOrder = [];
    const usedIndices = new Set();
    for (let ec = 0; ec < expectedColsLower.length; ec++) {
      const matchIdx = userColsLower.findIndex((col, idx) => col === expectedColsLower[ec] && !usedIndices.has(idx));
      if (matchIdx === -1) return false;
      userToExpectedOrder[ec] = matchIdx;
      usedIndices.add(matchIdx);
    }

    if (ur.values.length !== er.values.length) return false;

    // Reorder user rows to match expected column order, then compare
    const reorderRow = (row) => userToExpectedOrder.map(idx => row[idx]);
    const userSorted = [...ur.values].map(r => reorderRow(r).map(String).join('|')).sort();
    const expectedSorted = [...er.values].map(r => r.map(String).join('|')).sort();

    for (let j = 0; j < userSorted.length; j++) {
      if (userSorted[j] !== expectedSorted[j]) return false;
    }
  }

  return true;
}
