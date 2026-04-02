/**
 * Practice Page - SQL Practice Questions
 */
let currentDifficulty = 'easy';
let currentQuestionIndex = 0;
let currentQuestions = [];
let questionStartTime = Date.now();
let activeDatasetTab = '';

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await sqlEngine.init();
    await sqlEngine.loadAllDatasets();
  } catch (e) {
    console.error('Failed to init SQL engine:', e);
  }

  // Init activity chart
  await refreshActivity();
  
  // Set default to Master Mix on load
  switchDifficulty('mix');
  setupEventListeners();
});

async function refreshActivity() {
  const p = await ProgressManager.getProgress();
  ProgressManager.renderActivityChart('activity-chart-container', p, 100);
  const streakEl = document.getElementById('practice-streak');
  if (streakEl) streakEl.textContent = `STREAK: ${p.streak || 0} D`;
}

function setupEventListeners() {
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  const hintBtn = document.getElementById('hint-btn');
  const runBtn = document.getElementById('run-btn');
  const checkBtn = document.getElementById('check-btn');
  const toggleBtn = document.getElementById('toggle-preview-btn');

  if (prevBtn) prevBtn.addEventListener('click', prevQuestion);
  if (nextBtn) nextBtn.addEventListener('click', nextQuestion);
  if (hintBtn) hintBtn.addEventListener('click', showHint);
  if (runBtn) runBtn.addEventListener('click', runPractice);
  if (checkBtn) checkBtn.addEventListener('click', checkAnswer);
  if (toggleBtn) toggleBtn.addEventListener('click', toggleTablePreview);

  // Difficulty tabs
  document.querySelectorAll('.difficulty-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      switchDifficulty(tab.dataset.difficulty);
    });
  });
}

function switchDifficulty(difficulty) {
  currentDifficulty = difficulty;
  currentQuestionIndex = 0;
  
  if (difficulty === 'mix') {
    // Generate 2 Easy, 2 Medium, 1 Hard
    const easy = [...QUESTIONS_DATA.easy].sort(() => 0.5 - Math.random()).slice(0, 2);
    const medium = [...QUESTIONS_DATA.medium].sort(() => 0.5 - Math.random()).slice(0, 2);
    const hard = [...QUESTIONS_DATA.hard].sort(() => 0.5 - Math.random()).slice(0, 1);
    currentQuestions = [...easy, ...medium, ...hard];
  } else {
    currentQuestions = QUESTIONS_DATA[difficulty];
  }

  // Update tabs
  document.querySelectorAll('.difficulty-tab').forEach(t => t.classList.remove('active'));
  const activeTab = document.querySelector(`.difficulty-tab[data-difficulty="${difficulty}"]`);
  if (activeTab) activeTab.classList.add('active');

  renderQuestion();
}

function renderQuestion() {
  const q = currentQuestions[currentQuestionIndex];
  if (!q) return;

  // Start timing
  questionStartTime = Date.now();

  const qNum = document.getElementById('question-number');
  if (qNum) qNum.textContent = `Challenge #${q.id}`;

  const qText = document.getElementById('question-text');
  if (qText) qText.textContent = q.question;

  // Get all datasets for this question (support multi-table JOINs)
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
  if (hintBox) {
    hintBox.style.display = 'none';
    hintBox.textContent = '';
  }
  
  const qCounter = document.getElementById('question-counter');
  if (qCounter) qCounter.textContent = `Question ${currentQuestionIndex + 1} of ${currentQuestions.length}`;

  // Button states
  const prevBtn = document.getElementById('prev-btn');
  if (prevBtn) prevBtn.disabled = currentQuestionIndex === 0;

  const nextBtn = document.getElementById('next-btn');
  if (nextBtn) nextBtn.disabled = currentQuestionIndex === currentQuestions.length - 1;

  // Render dataset tabs
  renderDatasetTabs(allDatasets);

  // Load table preview for the active dataset
  loadTablePreview(activeDatasetTab);
}

