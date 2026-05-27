import { sqlEngine, escapeHtml, highlightSQL, setupSyntaxHighlighting } from '../engine/sql-engine.js';

/* ================================================================
   SQL DETECTIVE — Solve mysteries by writing real SQL queries
   ================================================================ */

const CASES = [
  {
    id: 'ghost_employee',
    title: 'The Ghost Employee',
    icon: '',
    difficulty: 'easy',
    intro: 'The CFO noticed payroll costs are higher than expected. There might be a "ghost employee" — someone on the payroll who shouldn\'t be. Investigate the employees table to find the anomaly.',
    clues: [
      {
        id: 1,
        briefing: 'First, let\'s see how many employees we have in each department. Count the employees grouped by department.',
        task: 'Write a query to count employees in each department.',
        hint: 'Use COUNT(*) with GROUP BY department',
        validate: (result) => {
          if (!result.success || !result.results?.length) return false;
          const r = result.results[0];
          return r.columns?.length === 2 && r.values?.length >= 4;
        },
        answer: 'SELECT department, COUNT(*) FROM employees GROUP BY department;',
        revelation: ' Good work! We can see the department breakdown. IT seems to have a lot of employees. Let\'s dig deeper...'
      },
      {
        id: 2,
        briefing: 'HR says there should only be Active employees on payroll. Check if there are any employees with a status other than "Active".',
        task: 'Find all employees whose status is NOT "Active".',
        hint: 'Use WHERE status != \'Active\' or WHERE status <> \'Active\'',
        validate: (result) => {
          if (!result.success || !result.results?.length) return false;
          const r = result.results[0];
          return r.values?.length >= 1 && r.values.some(row => row.includes('Inactive'));
        },
        answer: "SELECT name, department, status FROM employees WHERE status != 'Active';",
        revelation: ' Found them! There are Inactive employees still in the system. But are they still being paid? Let\'s check their salaries...'
      },
      {
        id: 3,
        briefing: 'Now find the total salary being paid to Inactive employees. That\'s money going to "ghosts"!',
        task: 'Calculate the total salary of all Inactive employees.',
        hint: 'Use SUM(salary) with WHERE status = \'Inactive\'',
        validate: (result) => {
          if (!result.success || !result.results?.length) return false;
          const r = result.results[0];
          return r.values?.length === 1 && Number(r.values[0][0]) > 0;
        },
        answer: "SELECT SUM(salary) as ghost_payroll FROM employees WHERE status = 'Inactive';",
        revelation: ' Case solved! The company is paying salary to Inactive employees. You\'ve uncovered the ghost payroll!'
      }
    ]
  },
  {
    id: 'missing_revenue',
    title: 'The Missing Revenue',
    icon: '',
    difficulty: 'medium',
    intro: 'The sales team claims record orders, but Finance says revenue is down. Something doesn\'t add up. Investigate the orders, customers, and products tables to find where the money went.',
    clues: [
      {
        id: 1,
        briefing: 'Let\'s start by checking the order statuses. How many orders are in each status?',
        task: 'Count orders grouped by their status.',
        hint: 'Use COUNT(*) with GROUP BY status on the orders table',
        validate: (result) => {
          if (!result.success || !result.results?.length) return false;
          const r = result.results[0];
          return r.columns?.length === 2 && r.values?.length >= 2;
        },
        answer: 'SELECT status, COUNT(*) as order_count FROM orders GROUP BY status;',
        revelation: ' Interesting! There are Cancelled and Returned orders. Those don\'t generate revenue. Let\'s see how much was lost...'
      },
      {
        id: 2,
        briefing: 'Calculate the total revenue LOST from orders that were Cancelled or Returned.',
        task: 'Find the sum of total_amount for Cancelled and Returned orders.',
        hint: 'Use SUM(total_amount) with WHERE status IN (\'Cancelled\', \'Returned\')',
        validate: (result) => {
          if (!result.success || !result.results?.length) return false;
          const r = result.results[0];
          return r.values?.length >= 1 && Number(r.values[0][0]) > 0;
        },
        answer: "SELECT SUM(total_amount) as lost_revenue FROM orders WHERE status IN ('Cancelled', 'Returned');",
        revelation: ' That\'s a significant amount of lost revenue! But who is responsible? Let\'s find the customers involved...'
      },
      {
        id: 3,
        briefing: 'Find which customers have the most Cancelled or Returned orders. Join with customers to get their names.',
        task: 'List customer names with their count of Cancelled/Returned orders, sorted by count descending.',
        hint: 'JOIN orders with customers, filter status, GROUP BY customer name, ORDER BY count DESC',
        validate: (result) => {
          if (!result.success || !result.results?.length) return false;
          const r = result.results[0];
          return r.values?.length >= 1 && r.columns?.length >= 2;
        },
        answer: "SELECT c.name, COUNT(*) as bad_orders FROM orders o JOIN customers c ON o.customer_id = c.id WHERE o.status IN ('Cancelled', 'Returned') GROUP BY c.name ORDER BY bad_orders DESC;",
        revelation: ' Case cracked! You\'ve identified the customers behind the revenue gap. The sales team was counting these as wins!'
      },
      {
        id: 4,
        briefing: 'Final check — compare the Delivered revenue vs total order value to show Finance the real picture.',
        task: 'Show total_amount summed by status for all order statuses.',
        hint: 'Use SUM(total_amount) GROUP BY status, ORDER BY the sum descending',
        validate: (result) => {
          if (!result.success || !result.results?.length) return false;
          const r = result.results[0];
          return r.values?.length >= 2 && r.columns?.length >= 2;
        },
        answer: 'SELECT status, SUM(total_amount) as revenue FROM orders GROUP BY status ORDER BY revenue DESC;',
        revelation: ' Mystery solved! The revenue breakdown by status shows exactly where the gap is. Excellent detective work!'
      }
    ]
  },
  {
    id: 'data_heist',
    title: 'The Data Heist',
    icon: '',
    difficulty: 'hard',
    intro: 'A security breach has been detected! Someone may have been placing suspiciously large orders. Analyze the orders, products, and customers data to find the unusual patterns and track down the culprit.',
    clues: [
      {
        id: 1,
        briefing: 'Find orders with unusually high quantities. Normal orders have quantity ≤ 5. Find orders above that.',
        task: 'List all orders where quantity is greater than 5, showing the order id, quantity, and total_amount.',
        hint: 'SELECT columns FROM orders WHERE quantity > 5',
        validate: (result) => {
          if (!result.success || !result.results?.length) return false;
          const r = result.results[0];
          return r.values?.length >= 1 && r.columns?.length >= 2;
        },
        answer: 'SELECT id, customer_id, quantity, total_amount FROM orders WHERE quantity > 5 ORDER BY quantity DESC;',
        revelation: ' Several high-quantity orders found! Let\'s trace who placed them...'
      },
      {
        id: 2,
        briefing: 'Find the customers who placed these high-quantity orders. We need names and cities.',
        task: 'Join orders with customers to find names and cities of customers with orders having quantity > 5.',
        hint: 'JOIN orders with customers ON customer_id, filter WHERE quantity > 5, SELECT DISTINCT customer info',
        validate: (result) => {
          if (!result.success || !result.results?.length) return false;
          const r = result.results[0];
          return r.values?.length >= 1;
        },
        answer: "SELECT DISTINCT c.name, c.city, c.country FROM orders o JOIN customers c ON o.customer_id = c.id WHERE o.quantity > 5;",
        revelation: ' Suspects identified! Now let\'s check which products they targeted...'
      },
      {
        id: 3,
        briefing: 'What products are in these suspicious orders? Find the product names and their total ordered quantity from high-quantity orders.',
        task: 'Join orders with products, filter quantity > 5, show product name and total quantity ordered, sorted by total desc.',
        hint: 'JOIN orders with products ON product_id, WHERE quantity > 5, GROUP BY product name, SUM quantity',
        validate: (result) => {
          if (!result.success || !result.results?.length) return false;
          const r = result.results[0];
          return r.values?.length >= 1 && r.columns?.length >= 2;
        },
        answer: 'SELECT p.name, SUM(o.quantity) as total_qty FROM orders o JOIN products p ON o.product_id = p.id WHERE o.quantity > 5 GROUP BY p.name ORDER BY total_qty DESC;',
        revelation: ' High-value products are being bulk-ordered! This looks like a coordinated scheme...'
      },
      {
        id: 4,
        briefing: 'Check if these suspicious orders depleted product stock. Find products where stock is below 20.',
        task: 'Find products with stock less than 20, showing name, category, stock, and price.',
        hint: 'SELECT from products WHERE stock < 20 ORDER BY stock',
        validate: (result) => {
          if (!result.success || !result.results?.length) return false;
          const r = result.results[0];
          return r.values?.length >= 1;
        },
        answer: 'SELECT name, category, stock, price FROM products WHERE stock < 20 ORDER BY stock ASC;',
        revelation: ' Several products are nearly out of stock! The heist depleted inventory.'
      },
      {
        id: 5,
        briefing: 'Final report! Calculate the total financial exposure. Show each suspect customer, how many suspicious orders they placed, and the total value.',
        task: 'Create a suspect report: customer name, count of orders with qty > 5, and total value of those orders. Sort by total value descending.',
        hint: 'JOIN all three tables, WHERE quantity > 5, GROUP BY customer name, use COUNT and SUM',
        validate: (result) => {
          if (!result.success || !result.results?.length) return false;
          const r = result.results[0];
          return r.values?.length >= 1 && r.columns?.length >= 3;
        },
        answer: "SELECT c.name as suspect, COUNT(*) as suspicious_orders, SUM(o.total_amount) as total_exposure FROM orders o JOIN customers c ON o.customer_id = c.id WHERE o.quantity > 5 GROUP BY c.name ORDER BY total_exposure DESC;",
        revelation: ' CASE CLOSED! You\'ve identified every suspect, their orders, and the total financial exposure. Brilliant detective work!'
      }
    ]
  }
];

