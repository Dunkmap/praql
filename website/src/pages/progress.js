import { ProgressManager } from '../engine/progress.js';
import { escapeHtml } from '../engine/sql-engine.js';

export function renderProgress() {
  return `
  <div class="page-header">
    <h1 class="page-title">Progress Dashboard</h1>
    <p class="page-subtitle">Track your SQL mastery journey.</p>
  </div>

  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px;margin-bottom:32px;" id="stats-grid"></div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:32px;">
    <div class="card">
      <div class="card-title" style="margin-bottom:12px;">📈 7-DAY ACTIVITY</div>
      <div id="progress-activity" style="height:160px;"></div>
    </div>
    <div class="card">
      <div class="card-title" style="margin-bottom:12px;">⏱ SPEED STATS</div>
      <div id="speed-stats"></div>
    </div>
  </div>

  <div class="card" style="margin-bottom:24px;">
    <div class="card-title" style="margin-bottom:12px;">🧩 CLAUSE MASTERY</div>
    <div id="clause-mastery" style="display:flex;flex-wrap:wrap;gap:6px;"></div>
  </div>

  <div style="text-align:center;margin-top:32px;">
    <button class="btn btn-secondary" id="reset-progress-btn" style="color:var(--accent-red);border-color:var(--accent-red);">↺ Reset All Progress</button>
  </div>`;
}

export async function initProgress() {
  const progress = await ProgressManager.getProgress();
  renderStats(progress);
  ProgressManager.renderActivityChart('progress-activity', progress, 140);
  renderSpeedStats(progress);
  renderClauseMastery(progress);

  document.getElementById('reset-progress-btn')?.addEventListener('click', async () => {
    if (confirm('Reset ALL progress? This cannot be undone.')) {
      await ProgressManager.resetProgress();
      location.reload();
    }
  });
}

function renderStats(progress) {
  const grid = document.getElementById('stats-grid');
  if (!grid) return;
  const stats = [
    { icon: '🎯', label: 'Questions Solved', value: progress.questionsSolved || 0 },
    { icon: '📝', label: 'Attempted', value: progress.questionsAttempted || 0 },
    { icon: '🔥', label: 'Current Streak', value: `${progress.streak || 0}d` },
    { icon: '📚', label: 'Topics Done', value: progress.topicsCompleted?.length || 0 },
    { icon: '🧩', label: 'Clauses Mastered', value: progress.clausesMastered?.length || 0 },
  ];
  grid.innerHTML = stats.map(s => `
    <div class="card" style="text-align:center;padding:20px;">
      <div style="font-size:1.8rem;margin-bottom:8px;">${s.icon}</div>
      <div style="font-size:1.6rem;font-weight:900;color:var(--accent-primary);">${s.value}</div>
      <div style="font-size:0.72rem;color:var(--text-muted);font-weight:700;margin-top:4px;text-transform:uppercase;">${s.label}</div>
    </div>
  `).join('');
}

function renderSpeedStats(progress) {
  const container = document.getElementById('speed-stats');
  if (!container) return;
  const speed = ProgressManager.getSpeedStats(progress);
  container.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
      <div style="text-align:center;padding:12px;background:var(--bg-tertiary);border-radius:var(--radius-sm);">
        <div style="font-size:1.2rem;font-weight:900;color:var(--accent-green);">${ProgressManager.formatTime(speed.avg)}</div>
        <div style="font-size:0.65rem;color:var(--text-muted);font-weight:700;">AVG SOLVE</div>
      </div>
      <div style="text-align:center;padding:12px;background:var(--bg-tertiary);border-radius:var(--radius-sm);">
        <div style="font-size:1.2rem;font-weight:900;color:var(--accent-cyan);">${ProgressManager.formatTime(speed.fastest)}</div>
        <div style="font-size:0.65rem;color:var(--text-muted);font-weight:700;">FASTEST</div>
      </div>
    </div>
    <div style="text-align:center;margin-top:12px;font-size:0.75rem;color:var(--text-muted);font-weight:600;">
      Total: ${ProgressManager.formatTime(speed.total)} across ${speed.count} correct answers
    </div>`;
}

function renderClauseMastery(progress) {
  const container = document.getElementById('clause-mastery');
  if (!container) return;
  const mastered = new Set(progress.clausesMastered || []);
  if (typeof SQL_CLAUSE_TAXONOMY !== 'undefined') {
    const allClauses = Object.values(SQL_CLAUSE_TAXONOMY).flatMap(cat => cat.clauses);
    container.innerHTML = allClauses.map(c => `<span class="clause-chip ${mastered.has(c) ? 'mastered' : 'locked'}">${mastered.has(c) ? '✓' : '○'} ${c}</span>`).join('');
  } else {
    const clauses = progress.clausesMastered || [];
    container.innerHTML = clauses.length > 0
      ? clauses.map(c => `<span class="clause-chip mastered">✓ ${c}</span>`).join('')
      : '<span style="color:var(--text-muted);font-size:0.85rem;">Solve practice questions to master clauses.</span>';
  }
}

