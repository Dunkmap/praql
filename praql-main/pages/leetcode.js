/**
 * LEETCODE — SQL Guesser
 * Read a question, guess which SQL clauses are needed.
 * Scoring, streak, difficulty filter, answer reveal.
 */

// Game state
let lcQuestions = [];
let lcFiltered = [];
let lcCurrentIdx = 0;
let lcSelectedClauses = new Set();
let lcAnswered = false;

// Session stats
let lcStreak = 0;
let lcScore = 0;
let lcCorrectCount = 0;
let lcDifficulty = 'captured';
let lcCapturedFilter = 'ALL';

// The clause pool shown for each question (mix of correct + distractors)
const CLAUSE_POOL_ITEMS = [
  'SELECT', 'FROM', 'WHERE', 'GROUP BY', 'HAVING', 'ORDER BY', 'LIMIT',
  'DISTINCT', 'AS', 'IN', 'NOT IN', 'BETWEEN', 'LIKE', 'IS NULL', 'IS NOT NULL',
  'EXISTS', 'NOT EXISTS',
  'JOIN', 'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'CROSS JOIN', 'ON',
  'COUNT', 'SUM', 'AVG', 'MIN', 'MAX',
  'OVER', 'PARTITION BY', 'ROW_NUMBER', 'RANK', 'DENSE_RANK', 'LAG', 'LEAD',
  'WITH', 'Subquery',
  'UNION', 'UNION ALL',
  'CASE', 'COALESCE', 'IFNULL',
  'INSERT', 'UPDATE', 'DELETE',
  'CREATE TABLE', 'ALTER TABLE',
  'GROUP_CONCAT', 'OFFSET'
];

document.addEventListener('DOMContentLoaded', async () => {
  // Build question list
  lcQuestions = [
    ...QUESTIONS_DATA.easy.map(q => ({ ...q, difficulty: 'easy' })),
    ...QUESTIONS_DATA.medium.map(q => ({ ...q, difficulty: 'medium' })),
    ...QUESTIONS_DATA.hard.map(q => ({ ...q, difficulty: 'hard' }))
  ];

  // Shuffle
  lcQuestions.sort(() => Math.random() - 0.5);

  // Legacy Stats skipped for Vault Mode
  // Load init settings
  const settingsBox = document.getElementById('lc-api-settings-container');
  if (settingsBox) settingsBox.style.display = 'block';
  const currentKey = localStorage.getItem('groqApiKey') || '';
  if (document.getElementById('global-lc-api-key')) document.getElementById('global-lc-api-key').value = currentKey;
  if (!currentKey && typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.local.get(['groqApiKey'], (res) => {
      if (res.groqApiKey && document.getElementById('global-lc-api-key')) document.getElementById('global-lc-api-key').value = res.groqApiKey;
    });
  }

  // Bind clause filter
  const filterSelect = document.getElementById('lc-clause-filter');
  if (filterSelect) {
    filterSelect.addEventListener('change', async (e) => {
      lcCapturedFilter = e.target.value;
      await applyFilter();
      renderQuestion();
    });
  }

  try {
     await applyFilter();
     setupActionButtons();
     renderQuestion();
  } catch (e) {
     console.error("Initialization error:", e);
     if (document.getElementById('lc-question-text')) {
        document.getElementById('lc-question-text').innerHTML = `<div style="padding:40px; text-align:center; color:#fca5a5; font-weight:800;">❌ INITIALIZATION FAILED.</div>`;
     }
  }
});

async function saveStatsToStorage() {
  if (typeof ProgressManager !== 'undefined' && typeof ProgressManager.saveLeetcodeStats === 'function') {
    await ProgressManager.saveLeetcodeStats({
      score: lcScore,
      streak: lcStreak,
      attempted: lcAttempted,
      correct: lcCorrectCount
    });
  }
}