const DET_KEY = 'sqldet_progress';
let detState = { currentCase: null, currentClue: 0, solved: [], hintUsed: false };

function loadDetProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem(DET_KEY) || '{}');
    detState.solved = saved.solved || [];
  } catch { detState.solved = []; }
}

function saveDetProgress() {
  localStorage.setItem(DET_KEY, JSON.stringify({ solved: detState.solved }));
}

/* ---------- RENDER ---------- */

export function renderDetective() {
  loadDetProgress();
  return `
  <div class="page-header" style="text-align:center;margin-bottom:32px;">
    <div style="font-size:3.5rem;margin-bottom:8px;"></div>
    <h1 class="page-title">SQL Detective</h1>
    <p class="page-subtitle">Solve mysteries by writing real SQL queries. Every clue brings you closer to the truth.</p>
  </div>

  <!-- Case Selection -->
  <div id="det-case-select" style="max-width:900px;margin:0 auto;">
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:20px;">
      ${CASES.map(c => {
        const isSolved = detState.solved.includes(c.id);
        return `
        <div class="card det-case-card" data-case="${c.id}" style="cursor:pointer;position:relative;overflow:hidden;transition:all 0.3s ease;">
          ${isSolved ? '<div style="position:absolute;top:12px;right:12px;background:var(--accent-green-light);color:var(--accent-green-dark);font-size:0.7rem;font-weight:800;padding:3px 10px;border-radius:var(--radius-pill);text-transform:uppercase;"> Solved</div>' : ''}
          <div style="font-size:3rem;margin-bottom:12px;">${c.icon}</div>
          <div style="font-weight:900;font-size:1.1rem;color:var(--text-primary);margin-bottom:6px;">${c.title}</div>
          <span class="diff-tag ${c.difficulty}" style="margin-bottom:12px;display:inline-block;">${c.difficulty.toUpperCase()}</span>
          <p style="font-size:0.82rem;color:var(--text-muted);font-weight:600;line-height:1.7;margin-top:8px;">${c.intro.slice(0, 120)}...</p>
          <div style="margin-top:16px;font-weight:800;font-size:0.78rem;color:var(--accent-primary);">
            ${c.clues.length} Clues to investigate →
          </div>
        </div>`;
      }).join('')}
    </div>

    <div style="text-align:center;margin-top:32px;">
      <div class="card" style="display:inline-block;padding:16px 28px;">
        <span style="font-weight:800;font-size:0.82rem;color:var(--text-muted);">
           Cases Solved: <span style="color:var(--accent-primary);">${detState.solved.length} / ${CASES.length}</span>
        </span>
      </div>
    </div>
  </div>

  <!-- Investigation Screen -->
  <div id="det-investigation" style="display:none;max-width:800px;margin:0 auto;">
    <!-- Case header -->
    <div class="card" style="margin-bottom:20px;background:var(--accent-pink-light);border-color:var(--accent-primary);">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
        <div style="display:flex;align-items:center;gap:12px;">
          <span id="det-case-icon" style="font-size:2rem;"></span>
          <div>
            <div id="det-case-title" style="font-weight:900;font-size:1.1rem;color:var(--text-primary);"></div>
            <span id="det-case-diff" class="diff-tag easy" style="margin-top:4px;display:inline-block;"></span>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:16px;">
          <span id="det-clue-counter" style="font-weight:800;font-size:0.85rem;color:var(--text-muted);"></span>
          <button class="btn btn-secondary btn-sm" id="det-back-btn">← Cases</button>
        </div>
      </div>
      <!-- Progress bar -->
      <div style="width:100%;height:6px;background:rgba(255,255,255,0.4);border-radius:3px;margin-top:14px;overflow:hidden;">
        <div id="det-progress-bar" style="height:100%;background:var(--accent-green);border-radius:3px;transition:width 0.5s ease;width:0%;"></div>
      </div>
    </div>

    <!-- Briefing card -->
    <div class="card" style="margin-bottom:20px;border-left:4px solid var(--accent-primary);">
      <div style="font-weight:800;font-size:0.72rem;color:var(--accent-primary);text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;"> Briefing</div>
      <div id="det-briefing" style="font-size:0.9rem;font-weight:600;color:var(--text-secondary);line-height:1.8;"></div>
      <div style="margin-top:12px;padding:10px 14px;background:var(--bg-tertiary);border-radius:var(--radius-sm);border:1px dashed var(--border-color);">
        <span style="font-weight:800;font-size:0.75rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;"> Task: </span>
        <span id="det-task" style="font-size:0.85rem;font-weight:700;color:var(--text-primary);"></span>
      </div>
    </div>

    <!-- SQL Editor -->
    <div class="editor-chrome" style="margin-bottom:16px;">
      <div class="editor-chrome-bar">
        <span class="editor-chrome-label">>_ INVESTIGATE <span style="opacity:.5;font-size:.7rem;margin-left:8px;">CTRL+ENTER to run</span></span>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-sm btn-secondary" id="det-hint-btn" title="Get a hint"> Hint</button>
          <button class="btn btn-sm btn-accent" id="det-run-btn"> Run Query</button>
        </div>
      </div>
      <textarea class="sql-editor" id="det-editor" placeholder="-- Write your SQL query here..." style="min-height:120px;"></textarea>
    </div>

    <!-- Hint box -->
    <div id="det-hint-box" class="hint-box" style="margin-bottom:16px;"></div>

    <!-- Results / Feedback -->
    <div id="det-results" style="min-height:60px;"></div>
  </div>

  <!-- Case Solved Screen -->
  <div id="det-solved-screen" style="display:none;max-width:520px;margin:0 auto;">
    <div class="card" style="text-align:center;padding:48px 40px;">
      <div style="font-size:4.5rem;margin-bottom:12px;"></div>
      <div style="font-weight:900;font-size:1.5rem;color:var(--accent-primary);margin-bottom:8px;">Case Closed!</div>
      <div id="det-solved-title" style="font-weight:800;font-size:1rem;color:var(--text-primary);margin-bottom:24px;"></div>
      <div id="det-solved-stats" style="font-size:0.88rem;color:var(--text-muted);font-weight:700;margin-bottom:32px;line-height:1.8;"></div>
      <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
        <button class="btn btn-primary" id="det-next-case-btn" style="padding:12px 28px;"> Next Case</button>
        <button class="btn btn-secondary" id="det-all-cases-btn" style="padding:12px 28px;"> All Cases</button>
      </div>
    </div>
  </div>`;
}

