import { sqlEngine, escapeHtml } from '../engine/sql-engine.js';

const BUG_PUZZLES = [
  { diff:'easy', task:'Select all employees', buggy:'SELCT * FROM employees;', answer:'SELECT * FROM employees;' },
  { diff:'easy', task:'Get employee names', buggy:'SELECT name FORM employees;', answer:'SELECT name FROM employees;' },
  { diff:'easy', task:'Count all employees', buggy:'SELECT COUT(*) FROM employees;', answer:'SELECT COUNT(*) FROM employees;' },
  { diff:'easy', task:'Get employees in IT dept', buggy:"SELECT * FROM employees WERE department = 'IT';", answer:"SELECT * FROM employees WHERE department = 'IT';" },
  { diff:'easy', task:'Find max salary', buggy:'SELECT MAX(salry) FROM employees;', answer:'SELECT MAX(salary) FROM employees;' },
  { diff:'medium', task:'Get departments with avg salary > 5000', buggy:'SELECT department, AVG(salary) FROM employees WHERE AVG(salary) > 5000 GROUP BY department;', answer:'SELECT department, AVG(salary) FROM employees GROUP BY department HAVING AVG(salary) > 5000;' },
  { diff:'medium', task:'Get top 5 highest paid', buggy:'SELECT * FROM employees ORDER salary DESC LIMIT 5;', answer:'SELECT * FROM employees ORDER BY salary DESC LIMIT 5;' },
  { diff:'medium', task:'Count by department', buggy:'SELECT department, COUNT(*) FROM employees GROUP department;', answer:'SELECT department, COUNT(*) FROM employees GROUP BY department;' },
  { diff:'medium', task:'Get names with salary between ranges', buggy:'SELECT name FROM employees WHERE salary BETWEEN 5000 TO 7000;', answer:'SELECT name FROM employees WHERE salary BETWEEN 5000 AND 7000;' },
  { diff:'medium', task:'Find distinct departments', buggy:'SELECT DISTINT department FROM employees;', answer:'SELECT DISTINCT department FROM employees;' },
  { diff:'hard', task:'Find departments with more than 2 employees', buggy:'SELECT department, COUNT(*) as cnt FROM employees HAVING cnt > 2;', answer:'SELECT department, COUNT(*) as cnt FROM employees GROUP BY department HAVING cnt > 2;' },
  { diff:'hard', task:'Get 2nd highest salary', buggy:'SELECT MAX(salary) FROM employees WHERE salary < MAX(salary);', answer:'SELECT MAX(salary) FROM employees WHERE salary < (SELECT MAX(salary) FROM employees);' },
  { diff:'hard', task:'Get employees earning above average', buggy:'SELECT * FROM employees WHERE salary > AVG(salary);', answer:'SELECT * FROM employees WHERE salary > (SELECT AVG(salary) FROM employees);' },
  { diff:'hard', task:'Get salary rank in each dept', buggy:'SELECT name, department, salary, RANK() OVER (PARTITION department ORDER BY salary DESC) as rnk FROM employees;', answer:'SELECT name, department, salary, RANK() OVER (PARTITION BY department ORDER BY salary DESC) as rnk FROM employees;' },
  { diff:'hard', task:'Find duplicate cities', buggy:'SELECT city, COUNT(*) FROM employees GROUP BY city HAVING COUNT(*) > 1 ORDER COUNT(*) DESC;', answer:'SELECT city, COUNT(*) FROM employees GROUP BY city HAVING COUNT(*) > 1 ORDER BY COUNT(*) DESC;' }
];

let gameState = { score:0, streak:0, round:0, correct:0, total:10, timer:null, timeLeft:0, puzzles:[], selectedDiff:'all' };
const GAME_HS_KEY = 'pg_bug_highscore';

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function resultToString(result) {
  if (!result.success || !result.results || !result.results.length) return '';
  const r = result.results[0];
  if (!r.values || !r.values.length) return '';
  return r.values.map(row => row.join('|')).sort().join('\n');
}

