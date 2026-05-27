/**
 * Progress Page - Enhanced with Speed, Clauses Mastered, Daily Challenge
 */

// Use taxonomy if available, fallback to static list
const ALL_CLAUSES = (typeof ALL_CLAUSE_LIST !== 'undefined') ? ALL_CLAUSE_LIST : [
  'SELECT', 'DISTINCT', 'WHERE', 'AND', 'OR', 'NOT', 'LIKE', 'BETWEEN', 'IN',
  'IS NULL', 'ORDER BY', 'LIMIT', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX',
  'GROUP BY', 'HAVING', 'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'SELF JOIN',
  'CROSS JOIN', 'Subquery', 'EXISTS', 'IN Subquery', 'Correlated Subquery',
  'UNION', 'UNION ALL', 'CASE', 'INSERT', 'UPDATE', 'DELETE',
  'CREATE TABLE', 'ALTER TABLE', 'DROP TABLE', 'CREATE INDEX', 'CREATE VIEW',
  'ROW_NUMBER', 'RANK', 'DENSE_RANK', 'NTILE', 'LEAD', 'LAG',
  'Window Aggregates', 'String Functions', 'Date Functions',
  'Transactions'
];

let activeClauseFilter = 'all'; // Track currently active category filter

let allQuestions = [];
let dailyChallengeData = null;
let challengeQuestionStartTime = null;

document.addEventListener('DOMContentLoaded', async () => {
  // Merge all questions
  allQuestions = [
    ...QUESTIONS_DATA.easy,
    ...QUESTIONS_DATA.medium,
    ...QUESTIONS_DATA.hard
  ];

  // Render progress first (doesn't need SQL engine)
  try {
    await renderProgress();
  } catch (e) {
    console.error('Progress render failed:', e);
  }

  // Init SQL engine for daily challenge
  try {
    await sqlEngine.init();
    await sqlEngine.loadAllDatasets();
  } catch (e) {
    console.error('SQL engine init failed:', e);
  }

  try {
    await renderDailyChallenge();
  } catch (e) {
    console.error('Daily challenge render failed:', e);
  }
  
  setupEventListeners();
});

// ===== CLAUSES MASTERED (Taxonomy-Driven) =====
function renderClausesMastered(progress) {
  const mastered = progress.clausesMastered || [];
  const grid = document.getElementById('clauses-grid');
  const countEl = document.getElementById('clauses-count');
  const filtersEl = document.getElementById('clause-category-filters');
  
  if (countEl) countEl.textContent = `${mastered.length} / ${ALL_CLAUSES.length} mastered`;

  // Render category filter toggles
  if (filtersEl && typeof SQL_CLAUSE_TAXONOMY !== 'undefined') {
    let filtersHtml = `<button class="clause-category-toggle ${activeClauseFilter === 'all' ? 'active' : ''}" data-filter="all">🔖 ALL</button>`;
    for (const [key, cat] of Object.entries(SQL_CLAUSE_TAXONOMY)) {
      const catMastered = cat.clauses.filter(c => mastered.includes(c)).length;
      const badge = catMastered === cat.clauses.length ? ' ✓' : ` ${catMastered}/${cat.clauses.length}`;
      filtersHtml += `<button class="clause-category-toggle ${activeClauseFilter === key ? 'active' : ''}" data-filter="${key}">${cat.label}${badge}</button>`;
    }
    filtersEl.innerHTML = filtersHtml;

    // Attach click handlers
    filtersEl.querySelectorAll('.clause-category-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        activeClauseFilter = btn.dataset.filter;
        renderClausesMastered(progress);
      });
    });
  }

  // Filter clauses by active category
  let clausesToShow = ALL_CLAUSES;
  if (activeClauseFilter !== 'all' && typeof SQL_CLAUSE_TAXONOMY !== 'undefined') {
    const cat = SQL_CLAUSE_TAXONOMY[activeClauseFilter];
    if (cat) clausesToShow = cat.clauses;
  }

  if (grid) {
    grid.innerHTML = clausesToShow.map(clause => {
      const isMastered = mastered.includes(clause);
      return `<span class="clause-chip ${isMastered ? 'mastered' : 'locked'}">
        ${isMastered ? '✓' : '🔒'} ${clause}
      </span>`;
    }).join('');
  }

  // Render weak areas
  renderWeakAreas(progress);
}