/* ---------- INIT ---------- */

export function initDetective() {
  loadDetProgress();

  // Case card clicks
  document.querySelectorAll('.det-case-card').forEach(card => {
    card.addEventListener('click', () => startCase(card.dataset.case));
  });

  document.getElementById('det-back-btn')?.addEventListener('click', backToCases);
  document.getElementById('det-run-btn')?.addEventListener('click', runDetQuery);
  document.getElementById('det-hint-btn')?.addEventListener('click', showDetHint);
  document.getElementById('det-all-cases-btn')?.addEventListener('click', backToCases);
  document.getElementById('det-next-case-btn')?.addEventListener('click', goNextCase);

  document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.key === 'Enter' && detState.currentCase) runDetQuery();
  });
}

/* ---------- GAME LOGIC ---------- */

function startCase(caseId) {
  const c = CASES.find(x => x.id === caseId);
  if (!c) return;
  detState.currentCase = c;
  detState.currentClue = 0;
  detState.hintUsed = false;

  document.getElementById('det-case-select').style.display = 'none';
  document.getElementById('det-solved-screen').style.display = 'none';
  document.getElementById('det-investigation').style.display = 'block';

  document.getElementById('det-case-icon').textContent = c.icon;
  document.getElementById('det-case-title').textContent = c.title;
  const diffTag = document.getElementById('det-case-diff');
  diffTag.textContent = c.difficulty.toUpperCase();
  diffTag.className = 'diff-tag ' + c.difficulty;

  loadClue();
  setupSyntaxHighlighting();
}