function renderDatasetTabs(datasets) {
  const tabsContainer = document.getElementById('dataset-tabs');
  if (!tabsContainer) return;
  tabsContainer.innerHTML = '';

  datasets.forEach(dsName => {
    const chip = document.createElement('button');
    chip.textContent = `[${dsName.toUpperCase()}]`;
    chip.dataset.table = dsName;
    chip.style.cssText = `
      font-family: 'JetBrains Mono', monospace;
      font-weight: 800; font-size: 0.78rem;
      padding: 5px 14px; border-radius: 10px;
      cursor: pointer; transition: all 0.15s;
      border: 1.5px solid ${dsName === activeDatasetTab ? '#b86a7c' : '#eae1d7'};
      background: ${dsName === activeDatasetTab ? '#fbe6dd' : '#fcf6f0'};
      color: ${dsName === activeDatasetTab ? '#b86a7c' : '#718096'};
    `;
    chip.addEventListener('click', () => {
      activeDatasetTab = dsName;
      renderDatasetTabs(datasets);
      loadTablePreview(dsName);
      // Auto-open preview when clicking a tab
      const previewDiv = document.getElementById('table-preview');
      if (previewDiv) previewDiv.style.display = 'block';
      const arrow = document.getElementById('preview-arrow');
      if (arrow) arrow.style.transform = 'rotate(180deg)';
    });
    tabsContainer.appendChild(chip);
  });
}

function loadTablePreview(tableName) {
  const previewDiv = document.getElementById('table-preview');
  
  if (previewDiv && previewDiv.style.display === 'none') {
    previewDiv.style.display = 'block';
  }
  const arrow = document.getElementById('preview-arrow');
  if (arrow) arrow.style.transform = 'rotate(180deg)';

  try {
    const result = sqlEngine.exec(`SELECT * FROM ${tableName} LIMIT 5`);
    if (result.success && result.results && result.results.length > 0) {
      const cols = result.results[0].columns;
      const rows = result.results[0].values;
      
      // Update button text is no longer needed since we have tabs
      
      // Add columns directly above editor
      const schemaHint = document.getElementById('schema-hint');
      if (schemaHint) {
        schemaHint.innerHTML = `<span style="color:var(--text-muted);">Columns in ${tableName}:</span> ` + 
          cols.map(c => `<span style="background:rgba(45,212,191,0.1); color:var(--accent-cyan); padding:2px 8px; border-radius:4px; font-weight:700;">${c}</span>`).join('');
      }

      let html = '<table style="width:100%; border-collapse:collapse; font-size:0.8rem;">';
      html += '<thead><tr style="background: var(--bg-secondary);">';
      for (const col of cols) {
        html += `<th style="padding:10px 12px; text-align:left; color:var(--accent-pink); font-weight:800; white-space:nowrap; border-bottom:1px solid var(--border-color); text-transform:uppercase; letter-spacing:0.5px; font-size:0.75rem;">${escapeHtml(col)}</th>`;
      }
      html += '</tr></thead><tbody>';
      
      for (const row of rows) {
        html += '<tr style="border-bottom:1px solid var(--border-color);">';
        for (const val of row) {
          const display = val === null ? '<em style="color:#ff6b6b;opacity:0.6;">NULL</em>' : escapeHtml(String(val));
          html += `<td style="padding:8px 12px; color:var(--text-secondary); white-space:nowrap;">${display}</td>`;
        }
        html += '</tr>';
      }
      
      html += '</tbody></table>';
      html += `<div style="padding:8px 12px; font-size:0.75rem; color:var(--text-muted); text-align:center; border-top:1px solid var(--border-color);">Showing first 5 rows of <strong>${tableName}</strong></div>`;
      previewDiv.innerHTML = html;
    } else {
      previewDiv.innerHTML = '<div style="padding:16px;color:var(--text-muted);text-align:center;">Table not loaded yet. Click "Run" first.</div>';
    }
  } catch (e) {
    previewDiv.innerHTML = '<div style="padding:16px;color:var(--text-muted);text-align:center;">Table preview unavailable.</div>';
  }
}

function toggleTablePreview() {
  const previewDiv = document.getElementById('table-preview');
  const arrow = document.getElementById('preview-arrow');
  if (previewDiv.style.display === 'none') {
    previewDiv.style.display = 'block';
    arrow.style.transform = 'rotate(180deg)';
  } else {
    previewDiv.style.display = 'none';
    arrow.style.transform = 'rotate(0deg)';
  }
}

function showHint() {
  const q = currentQuestions[currentQuestionIndex];
  const hintBox = document.getElementById('hint-box');
  hintBox.textContent = '💡 ' + q.hint;
  hintBox.style.display = 'block';
}