// ===== WEAK AREAS =====
function renderWeakAreas(progress) {
  const container = document.getElementById('weak-areas-container');
  const countEl = document.getElementById('weak-areas-count');
  if (!container) return;

  const mastered = progress.clausesMastered || [];

  if (typeof SQL_CLAUSE_TAXONOMY === 'undefined' || typeof getWeakAreas !== 'function') {
    container.innerHTML = '<div style="color:#718096; font-size:0.85rem;">Taxonomy data not loaded.</div>';
    return;
  }

  const weakAreas = getWeakAreas(mastered);
  const weakCategories = Object.entries(weakAreas);
  
  if (countEl) {
    const totalCats = Object.keys(SQL_CLAUSE_TAXONOMY).length;
    const fullCats = totalCats - weakCategories.length;
    countEl.textContent = `${fullCats} / ${totalCats} categories complete`;
  }

  if (weakCategories.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:20px; color:#15803d; font-weight:700; font-size:0.95rem;">
        🏆 You've mastered ALL clause categories! Incredible work!
      </div>`;
    return;
  }

  container.innerHTML = weakCategories.map(([key, data]) => {
    const pct = Math.round((data.mastered / data.total) * 100);
    const barClass = pct >= 70 ? 'green' : pct >= 30 ? 'yellow' : 'red';
    const unmasteredPreview = data.unmastered.slice(0, 3).join(', ');
    const moreCount = data.unmastered.length > 3 ? ` +${data.unmastered.length - 3} more` : '';

    return `
      <div class="weak-area-item">
        <div class="weak-area-label">${data.label}</div>
        <div class="weak-area-bar-track">
          <div class="weak-area-bar-fill ${barClass}" style="width:${pct}%"></div>
        </div>
        <div class="weak-area-stat">${data.mastered}/${data.total}</div>
      </div>
      <div style="margin:-6px 0 14px 196px; font-size:0.68rem; color:#a0a8b4; font-weight:600;">
        Missing: ${unmasteredPreview}${moreCount}
      </div>`;
  }).join('');
}

function setupEventListeners() {
  const resetBtn = document.getElementById('reset-btn');
  if (resetBtn) resetBtn.addEventListener('click', confirmReset);

  // Profile Edit
  const editBtn = document.getElementById('edit-name-btn');
  const saveBtn = document.getElementById('save-name-btn');
  const cancelBtn = document.getElementById('cancel-name-btn');
  const nameInput = document.getElementById('user-name-input');
  const displayArea = document.getElementById('username-display-area');
  const inputArea = document.getElementById('name-input-area');

  if (editBtn && saveBtn && cancelBtn) {
    editBtn.addEventListener('click', () => {
      displayArea.style.display = 'none';
      inputArea.style.display = 'flex';
      ProgressManager.getProgress().then(p => {
        nameInput.value = p.userName || '';
        nameInput.focus();
      });
    });

    saveBtn.addEventListener('click', async () => {
      const newName = nameInput.value.trim();
      if (newName) {
        await ProgressManager.saveUserName(newName);
        inputArea.style.display = 'none';
        displayArea.style.display = 'flex';
        
        // Show mini-feedback
        const feedback = document.createElement('div');
        feedback.textContent = '>_ NAME_REGISTERED_SUCCESSFULLY';
        feedback.style.cssText = 'position:fixed; bottom:30px; left:50%; transform:translateX(-50%); background:var(--bg-secondary); color:var(--accent-primary); padding:12px 24px; border:1px solid var(--accent-primary); font-family:var(--font-mono); font-size:0.8rem; z-index:1000; animation:slideUp 0.3s ease;';
        document.body.appendChild(feedback);
        setTimeout(() => feedback.remove(), 2500);
        
        renderProgress(); // Re-render to update UI
      }
    });

    cancelBtn.addEventListener('click', () => {
      inputArea.style.display = 'none';
      displayArea.style.display = 'flex';
    });
  }

  // Delegate daily challenge actions
  const dailyContent = document.getElementById('daily-challenge-content');
  if (dailyContent) {
    dailyContent.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;

      const action = btn.dataset.action;
      const qId = parseInt(btn.dataset.id);

      if (action === 'show-hint') showDailyHint(qId);
      if (action === 'run-query') runDailyQuery(qId);
      if (action === 'check-answer') checkDailyAnswer(qId);
      if (action === 'toggle-preview') toggleDailyPreview(qId, btn.dataset.table);
    });
  }
}

async function toggleDailyPreview(qId, tableName) {
  const container = document.getElementById(`daily-preview-${qId}`);
  if (!container) return;

  if (container.style.display === 'none') {
    container.style.display = 'block';
    container.innerHTML = '<div style="padding:10px; font-size:0.8rem; color:#b86a7c; font-weight:700;">FETCHING_DATA...</div>';
    
    try {
      const result = sqlEngine.exec(`SELECT * FROM ${tableName} LIMIT 3`);
      const schema = sqlEngine.exec(`PRAGMA table_info(${tableName})`);
      
      if (result.success && schema.success) {
        const cols = schema.results[0].values.map(v => v[1]).join(', ');
        container.innerHTML = `
          <div style="padding:10px; border-bottom:1.5px solid #f2e7de; background:#fffdf9;">
            <div style="font-size:0.65rem; font-weight:800; color:#718096; letter-spacing:1px; margin-bottom:4px;">COLUMN_MAP</div>
            <div style="font-size:0.75rem; color:#b86a7c; font-family:'JetBrains Mono',monospace; word-break:break-all;">${cols}</div>
          </div>
          <div style="padding:5px;">
            ${sqlEngine.renderResults(result.results)}
          </div>
        `;
        // Compact the preview results
        container.querySelectorAll('.result-container').forEach(r => {
            r.style.marginTop = '5px';
            r.style.boxShadow = 'none';
            r.querySelector('.result-stats').style.fontSize = '0.6rem';
        });
      } else {
        container.innerHTML = '<div style="padding:10px; color:#e53e3e;">Failed to load preview.</div>';
      }
    } catch (e) {
      container.innerHTML = '<div style="padding:10px; color:#e53e3e;">Engine Error.</div>';
    }
  } else {
    container.style.display = 'none';
  }
}

// ===== MAIN PROGRESS RENDER =====
async function renderProgress() {
  const p = await ProgressManager.getProgress();
  
  // Update Profile
  const nameEl = document.getElementById('display-name');
  const avatarEl = document.getElementById('user-avatar');
  if (nameEl) {
    if (p.userName) {
      nameEl.textContent = `Welcome, ${p.userName}!`;
      if (avatarEl && avatarEl.tagName !== 'IMG') avatarEl.textContent = p.userName.charAt(0).toUpperCase();
    } else {
      nameEl.textContent = "Welcome, Learner!";
      if (avatarEl && avatarEl.tagName !== 'IMG') avatarEl.textContent = "?";
    }
  }

  // Calculate totals
  let totalTopics = 0;
  LESSONS_DATA.categories.forEach(c => totalTopics += c.topics.length);

  const topicsDone = p.topicsCompleted.length;
  const questionsSolved = p.questionsSolved || 0;
  const attempted = p.questionsAttempted || 0;
  const accuracy = attempted > 0 ? Math.round((questionsSolved / attempted) * 100) : 0;
  const overallPct = totalTopics > 0 ? Math.round((topicsDone / totalTopics) * 100) : 0;
  const speed = ProgressManager.getSpeedStats(p);

  // Stats cards
  const progTopics = document.getElementById('prog-topics');
  if (progTopics) progTopics.textContent = topicsDone;

  const progQuestions = document.getElementById('prog-questions');
  if (progQuestions) progQuestions.textContent = questionsSolved;

  const progAccuracy = document.getElementById('prog-accuracy');
  if (progAccuracy) progAccuracy.textContent = accuracy + '%';

  const progSpeed = document.getElementById('prog-speed');
  if (progSpeed) progSpeed.textContent = ProgressManager.formatTime(speed.avg);

  // Accuracy section
  const bigAcc = document.getElementById('accuracy-big');
  if (bigAcc) {
    bigAcc.textContent = accuracy + '%';
    bigAcc.style.color =
      accuracy >= 80 ? 'var(--accent-green-light)' :
      accuracy >= 50 ? 'var(--accent-orange)' : 'var(--accent-red)';
  }

  const accCorrect = document.getElementById('acc-correct');
  if (accCorrect) accCorrect.textContent = questionsSolved;

  const accWrong = document.getElementById('acc-wrong');
  if (accWrong) accWrong.textContent = Math.max(0, attempted - questionsSolved);

  const accAttempted = document.getElementById('acc-attempted');
  if (accAttempted) accAttempted.textContent = attempted;

  // Speed section
  const speedAvgVal = document.getElementById('speed-avg-val');
  if (speedAvgVal) speedAvgVal.textContent = ProgressManager.formatTime(speed.avg);

  const speedFastVal = document.getElementById('speed-fast-val');
  if (speedFastVal) speedFastVal.textContent = ProgressManager.formatTime(speed.fastest);

  const speedTotalVal = document.getElementById('speed-total-val');
  if (speedTotalVal) speedTotalVal.textContent = ProgressManager.formatTime(speed.total);

  const speedCount = document.getElementById('speed-count');
  if (speedCount) speedCount.textContent = speed.count;

  // Speed bars (invert: faster = more bar)
  const MAX_SPEED_MS = 60000;
  const avgPct = speed.avg > 0 ? Math.max(5, 100 - (speed.avg / MAX_SPEED_MS) * 100) : 0;
  const fastPct = speed.fastest > 0 ? Math.max(5, 100 - (speed.fastest / MAX_SPEED_MS) * 100) : 0;
  const avgBar = document.getElementById('speed-avg-bar');
  const fastBar = document.getElementById('speed-fast-bar');
  if (avgBar) avgBar.style.width = avgPct + '%';
  if (fastBar) fastBar.style.width = fastPct + '%';

  // Overall progress
  const progPctEl = document.getElementById('progress-pct');
  if (progPctEl) progPctEl.textContent = overallPct + '%';

  const progBar = document.getElementById('progress-bar');
  if (progBar) progBar.style.width = overallPct + '%';

  const progDetail = document.getElementById('progress-detail');
  if (progDetail) {
    progDetail.textContent =
      `${topicsDone} of ${totalTopics} topics completed · ${questionsSolved} questions solved · ${ProgressManager.formatTime(speed.total)} total practice time`;
  }

  // Clauses mastered
  renderClausesMastered(p);

  // Category progress
  renderCategoryProgress(p);

  // Activity chart
  ProgressManager.renderActivityChart('activity-chart-container', p);

  // Completed topics
  renderCompletedList(p);
}


// (renderClausesMastered is defined above — taxonomy-driven version)

// ===== DAILY CHALLENGE =====
async function renderDailyChallenge() {
  const progress = await ProgressManager.getProgress();
  dailyChallengeData = await ProgressManager.getDailyChallenge(allQuestions);
  
  const card = document.getElementById('daily-challenge-card');
  const content = document.getElementById('daily-challenge-content');
  const streakBadge = document.getElementById('streak-badge');
  const statusIcon = document.getElementById('daily-status-icon');

  // Streak
  const streak = progress.streak || 0;
  if (streakBadge) streakBadge.textContent = `_STREAK: ${streak} D ♥`;

  if (dailyChallengeData.completed) {
    if (card) card.classList.add('completed');
    if (statusIcon) statusIcon.innerHTML = `
      <div style="font-size: 3.5rem; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));">🏆</div>
    `;
    if (content) content.innerHTML = `
      <div class="congrats-banner" style="text-align:center; padding: 40px 20px;">
        <h3 style="color:#b86a7c; font-size: 1.5rem; margin-bottom: 15px;">🎉 Challenge Clear!</h3>
        <p style="color:#2c3e50; font-size: 0.95rem;">You've mastered all 3 queries for today. Come back tomorrow!</p>
      </div>
      <div style="margin-top:20px;">
        ${renderDailyChallengeQuestions(dailyChallengeData, true)}
      </div>
    `;
  } else {
    // Hourglass status
    if (statusIcon) statusIcon.innerHTML = `
      <svg width="80" height="80" viewBox="0 0 100 100">
        <path d="M 15 25 L 18 15 L 21 25 L 31 28 L 21 31 L 18 41 L 15 31 L 5 28 Z" fill="#fff9d6" stroke="#2d3748" stroke-width="1.5"/>
        <path d="M 85 45 L 87 38 L 89 45 L 96 47 L 89 49 L 87 56 L 85 49 L 78 47 Z" fill="#fff9d6" stroke="#2d3748" stroke-width="1.5"/>
        <path d="M 80 80 L 82 75 L 84 80 L 89 82 L 84 84 L 82 89 L 80 84 L 75 82 Z" fill="#fff9d6" stroke="#2d3748" stroke-width="1.5"/>
        <path d="M 20 85 L 22 81 L 24 85 L 28 87 L 24 89 L 22 93 L 20 89 L 16 87 Z" fill="#fff9d6" stroke="#2d3748" stroke-width="1.5"/>
        <rect x="35" y="15" width="30" height="6" rx="3" fill="#cfe6f5" stroke="#2d3748" stroke-width="2.5"/>
        <rect x="35" y="79" width="30" height="6" rx="3" fill="#cfe6f5" stroke="#2d3748" stroke-width="2.5"/>
        <path d="M 38 21 C 38 35 48 42 48 50 C 48 58 38 65 38 79 L 62 79 C 62 65 52 58 52 50 C 52 42 62 35 62 21 Z" fill="#fffbfc" stroke="#2d3748" stroke-width="2.5" fill-opacity="0.9"/>
        <path d="M 40 38 C 42 45 46 47 48 50 C 50 47 54 45 56 38 Z" fill="#efa9bc"/>
        <path d="M 42 79 C 42 68 45 61 48 61 C 51 61 54 68 54 79 Z" fill="#efa9bc"/>
        <rect x="49" y="48" width="2" height="15" fill="#efa9bc"/>
      </svg>
    `;
    
    if (content) content.innerHTML = `
      <div id="daily-questions-list">
        ${renderDailyChallengeQuestions(dailyChallengeData, false)}
      </div>
    `;
  }
}

function renderDailyChallengeQuestions(challenge, isCompleted) {
  return challenge.questions.map((qRef, i) => {
    const q = allQuestions.find(aq => aq.id === qRef.id);
    if (!q) return '';

    const isSolved = qRef.solved;

    if (isCompleted || isSolved) {
      return `
        <div class="daily-q-item solved" style="background-color: #f1f8e9; border: 1.5px solid #c5e1a5; border-radius: 16px; padding: 20px; margin-bottom: 15px; display: flex; align-items: center; gap: 15px;">
          <div style="background:#8bbca0; color:white; width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:700;">✓</div>
          <div style="flex:1;">
            <div style="font-weight:600; font-size:0.95rem; color:#2d3748;">${q.question}</div>
            <div style="font-size:0.75rem; color:#8bbca0; font-weight:700; margin-top:2px;">CLEARED! LVL_${q.difficulty.toUpperCase()}</div>
          </div>
        </div>
      `;
    }

    return `
      <div style="background-color: #d8edfa; border-radius: 20px; padding: 25px; border: 1px solid #c8e0f0; box-shadow: inset 0 2px 5px rgba(255,255,255,0.5); margin-bottom: 30px;">
        <div style="background-color: #fffcfa; border-radius: 16px; padding: 30px; border: 1.5px solid #dcdbe3; position: relative;">
          
          <div style="font-size: 0.9rem; color: #4a5568; margin-bottom: 5px;">[${i + 1}]</div>
          <div style="font-size: 1.05rem; color: #1a202c; font-weight: 500; margin-bottom: 12px; font-family: 'JetBrains Mono', monospace;">${q.question}</div>
          
          <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 25px;">
            <div style="font-size: 0.7rem; background: #eaebf2; border-radius: 6px; padding: 4px 10px; color: #4a5568; font-weight: 700;">
              LVL_${q.difficulty.toUpperCase()} - ${q.topic.toUpperCase()}
            </div>
            <button class="btn-preview" data-action="toggle-preview" data-id="${q.id}" data-table="${q.dataset}" style="background: #fdfaf7; border: 1.5px solid #eae1d7; border-radius: 8px; padding: 6px 14px; font-family: 'JetBrains Mono', monospace; font-size: 0.75rem; font-weight: 800; color: #b86a7c; cursor: pointer; transition: all 0.2s; box-shadow: 0 2px 0 #eae1d7; display: flex; align-items: center; gap: 6px;">
              <span>🔍</span> VIEW_DATA: [${q.dataset.toUpperCase()}]
            </button>
          </div>

          <!-- Table Preview Area -->
          <div id="daily-preview-${q.id}" style="display:none; margin-bottom: 25px; max-height: 200px; overflow: auto; border-radius: 12px; border: 1.5px solid #f2e7de; background: #ffffff;"></div>

          <!-- Code input area -->
          <div style="background-color: #373e47; border-radius: 12px; overflow: hidden; margin-bottom: 25px; border: 1.5px solid #2d323a;">
            <div style="padding: 12px 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.05);">
              <div style="color: #92a4bd; font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; font-weight: 600;">>_ SOLUTION_INPUT</div>
              <div style="display: flex; gap: 8px;">
                <button style="background-color: rgba(178, 173, 213, 0.2); border: 1px solid #b2add5; border-radius: 6px; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; color: #b2add5; font-weight: 700; font-family: 'JetBrains Mono', monospace; font-size: 1rem; cursor: pointer;" 
                  data-action="show-hint" data-id="${q.id}">?</button>
                <button style="background-color: #fae0cd; border: none; border-radius: 6px; padding: 0 12px; height: 28px; display: flex; align-items: center; justify-content: center; gap: 6px; color: #322b2b; font-weight: 700; font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; cursor: pointer; box-shadow: 0 2px 0 #d9c0af;"
                  data-action="run-query" data-id="${q.id}">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  run
                </button>
              </div>
            </div>
            
            <textarea class="sql-editor" id="daily-editor-${q.id}" 
              style="width: 100%; height: 120px; outline: none; border: none; display: block;"
              placeholder="Enter your SQL query here..."></textarea>
          </div>

          <div id="daily-result-${q.id}" style="margin-top:10px; overflow-x:auto;"></div>
          <div id="daily-feedback-${q.id}" style="margin-top:10px;"></div>

          <!-- Bottom Controls -->
          <div style="display: flex; justify-content: flex-end; margin-top: 15px;">
            <button style="background-color: #c0ebd0; border: 1.5px solid #9dcdae; border-radius: 10px; padding: 10px 30px; height: 42px; display: flex; align-items: center; justify-content: center; gap: 10px; color: #437653; font-weight: 800; font-family: 'JetBrains Mono', monospace; font-size: 1rem; cursor: pointer; box-shadow: 0 4px 0 #9dcdae;"
              data-action="check-answer" data-id="${q.id}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              SUBMIT ANSWER
            </button>
          </div>

          <div class="hint-box" id="daily-hint-${q.id}" style="margin-top: 20px; padding: 15px; background: #fffbe6; border: 1px dashed #ffe58f; border-radius: 12px; font-size: 0.85rem; color: #856404; display: none;">
            💡 <strong>Hint:</strong> ${q.hint}
          </div>

        </div>
        <div style="height: 25px;"></div>
      </div>
    `;
  }).join('');
}

function showDailyHint(qId) {
  const hint = document.getElementById(`daily-hint-${qId}`);
  if (hint) hint.classList.add('visible');
}

function runDailyQuery(qId) {
  const editor = document.getElementById(`daily-editor-${qId}`);
  const resultDiv = document.getElementById(`daily-result-${qId}`);
  if (!editor || !resultDiv) return;

  const query = editor.value.trim();
  if (!query) {
    resultDiv.innerHTML = '<div class="feedback feedback-info"><span class="feedback-icon">ℹ️</span><span>Write a query and click Run.</span></div>';
    return;
  }

  if (!sqlEngine || !sqlEngine.db) {
    resultDiv.innerHTML = '<div class="feedback feedback-info"><span class="feedback-icon">⏳</span><span>SQL Engine is loading. Please wait...</span></div>';
    return;
  }

  const result = sqlEngine.exec(query);
  if (result.success) {
    resultDiv.innerHTML = sqlEngine.renderResults(result.results);
  } else {
    resultDiv.innerHTML = `<div class="feedback feedback-error"><span class="feedback-icon">❌</span><span>Wrong! Check your syntax.</span></div>`;
  }
}

async function checkDailyAnswer(qId) {
  const q = allQuestions.find(aq => aq.id === qId);
  if (!q) return;

  const editor = document.getElementById(`daily-editor-${qId}`);
  const feedbackDiv = document.getElementById(`daily-feedback-${qId}`);
  const resultDiv = document.getElementById(`daily-result-${qId}`);
  if (!editor || !feedbackDiv) return;

  const userQuery = editor.value.trim();
  if (!userQuery) {
    feedbackDiv.innerHTML = '<div class="feedback feedback-info"><span class="feedback-icon">ℹ️</span><span>Please write a query first.</span></div>';
    return;
  }

  if (!sqlEngine || !sqlEngine.db) {
    feedbackDiv.innerHTML = '<div class="feedback feedback-info"><span class="feedback-icon">⏳</span><span>SQL Engine is loading...</span></div>';
    return;
  }

  const solveTime = challengeQuestionStartTime ? Date.now() - challengeQuestionStartTime : 0;

  // Reset and run user query
  try { await sqlEngine.resetAndReload(); } catch(e) {}
  const userResult = sqlEngine.exec(userQuery);
  if (!userResult.success) {
    feedbackDiv.innerHTML = `<div class="feedback feedback-error"><span class="feedback-icon">❌</span><div><strong>Wrong!</strong><br><span style="font-size:0.85em; opacity:0.7;">Check your syntax and try again.</span></div></div>`;
    resultDiv.innerHTML = '';
    return;
  }

  // Reset and run expected query
  try { await sqlEngine.resetAndReload(); } catch(e) {}
  const expectedResult = sqlEngine.exec(q.expected_query);

  resultDiv.innerHTML = sqlEngine.renderResults(userResult.results);

  // Compare
  const isCorrect = compareResults(userResult.results, expectedResult.results);

  if (isCorrect) {
    feedbackDiv.innerHTML = `<div class="feedback feedback-success"><span class="feedback-icon">🎉</span><div><strong>Correct!</strong> Solved in <strong>${ProgressManager.formatTime(solveTime)}</strong></div></div>`;
    await ProgressManager.saveQuestion(q.id, true, solveTime);
    await ProgressManager.saveClauseMastered(q.topic);
    // Save all detected clauses from the expected query
    if (typeof detectClausesFromSQL === 'function') {
      const allClauses = detectClausesFromSQL(q.expected_query);
      for (const clause of allClauses) {
        await ProgressManager.saveClauseMastered(clause);
      }
    }
    await ProgressManager.solveDailyChallengeQuestion(q.id);

    // Refresh the challenge UI
    setTimeout(async () => {
      await renderDailyChallenge();
      await renderProgress();
    }, 800);
  } else {
    feedbackDiv.innerHTML = `<div class="feedback feedback-error"><span class="feedback-icon">❌</span><div>
      <strong>Wrong!</strong> Your results don't match the expected output.
      <div style="margin-top:6px; font-size:0.85rem; color:var(--text-muted);"><strong>Expected:</strong><br>
        <code style="font-family:var(--font-mono); color:var(--accent-cyan);">${escapeHtml(q.expected_query)}</code>
      </div>
    </div></div>`;
    await ProgressManager.saveQuestion(q.id, false, solveTime);
  }
}

function compareResults(userResults, expectedResults) {
  if (!userResults && !expectedResults) return true;
  if (!userResults || !expectedResults) return false;
  if (userResults.length !== expectedResults.length) return false;
  for (let i = 0; i < userResults.length; i++) {
    const ur = userResults[i], er = expectedResults[i];
    if (ur.columns.length !== er.columns.length) return false;

    // Case-insensitive column name matching (order-independent)
    const uColsLower = ur.columns.map(c => c.toLowerCase());
    const eColsLower = er.columns.map(c => c.toLowerCase());
    const uColSet = [...uColsLower].sort();
    const eColSet = [...eColsLower].sort();
    for (let c = 0; c < uColSet.length; c++) {
      if (uColSet[c] !== eColSet[c]) return false;
    }

    // Map user columns to expected column order
    const colMap = [];
    const used = new Set();
    for (let ec = 0; ec < eColsLower.length; ec++) {
      const idx = uColsLower.findIndex((col, ci) => col === eColsLower[ec] && !used.has(ci));
      if (idx === -1) return false;
      colMap[ec] = idx;
      used.add(idx);
    }

    if (ur.values.length !== er.values.length) return false;

    // Reorder user row values to match expected column order, then compare
    const reorder = (row) => colMap.map(idx => row[idx]);
    const uSorted = [...ur.values].map(r => reorder(r).map(String).join('|')).sort();
    const eSorted = [...er.values].map(r => r.map(String).join('|')).sort();
    for (let j = 0; j < uSorted.length; j++) {
      if (uSorted[j] !== eSorted[j]) return false;
    }
  }
  return true;
}

// ===== CATEGORY PROGRESS =====
function renderCategoryProgress(progress) {
  const container = document.getElementById('category-progress');
  if (!container) return;
  container.innerHTML = LESSONS_DATA.categories.map(cat => {
    const completedCount = cat.topics.filter(t => progress.topicsCompleted.includes(t.id)).length;
    const totalCount = cat.topics.length;
    const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return `
      <div style="margin-bottom: 24px;">
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom: 12px;">
          <span style="font-weight: 800; font-size: 1rem; color: var(--text-primary);">${cat.icon} ${cat.name}</span>
          <span style="font-weight: 700; font-size: 0.85rem; color:${pct === 100 ? 'var(--accent-green-light)' : 'var(--text-muted)'};">${completedCount} / ${totalCount} ${pct === 100 ? '⭐' : ''}</span>
        </div>
        <div style="height: 10px; background:var(--bg-input); border-radius: 5px; overflow:hidden;">
          <div style="height:100%; border-radius: 5px; width:${pct}%;
            background: ${pct === 100 ? 'var(--gradient-success)' : pct > 0 ? 'var(--gradient-primary)' : 'transparent'};
            transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);"></div>
        </div>
      </div>
    `;
  }).join('');
}

// ===== COMPLETED TOPICS =====
function renderCompletedList(progress) {
  const container = document.getElementById('completed-list');
  const countEl = document.getElementById('completed-count');

  if (!container || !countEl) return;
  countEl.textContent = `${progress.topicsCompleted.length} topics`;

  if (progress.topicsCompleted.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding:24px;">
        <div class="empty-state-icon">📝</div>
        <div class="empty-state-title">No Modules Mastered Yet</div>
        <div class="empty-state-description">Dive into the interactive learning path to start earning module badges and building your portfolio.</div>
      </div>`;
    return;
  }

  const topicDetails = [];
  for (const topicId of progress.topicsCompleted) {
    for (const cat of LESSONS_DATA.categories) {
      const topic = cat.topics.find(t => t.id === topicId);
      if (topic) {
        topicDetails.push({ ...topic, categoryName: cat.name, categoryIcon: cat.icon });
        break;
      }
    }
  }

  container.innerHTML = `
    <div style="display:flex; flex-wrap:wrap; gap: 12px; margin-top: 16px;">
      ${topicDetails.map(t => `
        <span style="display:inline-flex; align-items:center; gap: 8px; padding: 8px 16px;
          background: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.2);
          border-radius: 24px; font-size: 0.9rem; font-weight: 700; color: var(--accent-green-light);
          box-shadow: 0 4px 10px rgba(16, 185, 129, 0.05);">
          ✅ ${t.title}
        </span>
      `).join('')}
    </div>
  `;
}

async function confirmReset() {
  if (confirm('Are you sure you want to reset ALL progress? This includes daily challenge streaks, speed data, and mastered clauses. This cannot be undone.')) {
    await ProgressManager.resetProgress();
    await renderProgress();
    await renderDailyChallenge();
  }
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'Enter') {
    const active = document.querySelector('.sql-editor:focus');
    if (active && active.id.startsWith('daily-editor-')) {
      const qId = parseInt(active.id.replace('daily-editor-', ''));
      runDailyQuery(qId);
    }
  }
});