function loadClue() {
  const c = detState.currentCase;
  const clueIdx = detState.currentClue;

  if (clueIdx >= c.clues.length) { solveCase(); return; }

  const clue = c.clues[clueIdx];
  detState.hintUsed = false;

  document.getElementById('det-clue-counter').textContent = `Clue ${clueIdx + 1} / ${c.clues.length}`;
  const pct = (clueIdx / c.clues.length) * 100;
  document.getElementById('det-progress-bar').style.width = pct + '%';
  document.getElementById('det-briefing').textContent = clue.briefing;
  document.getElementById('det-task').textContent = clue.task;
  document.getElementById('det-editor').value = '';
  document.getElementById('det-editor').disabled = false;
  document.getElementById('det-run-btn').disabled = false;
  document.getElementById('det-results').innerHTML = '';
  document.getElementById('det-hint-box').classList.remove('visible');
  document.getElementById('det-hint-box').innerHTML = '';
}

function showDetHint() {
  const c = detState.currentCase;
  if (!c) return;
  const clue = c.clues[detState.currentClue];
  if (!clue) return;
  detState.hintUsed = true;
  const hintBox = document.getElementById('det-hint-box');
  hintBox.innerHTML = `<span style="font-weight:800;color:var(--accent-primary);"> Hint:</span> <span style="color:var(--text-secondary);">${escapeHtml(clue.hint)}</span>`;
  hintBox.classList.add('visible');
}