export function renderBugsquasher() {
  return `
  <div class="page-header" style="text-align:center;margin-bottom:32px;">
    <div class="page-header-icon" style="width:72px;height:72px;margin:0 auto 8px;display:inline-flex;align-items:center;justify-content:center;">
      <svg width="100%" height="100%" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block; overflow:visible;">
        <defs>
          <linearGradient id="headerBugGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#a3e635" />
            <stop offset="50%" stop-color="#10b981" />
            <stop offset="100%" stop-color="#047857" />
          </linearGradient>
          <linearGradient id="headerBugEyeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#ffffff" />
            <stop offset="100%" stop-color="#e2e8f0" />
          </linearGradient>
          <filter id="headerBugGlow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#10b981" flood-opacity="0.3"/>
          </filter>
        </defs>
        <!-- Antennas -->
        <path d="M26 18C26 12 20 10 18 10M38 18C38 12 44 10 46 10" stroke="url(#headerBugGrad)" stroke-width="3" stroke-linecap="round" />
        <circle cx="18" cy="10" r="3" fill="#10b981" />
        <circle cx="46" cy="10" r="3" fill="#10b981" />
        
        <!-- Legs (3 pairs) -->
        <path d="M16 28C10 28 8 32 6 36" stroke="#047857" stroke-width="3" stroke-linecap="round" />
        <path d="M48 28C54 28 56 32 58 36" stroke="#047857" stroke-width="3" stroke-linecap="round" />
        <path d="M14 38C8 39 6 44 4 48" stroke="#047857" stroke-width="3" stroke-linecap="round" />
        <path d="M50 38C56 39 58 44 60 48" stroke="#047857" stroke-width="3" stroke-linecap="round" />
        <path d="M16 48C12 52 10 56 12 60" stroke="#047857" stroke-width="3" stroke-linecap="round" />
        <path d="M48 48C52 52 54 56 52 60" stroke="#047857" stroke-width="3" stroke-linecap="round" />

        <!-- Body Segments -->
        <circle cx="32" cy="50" r="8" fill="url(#headerBugGrad)" filter="url(#headerBugGlow)" />
        <circle cx="32" cy="38" r="9" fill="url(#headerBugGrad)" filter="url(#headerBugGlow)" />
        <circle cx="32" cy="24" r="10" fill="url(#headerBugGrad)" filter="url(#headerBugGlow)" />

        <!-- Eyes -->
        <circle cx="27" cy="22" r="3" fill="url(#headerBugEyeGrad)" />
        <circle cx="27" cy="22" r="1.5" fill="#0f172a" />
        <circle cx="37" cy="22" r="3" fill="url(#headerBugEyeGrad)" />
        <circle cx="37" cy="22" r="1.5" fill="#0f172a" />

        <!-- Cute blush -->
        <circle cx="24" cy="26" r="1.5" fill="#ef4444" opacity="0.6" />
        <circle cx="40" cy="26" r="1.5" fill="#ef4444" opacity="0.6" />

        <!-- Smile -->
        <path d="M30 28Q32 30 34 28" stroke="#0f172a" stroke-width="1.5" stroke-linecap="round" />
      </svg>
    </div>
    <h1 class="page-title">SQL Bug Squasher</h1>
    <p class="page-subtitle">Fix broken SQL queries before time runs out. Faster fixes = more points!</p>
  </div>

  <!-- Start Screen -->
  <div id="game-start-screen" style="max-width:600px;margin:0 auto;">
    <div class="card" style="text-align:center;padding:40px;">
      <div style="display:flex;justify-content:center;gap:24px;margin-bottom:32px;flex-wrap:wrap;">
        <div class="game-stat-card-3d">
          <div class="game-stat-card-inner">
            <div class="game-stat-icon">
              <svg width="100%" height="100%" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block; overflow:visible;">
                <defs>
                  <linearGradient id="bugCardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#a3e635" />
                    <stop offset="50%" stop-color="#10b981" />
                    <stop offset="100%" stop-color="#047857" />
                  </linearGradient>
                  <linearGradient id="bugCardEyeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#ffffff" />
                    <stop offset="100%" stop-color="#e2e8f0" />
                  </linearGradient>
                  <filter id="bugCardGlow" x="-10%" y="-10%" width="120%" height="120%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#10b981" flood-opacity="0.3"/>
                  </filter>
                </defs>
                <!-- Antennas -->
                <path d="M26 18C26 12 20 10 18 10M38 18C38 12 44 10 46 10" stroke="url(#bugCardGrad)" stroke-width="3" stroke-linecap="round" />
                <circle cx="18" cy="10" r="3" fill="#10b981" />
                <circle cx="46" cy="10" r="3" fill="#10b981" />
                
                <!-- Legs -->
                <path d="M16 28C10 28 8 32 6 36" stroke="#047857" stroke-width="3" stroke-linecap="round" />
                <path d="M48 28C54 28 56 32 58 36" stroke="#047857" stroke-width="3" stroke-linecap="round" />
                <path d="M14 38C8 39 6 44 4 48" stroke="#047857" stroke-width="3" stroke-linecap="round" />
                <path d="M50 38C56 39 58 44 60 48" stroke="#047857" stroke-width="3" stroke-linecap="round" />
                <path d="M16 48C12 52 10 56 12 60" stroke="#047857" stroke-width="3" stroke-linecap="round" />
                <path d="M48 48C52 52 54 56 52 60" stroke="#047857" stroke-width="3" stroke-linecap="round" />

                <!-- Body Segments -->
                <circle cx="32" cy="50" r="8" fill="url(#bugCardGrad)" filter="url(#bugCardGlow)" />
                <circle cx="32" cy="38" r="9" fill="url(#bugCardGrad)" filter="url(#bugCardGlow)" />
                <circle cx="32" cy="24" r="10" fill="url(#bugCardGrad)" filter="url(#bugCardGlow)" />

                <!-- Eyes -->
                <circle cx="27" cy="22" r="3" fill="url(#bugCardEyeGrad)" />
                <circle cx="27" cy="22" r="1.5" fill="#0f172a" />
                <circle cx="37" cy="22" r="3" fill="url(#bugCardEyeGrad)" />
                <circle cx="37" cy="22" r="1.5" fill="#0f172a" />

                <!-- Blush -->
                <circle cx="24" cy="26" r="1.5" fill="#ef4444" opacity="0.6" />
                <circle cx="40" cy="26" r="1.5" fill="#ef4444" opacity="0.6" />

                <!-- Smile -->
                <path d="M30 28Q32 30 34 28" stroke="#0f172a" stroke-width="1.5" stroke-linecap="round" />
              </svg>
            </div>
            <div class="game-stat-label">Fix Bugs</div>
          </div>
        </div>
        <div class="game-stat-card-3d">
          <div class="game-stat-card-inner">
            <div class="game-stat-icon">
              <svg width="100%" height="100%" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block; overflow:visible;">
                <defs>
                  <linearGradient id="watchBezelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#38bdf8" />
                    <stop offset="100%" stop-color="#0284c7" />
                  </linearGradient>
                  <linearGradient id="watchFaceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#1e293b" />
                    <stop offset="100%" stop-color="#0f172a" />
                  </linearGradient>
                  <filter id="watchNeonGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#2dd4bf" flood-opacity="0.5"/>
                  </filter>
                </defs>
                <rect x="28" y="4" width="8" height="6" rx="2" fill="#0284c7" />
                <rect x="26" y="2" width="12" height="3" rx="1.5" fill="#38bdf8" />
                <path d="M16 16L12 12" stroke="#0284c7" stroke-width="4" stroke-linecap="round" />
                <path d="M48 16L52 12" stroke="#0284c7" stroke-width="4" stroke-linecap="round" />
                <circle cx="32" cy="36" r="22" fill="url(#watchBezelGrad)" />
                <circle cx="32" cy="36" r="18" fill="url(#watchFaceGrad)" />
                <circle cx="32" cy="36" r="14" stroke="#334155" stroke-width="1.5" stroke-dasharray="4,3" />
                <rect x="31" y="20" width="2" height="4" rx="1" fill="#2dd4bf" filter="url(#watchNeonGlow)" />
                <rect x="31" y="48" width="2" height="4" rx="1" fill="#2dd4bf" />
                <rect x="44" y="35" width="4" height="2" rx="1" fill="#2dd4bf" />
                <rect x="16" y="35" width="4" height="2" rx="1" fill="#2dd4bf" />
                <path d="M32 36L40 32" stroke="#94a3b8" stroke-width="2.5" stroke-linecap="round" />
                <path d="M32 36L32 23" stroke="#f43f5e" stroke-width="2" stroke-linecap="round" />
                <circle cx="32" cy="36" r="3" fill="#ffffff" />
                <circle cx="32" cy="36" r="1.5" fill="#f43f5e" />
              </svg>
            </div>
            <div class="game-stat-label">Timed</div>
          </div>
        </div>
        <div class="game-stat-card-3d">
          <div class="game-stat-card-inner">
            <div class="game-stat-icon">
              <svg width="100%" height="100%" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block; overflow:visible;">
                <defs>
                  <linearGradient id="fireGradOuterGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                    <stop offset="0%" stop-color="#b91c1c" />
                    <stop offset="50%" stop-color="#ea580c" />
                    <stop offset="100%" stop-color="#f59e0b" />
                  </linearGradient>
                  <linearGradient id="fireGradInnerGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                    <stop offset="0%" stop-color="#ea580c" />
                    <stop offset="70%" stop-color="#facc15" />
                    <stop offset="100%" stop-color="#fef08a" />
                  </linearGradient>
                  <filter id="fireGlowGrad" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#f97316" flood-opacity="0.4"/>
                  </filter>
                </defs>
                <path d="M32 6C32 6 48 20 48 36C48 48 38 58 32 58C26 58 16 48 16 36C16 20 32 6 32 6Z" fill="url(#fireGradOuterGrad)" filter="url(#fireGlowGrad)" />
                <path d="M32 18C32 18 42 28 42 40C42 46 36 52 32 52C28 52 22 46 22 40C22 28 32 18 32 18Z" fill="url(#fireGradInnerGrad)" />
                <path d="M32 30C32 30 36 36 36 44C36 47 34 50 32 50C30 50 28 47 28 44C28 36 32 30 32 30Z" fill="#ffffff" opacity="0.9" />
                <circle cx="14" cy="24" r="2" fill="#f97316" />
                <circle cx="50" cy="24" r="1.5" fill="#f59e0b" />
                <circle cx="46" cy="14" r="2.5" fill="#facc15" />
              </svg>
            </div>
            <div class="game-stat-label">Streaks</div>
          </div>
        </div>
      </div>

      <!-- Difficulty Selector -->
      <div style="margin-bottom:24px;">
        <div style="font-weight:800;font-size:0.8rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:14px;">Choose Difficulty</div>
        <div id="diff-selector" style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
          <button class="btn diff-select-btn active" data-diff="all" style="padding:12px 22px;font-size:0.82rem;border-radius:var(--radius-pill);transition:all 0.2s ease;">
             All Mixed
          </button>
          <button class="btn diff-select-btn" data-diff="easy" style="padding:12px 22px;font-size:0.82rem;border-radius:var(--radius-pill);transition:all 0.2s ease;">
             Easy
          </button>
          <button class="btn diff-select-btn" data-diff="medium" style="padding:12px 22px;font-size:0.82rem;border-radius:var(--radius-pill);transition:all 0.2s ease;">
             Medium
          </button>
          <button class="btn diff-select-btn" data-diff="hard" style="padding:12px 22px;font-size:0.82rem;border-radius:var(--radius-pill);transition:all 0.2s ease;">
             Hard
          </button>
        </div>
      </div>

      <div style="font-size:0.85rem;color:var(--text-muted);font-weight:600;margin-bottom:10px;line-height:1.7;">
        Each query has a syntax bug. Fix it and submit before the timer runs out.<br>
        <span style="color:var(--accent-primary);font-weight:800;">Easy</span> = 20s &nbsp;|&nbsp;
        <span style="color:#f0ad4e;font-weight:800;">Medium</span> = 30s &nbsp;|&nbsp;
        <span style="color:var(--accent-red);font-weight:800;">Hard</span> = 40s
      </div>
      <div id="game-highscore" style="font-size:0.85rem;color:var(--accent-primary);font-weight:900;margin-bottom:20px;"></div>
      <button class="btn btn-primary" id="start-game-btn" style="padding:14px 40px;font-size:1rem;font-weight:800;"> Start Game</button>
    </div>
  </div>

  <!-- Play Screen -->
  <div id="game-play-screen" style="display:none;max-width:700px;margin:0 auto;">
    <!-- Top bar -->
    <div class="card" style="padding:14px 20px;margin-bottom:20px;background:var(--accent-pink-light);border-color:var(--accent-primary);">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div style="display:flex;gap:20px;align-items:center;">
          <span id="game-score-display" style="font-weight:900;font-size:1.1rem;color:var(--accent-primary);">Score: 0</span>
          <span id="game-streak-display" style="font-weight:800;font-size:0.9rem;color:var(--accent-green-dark);"> 0</span>
        </div>
        <div style="display:flex;align-items:center;gap:14px;">
          <span id="game-round-display" style="font-weight:800;font-size:0.82rem;color:var(--text-muted);">1 / 10</span>
          <span id="game-timer" style="font-weight:900;font-size:1.2rem;color:var(--accent-red);min-width:45px;text-align:right;">30s</span>
        </div>
      </div>
      <div style="width:100%;height:6px;background:rgba(255,255,255,0.4);border-radius:3px;margin-top:12px;overflow:hidden;">
        <div id="game-timer-bar" style="height:100%;background:var(--accent-green);border-radius:3px;transition:width .3s linear;width:100%;"></div>
      </div>
    </div>

    <!-- Bug card -->
    <div class="card" style="margin-bottom:20px;border-color:var(--accent-red);border-width:2px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <span style="font-weight:800;font-size:0.75rem;color:var(--accent-red);letter-spacing:1px;"> BUGGY QUERY</span>
        <span id="game-diff-tag" class="diff-tag easy">EASY</span>
      </div>
      <div id="game-task" style="font-size:0.9rem;font-weight:700;color:var(--text-primary);margin-bottom:12px;line-height:1.7;"></div>
      <pre id="game-buggy-sql" style="background:var(--bg-editor);color:#ff6b6b;padding:16px;border-radius:8px;font-size:.88rem;white-space:pre-wrap;border:1px solid #3a2020;"></pre>
    </div>

    <!-- Editor -->
    <div class="editor-chrome" style="margin-bottom:16px;">
      <div class="editor-chrome-bar">
        <span class="editor-chrome-label">>_ FIX_IT <span style="opacity:.5;font-size:.7rem;margin-left:8px;">CTRL+ENTER</span></span>
        <button class="btn btn-sm btn-accent" id="game-submit-btn"> Submit Fix</button>
      </div>
      <textarea class="sql-editor" id="game-editor" placeholder="-- Fix the query here..." style="min-height:100px;"></textarea>
    </div>

    <!-- Feedback -->
    <div id="game-feedback" style="min-height:50px;"></div>
  </div>

  <!-- Game Over Screen -->
  <div id="game-over-screen" style="display:none;max-width:480px;margin:0 auto;">
    <div class="card" style="text-align:center;padding:40px;">
      <div id="game-over-emoji" style="font-size:4rem;margin-bottom:12px;"></div>
      <div style="font-weight:900;font-size:1.3rem;color:var(--text-primary);margin-bottom:8px;">Game Over!</div>
      <div id="game-final-score" style="font-size:2.5rem;font-weight:900;color:var(--accent-primary);margin-bottom:6px;"></div>
      <div id="game-final-stats" style="font-size:0.9rem;color:var(--text-muted);font-weight:700;margin-bottom:28px;"></div>
      <div style="display:flex;gap:12px;justify-content:center;">
        <button class="btn btn-primary" id="game-restart-btn" style="padding:12px 32px;font-size:0.95rem;"> Play Again</button>
        <a href="#/playground" class="btn btn-secondary" style="padding:12px 24px;font-size:0.95rem;">← Playground</a>
      </div>
    </div>
  </div>`;
}