// ===== FILTERING =====
async function applyFilter() {
  const container = document.getElementById('lc-challenge-card');
  const clauseFilterObj = document.getElementById('lc-clause-filter');
  
  let rawFiltered = [];
  if (lcDifficulty === 'captured') {
     try {
       if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
         const res = await new Promise(r => chrome.storage.local.get({ capturedLeetCode: [] }, r));
         
         const allClauses = new Set();
         (res.capturedLeetCode || []).forEach(q => {
            const actual = q.expected_query && typeof detectClausesFromSQL === 'function' ? detectClausesFromSQL(q.expected_query) : (q.categories || q.detectedClauses || []);
            actual.forEach(c => allClauses.add(c));
         });
         
         if (clauseFilterObj) {
            const sortedClauses = Array.from(allClauses).sort();
            clauseFilterObj.innerHTML = `<option value="ALL">ALL CLAUSES</option>` + 
               sortedClauses.map(c => `<option value="${c}" ${lcCapturedFilter === c ? 'selected' : ''}>${c}</option>`).join('');
         }

         let sourceList = (res.capturedLeetCode || []).map(q => ({ ...q, difficulty: 'captured' }));
         
         if (lcCapturedFilter !== 'ALL') {
            sourceList = sourceList.filter(q => {
               const actual = q.expected_query && typeof detectClausesFromSQL === 'function' ? detectClausesFromSQL(q.expected_query) : (q.categories || q.detectedClauses || []);
               return actual.includes(lcCapturedFilter);
            });
         }
         rawFiltered = sourceList;
       }
     } catch (e) {
       console.error("Storage error:", e);
     }
     lcFiltered = rawFiltered;
  } else {
    // ... not reachable but kept for sanity
    lcFiltered = [...lcQuestions];
  }

  if (lcFiltered.length === 0 && lcDifficulty === 'captured') {
    document.getElementById('lc-question-text').innerHTML = `
      <div style="text-align:center; padding:40px; color:#718096;">
        <div style="font-size:3rem; margin-bottom:15px;">📦</div>
        <strong>NO QUESTIONS FOUND!</strong><br>
        <div style="font-size:0.8rem; margin-top:8px;">${lcCapturedFilter !== 'ALL' ? 'No captured questions match the selected clause filter.' : 'Open any SQL problem on LeetCode.com and it will be automatically saved here.'}</div>
      </div>`;
    // Hide game/reveal ui
    hideAllGameUI();
    return;
  }

  lcCurrentIdx = 0;
}

function hideAllGameUI() {
  document.getElementById('lc-clause-pool').style.display = 'none';
  document.getElementById('lc-picks-zone').style.display = 'none';
  document.getElementById('lc-game-actions').style.display = 'none';
  document.getElementById('lc-captured-nav').style.display = 'none';
  document.getElementById('lc-feedback').style.display = 'none';
  document.getElementById('lc-answer-reveal').style.display = 'none';
  document.querySelectorAll('.lc-guess-section-label').forEach(el => el.style.display = 'none');
   // No game UI in Vault Mode
}

function setupDifficultyButtons() {
  const filterSelect = document.getElementById('lc-clause-filter');
  if (filterSelect) {
    filterSelect.addEventListener('change', async (e) => {
      lcCapturedFilter = e.target.value;
      await applyFilter();
      renderQuestion();
    });
  }
}