function runDetQuery() {
  const editor = document.getElementById('det-editor');
  if (editor.disabled) return;
  const query = editor.value.trim();
  const resultsDiv = document.getElementById('det-results');

  if (!query) {
    resultsDiv.innerHTML = '<div class="feedback feedback-info"><span class="feedback-icon">ℹ</span><span>Write a query first!</span></div>';
    return;
  }

  const c = detState.currentCase;
  const clue = c.clues[detState.currentClue];
  const result = sqlEngine.exec(query);

  if (!result.success) {
    resultsDiv.innerHTML = `<div class="feedback feedback-error"><span class="feedback-icon"></span><span>${escapeHtml(result.error)}</span></div>`;
    return;
  }

  // Show query results
  const tableHTML = sqlEngine.renderResults(result.results);

  // Validate
  const passed = clue.validate(result);

  if (passed) {
    editor.disabled = true;
    document.getElementById('det-run-btn').disabled = true;
    resultsDiv.innerHTML = `
      ${tableHTML}
      <div style="margin-top:16px;padding:16px 20px;background:var(--accent-green-light);border:1.5px solid var(--accent-green-border);border-radius:var(--radius-md);animation:fadeIn 0.4s ease;">
        <div style="font-weight:900;font-size:0.9rem;color:var(--accent-green-dark);margin-bottom:8px;"> Clue Cracked!</div>
        <div style="font-size:0.85rem;color:var(--accent-green-dark);font-weight:600;line-height:1.7;">${clue.revelation}</div>
      </div>
      <div style="margin-top:12px;padding:14px 18px;background:var(--bg-editor);border-radius:10px;border:1.5px solid var(--border-color);">
        <div style="font-weight:800;font-size:0.7rem;color:var(--accent-green);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;"> Reference Answer</div>
        <pre style="color:#a0c4ff;font-size:0.85rem;white-space:pre-wrap;margin:0;font-family:var(--font-mono);line-height:1.6;">${escapeHtml(clue.answer)}</pre>
      </div>
      <div style="text-align:right;margin-top:16px;">
        <button class="btn btn-primary" id="det-next-clue-btn" style="padding:10px 28px;font-size:0.88rem;">
          ${detState.currentClue + 1 >= c.clues.length ? ' Solve Case' : ' Next Clue →'}
        </button>
      </div>`;

    document.getElementById('det-next-clue-btn').addEventListener('click', () => {
      detState.currentClue++;
      loadClue();
    });
  } else {
    resultsDiv.innerHTML = `
      ${tableHTML}
      <div style="margin-top:16px;padding:14px 18px;background:#fff0f0;border:1.5px solid #ffb3b3;border-radius:var(--radius-md);animation:fadeIn 0.3s ease;">
        <div style="font-weight:800;font-size:0.88rem;color:#c0392b;"> Not quite — the results don't match what we're looking for.</div>
        <div style="font-size:0.82rem;color:#c0392b;font-weight:600;margin-top:4px;">Re-read the task and try again. Use the Hint button if you're stuck!</div>
      </div>`;
  }
}