export function initBugsquasher() {
  // Difficulty selector buttons
  document.querySelectorAll('.diff-select-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.diff-select-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      gameState.selectedDiff = btn.dataset.diff;
    });
  });

  document.getElementById('start-game-btn')?.addEventListener('click', startBugGame);
  document.getElementById('game-submit-btn')?.addEventListener('click', submitBugFix);
  document.getElementById('game-restart-btn')?.addEventListener('click', startBugGame);
  document.addEventListener('keydown', e => { if(e.ctrlKey && e.key === 'Enter') submitBugFix(); });
  showGameHighscore();
}

function showGameHighscore() {
  const hs = parseInt(localStorage.getItem(GAME_HS_KEY) || '0');
  const el = document.getElementById('game-highscore');
  if (el) el.textContent = hs > 0 ? ' High Score: ' + hs + ' pts' : '';
}

function startBugGame() {
  const diff = gameState.selectedDiff || 'all';
  let pool = diff === 'all' ? BUG_PUZZLES : BUG_PUZZLES.filter(p => p.diff === diff);
  const puzzles = shuffleArray(pool);
  const total = Math.min(puzzles.length, 10);

  gameState = { score:0, streak:0, round:0, correct:0, total, timer:null, timeLeft:0, puzzles:puzzles.slice(0, total), selectedDiff:diff };
  document.getElementById('game-start-screen').style.display = 'none';
  document.getElementById('game-over-screen').style.display = 'none';
  document.getElementById('game-play-screen').style.display = 'block';
  loadBugRound();
}