// ===== RENDER QUESTION =====
function renderQuestion() {
  if (lcFiltered.length === 0) {
    document.getElementById('lc-question-text').textContent = 'No questions available for this difficulty.';
    return;
  }

  const q = lcFiltered[lcCurrentIdx % lcFiltered.length];
  lcSelectedClauses.clear();
  lcAnswered = false;

  // Header
  document.getElementById('lc-q-number').textContent = `CHALLENGE #${lcCurrentIdx + 1}`;
  const diffEl = document.getElementById('lc-q-diff');
  diffEl.textContent = q.difficulty.toUpperCase();
  diffEl.className = `lc-q-diff ${q.difficulty}`;
  document.getElementById('lc-topic-tag').textContent = q.topic || '—';
  document.getElementById('lc-progress-text').textContent = `${lcCurrentIdx + 1} / ${lcFiltered.length}`;

  // Question content rendering
  const questionContainer = document.getElementById('lc-question-text');
  
  if (q.source === 'LeetCode') {
    questionContainer.innerHTML = formatLeetCodeQuestionStr(q.question, q.title, q.url);
    
    // Safely bind tab click events to avoid CSP inline script errors
    questionContainer.querySelectorAll('.lc-tab-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const tabId = this.getAttribute('data-tab');
        const card = this.closest('.lc-parsed-problem');
        card.querySelectorAll('.lc-tab-content').forEach(el => el.style.display = 'none');
        card.querySelectorAll('.lc-tab-btn').forEach(el => el.style.opacity = '0.6');
        card.querySelector('#' + tabId).style.display = 'block';
        this.style.opacity = '1';
      });
    });
  } else {
    questionContainer.innerHTML = `<h2 style="color:#b86a7c; font-size:1.3rem; margin-bottom:10px;">${q.title || 'SQL Challenge'}</h2>` + 
                                  escapeHtml(q.question).replace(/\n/g, '<br>');
  }



  // Build clause pool: actual clauses from the expected query + distractors
  let actualClauses = [];
  if (q.expected_query && typeof detectClausesFromSQL === 'function') {
    try { actualClauses = detectClausesFromSQL(q.expected_query); } catch(e) { console.error('Parsing error', e); }
  } else if (q.categories || q.detectedClauses) {
    actualClauses = q.categories || q.detectedClauses; // Already detected by content script
  }

  // Filter out very basic ones people always pick (SELECT, FROM) to make it non-trivial
  const interestingActual = actualClauses.filter(c => !['SELECT', 'FROM'].includes(c));
  
  // Pick distractors (random clauses NOT in the actual answer)
  const actualSet = new Set(actualClauses);
  const distractorPool = CLAUSE_POOL_ITEMS.filter(c => !actualSet.has(c));
  const shuffledDistractors = distractorPool.sort(() => Math.random() - 0.5);
  
  // Show: all actual clauses + some distractors (total ~10-14 items)
  const targetCount = Math.max(10, interestingActual.length + 5);
  const distractorCount = Math.min(targetCount - interestingActual.length, shuffledDistractors.length);
  const poolItems = [...interestingActual, ...shuffledDistractors.slice(0, distractorCount)];
  poolItems.sort(() => Math.random() - 0.5);

  // Render clause pool
  const pool = document.getElementById('lc-clause-pool');
  pool.innerHTML = poolItems.map(clause => 
    `<button class="lc-clause-btn" data-clause="${clause}">${clause}</button>`
  ).join('');

  // Attach click handlers
  pool.querySelectorAll('.lc-clause-btn').forEach(btn => {
    btn.addEventListener('click', () => toggleClause(btn));
  });

  // Reset visibility correctly based on mode
  if (lcDifficulty === 'captured') {
     document.getElementById('lc-clause-pool').style.display = 'none';
     document.getElementById('lc-picks-zone').style.display = 'none';
     document.getElementById('lc-game-actions').style.display = 'none';
     document.getElementById('lc-feedback').style.display = 'none';
     document.querySelectorAll('.lc-guess-section-label').forEach(el => el.style.display = 'none');
     document.getElementById('lc-captured-nav').style.display = 'flex';
     
     // Auto-solve logic or render solution
     renderCapturedSolution(q, actualClauses);
  } else {
     document.getElementById('lc-clause-pool').style.display = 'flex';
     document.getElementById('lc-picks-zone').style.display = 'flex';
     document.getElementById('lc-game-actions').style.display = 'flex';
     document.querySelectorAll('.lc-guess-section-label').forEach(el => el.style.display = 'flex');
     document.getElementById('lc-captured-nav').style.display = 'none';
     document.getElementById('lc-answer-reveal').className = 'lc-answer-reveal';
     document.getElementById('lc-feedback').className = 'lc-feedback';
     document.getElementById('lc-feedback').textContent = '';
     
     // Reset Pick UI
     const picksZone = document.getElementById('lc-picks-zone');
     picksZone.innerHTML = '<span class="lc-picks-placeholder" id="lc-picks-placeholder">Click clauses above to make your guess...</span>';
     document.getElementById('lc-check-btn').disabled = true;
     document.getElementById('lc-check-btn').textContent = 'CHECK ANSWER';
     document.getElementById('lc-skip-btn').textContent = '⏭ SKIP';
     
     updateStats();
  }
}