function runPractice() {
  const query = document.getElementById('practice-editor').value.trim();
  const resultDiv = document.getElementById('practice-result');
  
  if (!query) {
    resultDiv.innerHTML = '<div class="feedback feedback-info"><span class="feedback-icon">ℹ️</span><span>Write a query and click Run.</span></div>';
    return;
  }

  const result = sqlEngine.exec(query);
  if (result.success) {
    resultDiv.innerHTML = sqlEngine.renderResults(result.results);
  } else {
    resultDiv.innerHTML = `<div class="feedback feedback-error"><span class="feedback-icon">❌</span><span>Wrong! Check your syntax.</span></div>`;
  }
}

async function checkAnswer() {
  const q = currentQuestions[currentQuestionIndex];
  const userQuery = document.getElementById('practice-editor').value.trim();
  const feedbackDiv = document.getElementById('practice-feedback');
  const resultDiv = document.getElementById('practice-result');

  if (!userQuery) {
    feedbackDiv.innerHTML = '<div class="feedback feedback-info"><span class="feedback-icon">ℹ️</span><span>Please write a query first.</span></div>';
    return;
  }

  // Reset database to clean state before checking
  try {
    await sqlEngine.resetAndReload();
  } catch (e) {
    console.error('Failed to reset db:', e);
  }

  // Run user query
  const userResult = sqlEngine.exec(userQuery);
  if (!userResult.success) {
    feedbackDiv.innerHTML = `<div class="feedback feedback-error"><span class="feedback-icon">❌</span><div><strong>Wrong!</strong><br><span style="font-size:0.85em; opacity:0.7;">Check your syntax and try again.</span></div></div>`;
    resultDiv.innerHTML = '';
    return;
  }

  // Reset again and run expected query
  try {
    await sqlEngine.resetAndReload();
  } catch (e) {
    console.error('Failed to reset db:', e);
  }

  const expectedResult = sqlEngine.exec(q.expected_query);
  if (!expectedResult.success) {
    feedbackDiv.innerHTML = `<div class="feedback feedback-error"><span class="feedback-icon">⚠️</span><span>Error in expected query. Please report this issue.</span></div>`;
    return;
  }

  // Compare results
  const isCorrect = compareResults(userResult.results, expectedResult.results);

  // Show user's results
  resultDiv.innerHTML = sqlEngine.renderResults(userResult.results);

  const solveTime = Date.now() - questionStartTime;

  if (isCorrect) {
    feedbackDiv.innerHTML = `
      <div class="feedback feedback-success">
        <span class="feedback-icon">🎉</span>
        <div>
          <strong>Correct!</strong> Great job! Solved in <strong>${ProgressManager.formatTime(solveTime)}</strong>.
        </div>
      </div>
    `;
    await ProgressManager.saveQuestion(q.id, true, solveTime);
    await ProgressManager.saveClauseMastered(q.topic);
  } else {
    feedbackDiv.innerHTML = `
      <div class="feedback feedback-error">
        <span class="feedback-icon">❌</span>
        <div>
          <strong>Wrong!</strong> Try again!
          <div style="margin-top: 8px; font-size: 0.85rem; color: var(--text-muted);">
            <strong>Hint:</strong><br>
            <code style="font-family: var(--font-mono); color: var(--accent-cyan);">${escapeHtml(q.expected_query)}</code>
          </div>
        </div>
      </div>
    `;
    await ProgressManager.saveQuestion(q.id, false, solveTime);
  }

  // Show expected results below
  const expectedHtml = sqlEngine.renderResults(expectedResult.results);
  if (!isCorrect) {
    feedbackDiv.innerHTML += `
      <div style="margin-top: 12px;">
        <div style="font-size: 0.85rem; font-weight: 600; color: var(--text-muted); margin-bottom: 8px;">Expected Results:</div>
        ${expectedHtml}
      </div>
    `;
  }

  // Refresh activity chart
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

function prevQuestion() {
  if (currentQuestionIndex > 0) {
    currentQuestionIndex--;
    renderQuestion();
  }
}

function nextQuestion() {
  if (currentQuestionIndex < currentQuestions.length - 1) {
    currentQuestionIndex++;
    renderQuestion();
  }
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'Enter') {
    runPractice();
  }
});