function loadBugRound() {
  if (gameState.round >= gameState.total) { endBugGame(); return; }
  const p = gameState.puzzles[gameState.round];
  document.getElementById('game-round-display').textContent = (gameState.round + 1) + ' / ' + gameState.total;
  document.getElementById('game-score-display').textContent = 'Score: ' + gameState.score;
  document.getElementById('game-streak-display').textContent = ' ' + gameState.streak;
  document.getElementById('game-task').textContent = p.task;
  document.getElementById('game-buggy-sql').textContent = p.buggy;
  const tag = document.getElementById('game-diff-tag');
  tag.textContent = p.diff.toUpperCase();
  tag.className = 'diff-tag ' + p.diff;
  document.getElementById('game-editor').value = p.buggy;
  document.getElementById('game-editor').disabled = false;
  document.getElementById('game-submit-btn').disabled = false;
  document.getElementById('game-feedback').innerHTML = '';

  const timeLimit = p.diff === 'easy' ? 20 : p.diff === 'medium' ? 30 : 40;
  gameState.timeLeft = timeLimit;
  clearInterval(gameState.timer);
  document.getElementById('game-timer').textContent = timeLimit + 's';
  document.getElementById('game-timer-bar').style.width = '100%';
  document.getElementById('game-timer-bar').style.background = 'var(--accent-green)';

  gameState.timer = setInterval(function () {
    gameState.timeLeft--;
    const pct = (gameState.timeLeft / timeLimit) * 100;
    document.getElementById('game-timer').textContent = gameState.timeLeft + 's';
    document.getElementById('game-timer-bar').style.width = pct + '%';
    if (pct < 30) document.getElementById('game-timer-bar').style.background = 'var(--accent-red)';
    else if (pct < 60) document.getElementById('game-timer-bar').style.background = '#f0ad4e';
    if (gameState.timeLeft <= 0) { clearInterval(gameState.timer); bugTimeout(); }
  }, 1000);
}