// ===== CAPTURED MODE SOLUTION RENDER =====
function renderCapturedSolution(q, actualClauses) {
  const revealEl = document.getElementById('lc-answer-reveal');
  revealEl.className = 'lc-answer-reveal visible';
  revealEl.style.marginTop = '0';

  if (q.expected_query) {
    // Show Solution and exact clauses
    const usedClausesHtml = actualClauses.length > 0 ? `
      <div style="margin-top: 20px; padding-top: 15px; border-top: 1px dashed rgba(255,255,255,0.1);">
        <div style="font-size:0.65rem; color:#8bbca0; font-weight:800; letter-spacing:1px; margin-bottom:8px;">CLAUSES USED IN THIS SOLUTION:</div>
        <div style="display:flex; gap:6px; flex-wrap:wrap;">
          ${actualClauses.map(c => `<span style="padding: 4px 10px; background: rgba(139, 188, 160, 0.15); color: #8bbca0; border-radius: 8px; font-weight: 800; font-size: 0.7rem; border: 1px solid rgba(139,188,160,0.3);">${c}</span>`).join('')}
        </div>
      </div>` : '';

    revealEl.innerHTML = `
      <div style="color:#a0c4ff; font-size:0.75rem; margin-bottom:10px; font-weight:800; letter-spacing:1px;">✅ EXPECTED SQL SOLUTION</div>
      <div style="font-family: 'JetBrains Mono', monospace; font-size: 0.95rem; line-height: 1.5; background: rgba(0,0,0,0.2); padding: 15px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); white-space: pre-wrap;">${escapeHtml(q.expected_query).replace(/(--.*)/g, '<span style="color:#94a3b8; font-style:italic;">$1</span>')}</div>
      ${usedClausesHtml}
    `;
  } else {
    // Has not been solved yet. Attempt Auto-Solve if API key exists.
    let apiKey = localStorage.getItem('groqApiKey') || '';
    
    // UI for missing API key using the global box
    const renderMissingKeyUI = () => {
       revealEl.innerHTML = `
         <div style="color:#fca5a5; font-size:0.75rem; margin-bottom:10px; font-weight:800; letter-spacing:1px;">⚠️ SOLUTION UNAVAILABLE</div>
         <div style="color:#d1d5db;">You need a Groq API Key to automatically solve and extract clauses for this problem. Please paste your free key in the Engine Settings box above!</div>
       `;
    };

    if (!apiKey && typeof chrome !== 'undefined' && chrome.storage) {
        // Async fetch
        chrome.storage.local.get(['groqApiKey'], (res) => {
          if (res.groqApiKey) {
             revealEl.innerHTML = `<div style="text-align:center; padding: 20px; color: #a0c4ff; font-weight: 800; font-size:0.9rem;">⏳ AUTO-SOLVING...</div>`;
             solveCapturedQuestionWithAI(q, res.groqApiKey);
          } else {
             renderMissingKeyUI();
          }
        });
    } else if (apiKey) {
        // We have it locally, fire immediately!
        revealEl.innerHTML = `<div style="text-align:center; padding: 20px; color: #a0c4ff; font-weight: 800; font-size:0.9rem;">⏳ AUTO-SOLVING...</div>`;
        solveCapturedQuestionWithAI(q, apiKey);
    } else {
        renderMissingKeyUI();
    }
  }
}

// ===== TOGGLE CLAUSE =====
function toggleClause(btn) {
  if (lcAnswered) return;

  const clause = btn.dataset.clause;

  if (lcSelectedClauses.has(clause)) {
    lcSelectedClauses.delete(clause);
    btn.classList.remove('selected');
  } else {
    lcSelectedClauses.add(clause);
    btn.classList.add('selected');
  }

  renderPicks();
  document.getElementById('lc-check-btn').disabled = lcSelectedClauses.size === 0;
}

function renderPicks() {
  const picksZone = document.getElementById('lc-picks-zone');
  if (lcSelectedClauses.size === 0) {
    picksZone.innerHTML = '<span class="lc-picks-placeholder">Click clauses above to make your guess...</span>';
  } else {
    picksZone.innerHTML = [...lcSelectedClauses].map(c => 
      `<span class="lc-clause-btn selected" style="cursor:default;">${c}</span>`
    ).join('');
  }
}