function solveCase() {
  const c = detState.currentCase;
  if (!detState.solved.includes(c.id)) {
    detState.solved.push(c.id);
    saveDetProgress();
  }

  document.getElementById('det-investigation').style.display = 'none';
  document.getElementById('det-solved-screen').style.display = 'block';
  document.getElementById('det-solved-title').textContent = `"${c.title}" — Investigation Complete`;
  document.getElementById('det-solved-stats').innerHTML = `
    You uncovered all <strong>${c.clues.length} clues</strong> and solved the case!<br>
    Total cases solved: <strong style="color:var(--accent-primary);">${detState.solved.length} / ${CASES.length}</strong>`;
}

function backToCases() {
  detState.currentCase = null;
  document.getElementById('det-investigation').style.display = 'none';
  document.getElementById('det-solved-screen').style.display = 'none';
  document.getElementById('det-case-select').style.display = 'block';

  // Re-render solved badges
  document.querySelectorAll('.det-case-card').forEach(card => {
    const isSolved = detState.solved.includes(card.dataset.case);
    const badge = card.querySelector('.det-solved-badge');
    if (isSolved && !badge) {
      const el = document.createElement('div');
      el.className = 'det-solved-badge';
      el.style.cssText = 'position:absolute;top:12px;right:12px;background:var(--accent-green-light);color:var(--accent-green-dark);font-size:0.7rem;font-weight:800;padding:3px 10px;border-radius:var(--radius-pill);text-transform:uppercase;';
      el.textContent = ' Solved';
      card.appendChild(el);
    }
  });
}

function goNextCase() {
  const currentIdx = CASES.findIndex(c => c.id === detState.currentCase?.id);
  const nextIdx = (currentIdx + 1) % CASES.length;
  const nextCase = CASES[nextIdx];
  if (nextCase) {
    startCase(nextCase.id);
  } else {
    backToCases();
  }
}