function showAnswerAndNext(feedbackHTML, puzzle) {
  const fb = document.getElementById('game-feedback');
  document.getElementById('game-editor').disabled = true;
  document.getElementById('game-submit-btn').disabled = true;

  const answerBlock = `
    <div style="margin-top:12px;padding:16px 18px;background:var(--bg-editor);border-radius:10px;border:1.5px solid var(--accent-green-border);">
      <div style="font-weight:800;font-size:0.72rem;color:var(--accent-green);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;"> Correct Answer</div>
      <pre style="color:#a0c4ff;font-size:0.88rem;white-space:pre-wrap;margin:0;line-height:1.7;font-family:var(--font-mono);">${escapeHtml(puzzle.answer)}</pre>
    </div>
    <div style="text-align:right;margin-top:14px;">
      <button class="btn btn-primary" id="game-next-btn" style="padding:10px 28px;font-size:0.88rem;">Next →</button>
    </div>`;

  fb.innerHTML = feedbackHTML + answerBlock;

  document.getElementById('game-next-btn').addEventListener('click', () => {
    gameState.round++;
    loadBugRound();
  });
}

function submitBugFix() {
  if (document.getElementById('game-submit-btn').disabled) return;
  clearInterval(gameState.timer);
  const userQuery = document.getElementById('game-editor').value.trim();
  const p = gameState.puzzles[gameState.round];
  const fb = document.getElementById('game-feedback');
  if (!userQuery) {
    fb.innerHTML = '<div class="feedback feedback-info"><span class="feedback-icon">ℹ</span><span>Write your fix first!</span></div>';
    return;
  }

  const userResult = sqlEngine.exec(userQuery);
  const expectedResult = sqlEngine.exec(p.answer);
  const userStr = resultToString(userResult);
  const expectedStr = resultToString(expectedResult);
  const isCorrect = userResult.success && userStr === expectedStr;

  let feedbackHTML;
  if (isCorrect) {
    const timeBonus = Math.max(gameState.timeLeft * 2, 0);
    const diffBonus = p.diff === 'easy' ? 10 : p.diff === 'medium' ? 20 : 35;
    gameState.streak++;
    const streakBonus = gameState.streak >= 3 ? gameState.streak * 3 : 0;
    const points = diffBonus + timeBonus + streakBonus;
    gameState.score += points;
    gameState.correct++;
    feedbackHTML = '<div style="padding:12px 18px;background:var(--accent-green-light);border:1.5px solid var(--accent-green-border);border-radius:var(--radius-sm);"><span style="font-weight:800;color:var(--accent-green-dark);font-size:.88rem;"> +' + points + ' pts' + (streakBonus ? ' ( streak +' + streakBonus + ')' : '') + '</span></div>';
  } else {
    gameState.streak = 0;
    const errMsg = userResult.success ? 'Output does not match expected result.' : escapeHtml(userResult.error);
    feedbackHTML = '<div style="padding:12px 18px;background:#fff0f0;border:1.5px solid #ffb3b3;border-radius:var(--radius-sm);"><span style="font-weight:800;color:#c0392b;font-size:.88rem;"> ' + errMsg + '</span></div>';
  }

  showAnswerAndNext(feedbackHTML, p);
}

function bugTimeout() {
  gameState.streak = 0;
  const p = gameState.puzzles[gameState.round];
  const feedbackHTML = '<div style="padding:12px 18px;background:#fff0f0;border:1.5px solid #ffb3b3;border-radius:var(--radius-sm);"><span style="font-weight:800;color:#c0392b;font-size:.88rem;"> Time is up!</span></div>';
  showAnswerAndNext(feedbackHTML, p);
}

function endBugGame() {
  clearInterval(gameState.timer);
  document.getElementById('game-play-screen').style.display = 'none';
  document.getElementById('game-over-screen').style.display = 'block';
  const hs = parseInt(localStorage.getItem(GAME_HS_KEY) || '0');
  const isNew = gameState.score > hs;
  if (isNew) localStorage.setItem(GAME_HS_KEY, String(gameState.score));
  document.getElementById('game-over-emoji').textContent = gameState.correct >= 8 ? '🏆' : gameState.correct >= 5 ? '😎' : '👾';
  document.getElementById('game-final-score').textContent = gameState.score + ' pts' + (isNew ? '  NEW HIGH SCORE!' : '');
  document.getElementById('game-final-stats').textContent = gameState.correct + '/' + gameState.total + ' correct';
  showGameHighscore();
}