// ===== EVENT BINDINGS =====
function setupActionButtons() {
  document.getElementById('lc-check-btn').addEventListener('click', checkAnswer);
  
  const handleSkip = async () => {
    if (lcAnswered) {
      nextQuestion();
    } else {
      lcAttempted++;
      lcStreak = 0;
      revealAnswer([], []);
      await saveStatsToStorage();
      updateStats();
    }
  };
  
  document.getElementById('lc-skip-btn').addEventListener('click', handleSkip);

  // Nav for Captured mode
  document.getElementById('lc-prev-btn').addEventListener('click', () => {
    lcCurrentIdx = (lcCurrentIdx - 1 + lcFiltered.length) % lcFiltered.length;
    renderQuestion();
  });
  
  document.getElementById('lc-next-btn').addEventListener('click', () => {
    lcCurrentIdx = (lcCurrentIdx + 1) % lcFiltered.length;
    renderQuestion();
  });

  const delBtn = document.getElementById('lc-del-btn');
  if (delBtn) {
    delBtn.addEventListener('click', () => {
      if (lcFiltered.length === 0) return;
      const q = lcFiltered[lcCurrentIdx % lcFiltered.length];
      
      if (confirm(`Permanently remove "${q.title}" from your Vault?`)) {
          if (typeof chrome !== 'undefined' && chrome.storage) {
              chrome.storage.local.get({ capturedLeetCode: [] }, (res) => {
                 const list = res.capturedLeetCode.filter(item => item.id !== q.id);
                 chrome.storage.local.set({ capturedLeetCode: list }, async () => {
                    await applyFilter();
                    if (lcFiltered.length > 0) {
                      lcCurrentIdx = Math.max(0, (lcCurrentIdx - 1 + lcFiltered.length) % lcFiltered.length);
                      renderQuestion();
                    } else {
                      document.getElementById('lc-question-text').innerHTML = `
                        <div style="text-align:center; padding:40px; color:#718096;">
                          <div style="font-size:3rem; margin-bottom:15px;">📦</div>
                          <strong>VAULT IS EMPTY!</strong><br>
                          <div style="font-size:0.8rem; margin-top:8px;">Open any SQL problem on LeetCode.com and it will be automatically saved here.</div>
                        </div>`;
                      hideAllGameUI();
                    }
                 });
              });
          }
      }
    });
  }

  // Global API Settings Save Button
  const saveKeyBtn = document.getElementById('save-global-lc-key');
  if (saveKeyBtn) {
    saveKeyBtn.addEventListener('click', () => {
      const keyVal = document.getElementById('global-lc-api-key').value.trim();
      if (keyVal) {
        localStorage.setItem('groqApiKey', keyVal);
        if (typeof chrome !== 'undefined' && chrome.storage) chrome.storage.local.set({ groqApiKey: keyVal });
        
        const statusEl = document.getElementById('lc-api-save-status');
        statusEl.style.display = 'block';
        setTimeout(() => statusEl.style.display='none', 3000);
        
        // Auto trigger current question if unsolved
        if (lcFiltered.length > 0 && lcDifficulty === 'captured') {
           const currentQ = lcFiltered[lcCurrentIdx % lcFiltered.length];
           if (!currentQ.expected_query) {
             renderQuestion(); // Re-render will auto trigger
           }
        }
      }
    });
  }
}

async function checkAnswer() {
  if (lcAnswered) {
    nextQuestion();
    return;
  }

  const pool = document.getElementById('lc-clause-pool');
  const correct = JSON.parse(pool.dataset.answer);
  const correctSet = new Set(correct);
  const selected = [...lcSelectedClauses];

  lcAttempted++;
  lcAnswered = true;

  // Calculate matches
  const hits = selected.filter(c => correctSet.has(c));
  const misses = correct.filter(c => !lcSelectedClauses.has(c));
  const wrongs = selected.filter(c => !correctSet.has(c));

  // Score it
  const hitRate = correct.length > 0 ? hits.length / correct.length : 0;
  const penalty = wrongs.length;

  let feedbackEl = document.getElementById('lc-feedback');
  
  if (hitRate >= 0.8 && penalty === 0) {
    // Perfect or near-perfect
    lcStreak++;
    lcCorrectCount++;
    const points = correct.length * 10 + (lcStreak > 1 ? lcStreak * 5 : 0);
    lcScore += points;
    feedbackEl.textContent = `🎉 ${hitRate === 1 ? 'PERFECT!' : 'GREAT!'} +${points} pts ${lcStreak > 1 ? `(${lcStreak}x streak!)` : ''}`;
    feedbackEl.className = 'lc-feedback visible success';

    // Save mastered clauses
    if (typeof ProgressManager !== 'undefined') {
      hits.forEach(c => ProgressManager.saveClauseMastered(c));
    }
  } else if (hitRate >= 0.5) {
    // Partial
    lcStreak = 0;
    const points = hits.length * 5;
    lcScore += points;
    lcCorrectCount += 0.5;
    feedbackEl.textContent = `🟡 PARTIAL — Got ${hits.length}/${correct.length} right, ${wrongs.length} wrong pick${wrongs.length !== 1 ? 's' : ''}. +${points} pts`;
    feedbackEl.className = 'lc-feedback visible partial';
  } else {
    // Fail
    lcStreak = 0;
    feedbackEl.textContent = `❌ MISSED — Only ${hits.length}/${correct.length} clauses correct.`;
    feedbackEl.className = 'lc-feedback visible fail';
  }

  // Highlight buttons
  revealAnswer(hits, wrongs);
  
  // Update button text
  document.getElementById('lc-check-btn').textContent = '➡ NEXT';
  document.getElementById('lc-check-btn').disabled = false;
  document.getElementById('lc-skip-btn').textContent = '⏭ SKIP';

  updateStats();
  await saveStatsToStorage();
}

function revealAnswer(hits, wrongs) {
  lcAnswered = true;
  const pool = document.getElementById('lc-clause-pool');
  const correct = JSON.parse(pool.dataset.answer);
  const correctSet = new Set(correct);

  pool.querySelectorAll('.lc-clause-btn').forEach(btn => {
    const clause = btn.dataset.clause;
    btn.classList.remove('selected');
    
    if (correctSet.has(clause) && lcSelectedClauses.has(clause)) {
      btn.classList.add('correct');
    } else if (correctSet.has(clause) && !lcSelectedClauses.has(clause)) {
      btn.classList.add('missed');
    } else if (!correctSet.has(clause) && lcSelectedClauses.has(clause)) {
      btn.classList.add('wrong');
    }
  });

  // Show expected SQL (if available)
  const q = lcFiltered[lcCurrentIdx % lcFiltered.length];
  const revealEl = document.getElementById('lc-answer-reveal');
  
  if (q.expected_query) {
    revealEl.innerHTML = `<div style="color:#718096; font-size:0.68rem; margin-bottom:6px; font-weight:800;">EXPECTED SQL:</div>${escapeHtml(q.expected_query)}`;
    revealEl.className = 'lc-answer-reveal visible';
  } else if (q.source === 'LeetCode') {
    revealEl.innerHTML = `<div style="color:#718096; font-size:0.68rem; margin-bottom:6px; font-weight:800;">PENDING AI SOLUTION</div>Whoops! You haven't solved this with AI yet. Click the <strong>🤖 SOLVE WITH AI</strong> button at the top to generate the expected SQL query.`;
    revealEl.className = 'lc-answer-reveal visible';
  } else {
    revealEl.className = 'lc-answer-reveal';
  }

  document.getElementById('lc-check-btn').textContent = '➡ NEXT';
  document.getElementById('lc-check-btn').disabled = false;
}

function nextQuestion() {
  lcCurrentIdx++;
  if (lcCurrentIdx >= lcFiltered.length) {
    // Reshuffle and restart
    lcFiltered.sort(() => Math.random() - 0.5);
    lcCurrentIdx = 0;
  }
  renderQuestion();
}

// ===== STATS =====
function updateStats() {
  const elStreak = document.getElementById('lc-streak');
  if (elStreak) elStreak.textContent = lcStreak + '🔥';
  
  const elScore = document.getElementById('lc-score');
  if (elScore) elScore.textContent = lcScore;
  
  const elAtt = document.getElementById('lc-attempted');
  if (elAtt) elAtt.textContent = lcAttempted;
  
  const elAcc = document.getElementById('lc-accuracy');
  if (lcAttempted > 0 && elAcc) {
    const accuracy = Math.round((lcCorrectCount / lcAttempted) * 100);
    elAcc.textContent = accuracy + '%';
  }
}

// Utility
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ===== LEETCODE QUESTION FORMATTER =====
function formatLeetCodeQuestionStr(text, title, url) {
  let result = `<div class="lc-parsed-problem">`;
  
  if (url) {
    result += `<a href="${url}" target="_blank" style="text-decoration:none;">
                 <h2 style="color:#b86a7c; font-size:1.4rem; margin-bottom:15px; cursor:pointer;" title="Open in LeetCode">🔗 ${title}</h2>
               </a>`;
  } else {
    result += `<h2 style="color:#b86a7c; font-size:1.4rem; margin-bottom:15px;">${title}</h2>`;
  }

  // TABS container
  result += `
    <div class="lc-tabs" style="display:flex; gap:10px; margin-bottom:15px; border-bottom:2px solid #eae1d7; padding-bottom:5px;">
      <button class="lc-tab-btn active" data-tab="tab-task" style="background:none; border:none; cursor:pointer; font-weight:800; color:#32475b; padding:5px 10px; opacity:1; transition:0.2s;">📝 TASK</button>
      <button class="lc-tab-btn" data-tab="tab-tables" style="background:none; border:none; cursor:pointer; font-weight:800; color:#b86a7c; padding:5px 10px; opacity:0.6; transition:0.2s;">🗄️ SCHEMA</button>
      <button class="lc-tab-btn" data-tab="tab-examples" style="background:none; border:none; cursor:pointer; font-weight:800; color:#059669; padding:5px 10px; opacity:0.6; transition:0.2s;">💡 EXAMPLES</button>
    </div>
  `;

  // Robustly parse the text into Task, Schema, and Examples
  let exampleMatch = text.match(/(Example\s*1:[\s\S]+)/i);
  let baseText = exampleMatch ? text.slice(0, exampleMatch.index).trim() : text.trim();
  let exampleText = exampleMatch ? exampleMatch[0].trim() : "No examples provided.";

  let tablesText = "No table schema neatly detected. Please check the TASK tab.";
  let taskText = baseText;

  // Most common LeetCode format: "Table: X..." then "Write a solution..."
  // OR "Write a solution..." then "Table: X..."
  let taskStartIndex = baseText.search(/\n*(Write an? |Find |Calculate |Compute |Report )\b/i);
  
  if (taskStartIndex > -1) {
    let beforeTask = baseText.slice(0, taskStartIndex).trim();
    let afterTask = baseText.slice(taskStartIndex).trim();
    
    if (beforeTask.toLowerCase().includes('table:')) {
       tablesText = beforeTask;
       taskText = afterTask;
    } else if (afterTask.toLowerCase().includes('table:')) {
       let tableStartInAfter = afterTask.search(/(Table:\s*[a-z0-9_]+)/i);
       if (tableStartInAfter > -1) {
           taskText = (beforeTask + "\n\n" + afterTask.slice(0, tableStartInAfter)).trim();
           tablesText = afterTask.slice(tableStartInAfter).trim();
       }
    }
  } else {
    // Regex faliback if the exact task word isn't used
    let fallbackTableMatch = baseText.match(/(Table:\s*[a-z0-9_]+[\s\S]*?(?=\n\n[A-Z]|$))/i);
    if (fallbackTableMatch) {
       tablesText = fallbackTableMatch[0].trim();
       taskText = baseText.replace(tablesText, '').trim();
    }
  }

  // Double check if tablesText has ascii tables +--+--+
  if (tablesText === "No table schema neatly detected. Please check the TASK tab." && baseText.includes('+--')) {
     let asciiRegex = /(?:Table:\s*[A-Za-z0-9_]+\s*\n)?\+[-+]+\+\n[\s\S]*?\+[-+]+\+/gi;
     let matches = [...baseText.matchAll(asciiRegex)];
     if (matches.length > 0) {
         tablesText = matches.map(m => m[0]).join('\n\n');
         matches.forEach(m => { taskText = taskText.replace(m[0], ''); });
     }
  }

  result += `
    <div id="tab-task" class="lc-tab-content" style="display:block; font-size:1.05rem; line-height:1.6; color:#32475b;">
      ${escapeHtml(taskText).replace(/\n/g, '<br>')}
    </div>
    <div id="tab-tables" class="lc-tab-content" style="display:none; font-family:'JetBrains Mono', monospace; background:#f4f4f5; padding:20px; border-radius:12px; white-space:pre-wrap; font-size:0.85rem; overflow-x:auto;">${escapeHtml(tablesText)}</div>
    <div id="tab-examples" class="lc-tab-content" style="display:none; font-family:'JetBrains Mono', monospace; background:#fef2f2; padding:20px; border-radius:12px; white-space:pre-wrap; font-size:0.85rem; overflow-x:auto;">${escapeHtml(exampleText)}</div>
  `;
  result += `</div>`;

  return result;
}

// ===== AI SOLVER FOR CAPTURED QUESTIONS =====
async function solveCapturedQuestionWithAI(q, providedKey) {
  let apiKey = providedKey || localStorage.getItem('groqApiKey');
  
  if (!apiKey && typeof chrome !== 'undefined' && chrome.storage) {
    const res = await new Promise(r => chrome.storage.local.get(['groqApiKey'], r));
    apiKey = res.groqApiKey || '';
  }

  if (!apiKey) {
    alert('API Key is missing. Cannot solve.');
    return;
  }

  const systemPrompt = `You are an expert SQL Developer. Parse the following LeetCode SQL problem.
Return EXACTLY and ONLY the MySQL query to solve it.

CRITICAL INSTRUCTION: You MUST follow this exact reasoning workflow:
STEP 1. Read the core Question prompt thoroughly.
STEP 2. Analyze the provided Table Schema rigorously.
STEP 3. Look deeply at the Expected Desired Output box.
STEP 4. Only then, formulate your answer solely on the basis of matching that EXACT desired output!

Code Requirements:
1. Write standard MySQL syntax ONLY.
2. ALWAYS escape reserved keywords like \`rank\` or \`order\` with backticks (e.g., \`rank\`).
3. MySQL strictly DOES NOT allow mathematical equations (like N-1) inside LIMIT or OFFSET clauses. If you need math for variables like 'N', you MUST write the full \`CREATE FUNCTION\` wrapper block and SET the math variable first before the SELECT statement!

No markdown code blocks (\`\`\`sql) around the code, no pleasantries. JUST RAW SQL in UPPERCASE syntax.
CRITICAL INSTRUCTION: You MUST structure your entire response EXACTLY like the format below. Write all of the SQL together at the top, followed by a separator, then a full English explanation, and finally a full Hinglish explanation. Do NOT wrap the response in markdown blocks like \`\`\`sql.

Format Example:
-- SQL QUERY:
SELECT name, email
FROM customers
WHERE id > 5
ORDER BY name ASC;

-- =========================================

-- ENGLISH EXPLANATION:
-- This query retrieves the name and email columns from the customers table.
-- It filters the records to include only those where the id is greater than 5.
-- Finally, it sorts the result in ascending order based on the name column.

-- HINGLISH EXPLANATION:
-- Yeh query customers table se name aur email columns nikal rahi hai.
-- Sirf un records ko le rahi hai jinka id 5 se bada hai.
-- End mein result ko name ke basis pe ascending order mein sort kar rahi hai.`;

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
          { role: 'user', content: q.question }
        ],
        temperature: 0.1,
        max_tokens: 1024
      })
    });

    if (!response.ok) throw new Error('API Error');

    const data = await response.json();
    let sql = data.choices?.[0]?.message?.content?.trim() || '';

    // Clean markdown if AI disobeyed
    sql = sql.replace(/```sql\n?/gi, '').replace(/```\n?/g, '').trim();

    // Update state
    q.expected_query = sql;

    // Optional: save this back to storage so it remembers the solution
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get({ capturedLeetCode: [] }, (res) => {
        const list = res.capturedLeetCode;
        const index = list.findIndex(item => item.id === q.id);
        if (index > -1) {
          list[index].expected_query = sql;
          chrome.storage.local.set({ capturedLeetCode: list });
        }
      });
    }

    // Refresh UI
    renderQuestion();

  } catch (err) {
    console.error('Groq Error:', err);
    alert('Failed to solve using AI. Please check your API key and connection.');
    btn.textContent = '🤖 SOLVE WITH AI (GROQ)';
    btn.disabled = false;
  }
}
