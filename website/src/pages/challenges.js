import { sqlEngine, escapeHtml, setupSyntaxHighlighting } from '../engine/sql-engine.js';

let challengeSets = [];
let currentSetIndex = -1;
let currentQIndex = 0;

export function renderChallenges() {
  return `
  <div class="page-header">
    <h1 class="page-title">🏆 AI Challenges</h1>
    <p class="page-subtitle">Create or load your own challenge sets.</p>
  </div>

  <div class="card" style="margin-bottom:24px;">
    <div class="card-title" style="margin-bottom:12px;">CREATE NEW CHALLENGE SET</div>
    <div style="display:flex;gap:10px;margin-bottom:12px;">
      <input type="text" id="set-name-input" class="sql-editor" style="height:42px;min-height:42px;background:var(--bg-input);color:var(--text-primary);border:1.5px solid var(--border-color);border-radius:var(--radius-sm);font-size:0.85rem;padding:8px 14px;flex:1;" placeholder="Challenge set name">
      <button class="btn btn-sm btn-primary" id="create-set-btn">+ Create</button>
    </div>
    <p style="font-size:0.72rem;color:var(--text-muted);">Create a set, then add questions with JSON format or paste AI-generated ones.</p>
  </div>

  <div class="card" style="margin-bottom:24px;">
    <div class="card-title" style="margin-bottom:12px;">📦 YOUR CHALLENGE SETS</div>
    <div id="challenge-sets-list"></div>
  </div>

  <div id="challenge-play-area" style="display:none;">
    <div class="card" style="margin-bottom:24px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <div id="ch-set-title" style="font-weight:800;color:var(--accent-primary);"></div>
        <div id="ch-counter" style="font-size:0.75rem;color:var(--text-muted);font-weight:700;"></div>
      </div>
      <div id="ch-question-text" style="font-size:1rem;font-weight:600;margin-bottom:16px;line-height:1.6;"></div>
      <div class="editor-chrome">
        <div class="editor-chrome-bar">
          <span class="editor-chrome-label">>_ YOUR_ANSWER</span>
          <button class="btn btn-sm btn-accent" id="ch-run-btn">▶ Run</button>
        </div>
        <textarea class="sql-editor" id="ch-editor" placeholder="Write your SQL..."></textarea>
      </div>
      <div id="ch-result" style="margin-top:16px;"></div>
      <div style="display:flex;justify-content:space-between;margin-top:16px;">
        <button class="btn btn-secondary btn-sm" id="ch-prev-btn">← Prev</button>
        <button class="btn btn-secondary btn-sm" id="ch-next-btn">Next →</button>
      </div>
    </div>
  </div>

  <div class="card">
    <div class="card-title" style="margin-bottom:12px;">📥 IMPORT QUESTIONS (JSON)</div>
    <textarea id="import-json" class="sql-editor" style="height:100px;min-height:100px;background:var(--bg-input);color:var(--text-primary);border:1.5px solid var(--border-color);border-radius:var(--radius-md);font-size:0.82rem;" placeholder='[{"question":"...","expected_query":"...","hint":"..."}]'></textarea>
    <div style="display:flex;justify-content:flex-end;margin-top:10px;">
      <button class="btn btn-sm btn-primary" id="import-btn">Import</button>
    </div>
  </div>`;
}

export function initChallenges() {
  challengeSets = JSON.parse(localStorage.getItem('sqlmaster_challenges') || '[]');
  renderSetsList();

  document.getElementById('create-set-btn')?.addEventListener('click', () => {
    const name = document.getElementById('set-name-input')?.value.trim();
    if (!name) return;
    challengeSets.push({ name, questions: [], created: new Date().toISOString() });
    saveSets();
    renderSetsList();
    document.getElementById('set-name-input').value = '';
  });

  document.getElementById('import-btn')?.addEventListener('click', () => {
    if (currentSetIndex < 0) return alert('Select a challenge set first.');
    try {
      const json = JSON.parse(document.getElementById('import-json')?.value);
      if (Array.isArray(json)) {
        json.forEach(q => { q.id = 'ch_' + Date.now() + '_' + Math.random().toString(36).slice(2,6); });
        challengeSets[currentSetIndex].questions.push(...json);
        saveSets(); renderSetsList();
        document.getElementById('import-json').value = '';
        alert(`Imported ${json.length} questions!`);
      }
    } catch (e) { alert('Invalid JSON format.'); }
  });

  document.getElementById('ch-run-btn')?.addEventListener('click', runChallenge);
  document.getElementById('ch-prev-btn')?.addEventListener('click', () => { if (currentQIndex > 0) { currentQIndex--; renderChallengeQuestion(); } });
  document.getElementById('ch-next-btn')?.addEventListener('click', () => {
    const set = challengeSets[currentSetIndex];
    if (set && currentQIndex < set.questions.length - 1) { currentQIndex++; renderChallengeQuestion(); }
  });
}

function saveSets() { localStorage.setItem('sqlmaster_challenges', JSON.stringify(challengeSets)); }

function renderSetsList() {
  const container = document.getElementById('challenge-sets-list');
  if (!container) return;
  if (challengeSets.length === 0) {
    container.innerHTML = '<div style="color:var(--text-muted);font-size:0.85rem;">No challenge sets yet.</div>';
    return;
  }
  container.innerHTML = challengeSets.map((s, i) => `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:12px;border:1.5px solid var(--border-color);border-radius:var(--radius-sm);margin-bottom:8px;background:var(--bg-card);cursor:pointer;transition:all var(--transition);" class="challenge-set-item" data-idx="${i}">
      <div>
        <span style="font-weight:800;color:var(--text-primary);font-size:0.9rem;">${escapeHtml(s.name)}</span>
        <span style="font-size:0.72rem;color:var(--text-muted);margin-left:8px;">${s.questions.length} questions</span>
      </div>
      <div style="display:flex;gap:6px;">
        <button class="btn btn-sm btn-accent play-set-btn" data-idx="${i}">▶</button>
        <button class="btn btn-sm btn-secondary delete-set-btn" data-idx="${i}" style="color:var(--accent-red);">✕</button>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.play-set-btn').forEach(btn => {
    btn.addEventListener('click', (e) => { e.stopPropagation(); currentSetIndex = parseInt(btn.dataset.idx); currentQIndex = 0; openPlayArea(); });
  });
  container.querySelectorAll('.delete-set-btn').forEach(btn => {
    btn.addEventListener('click', (e) => { e.stopPropagation(); if (confirm('Delete this set?')) { challengeSets.splice(parseInt(btn.dataset.idx), 1); saveSets(); renderSetsList(); } });
  });
}

function openPlayArea() {
  const area = document.getElementById('challenge-play-area');
  if (area) area.style.display = 'block';
  renderChallengeQuestion();
}

function renderChallengeQuestion() {
  const set = challengeSets[currentSetIndex];
  if (!set || set.questions.length === 0) return;
  const q = set.questions[currentQIndex];
  document.getElementById('ch-set-title').textContent = set.name;
  document.getElementById('ch-counter').textContent = `${currentQIndex + 1} / ${set.questions.length}`;
  document.getElementById('ch-question-text').textContent = q.question;
  document.getElementById('ch-editor').value = '';
  document.getElementById('ch-result').innerHTML = '';
  setTimeout(setupSyntaxHighlighting, 100);
}

function runChallenge() {
  const query = document.getElementById('ch-editor')?.value.trim();
  const resDiv = document.getElementById('ch-result');
  if (!query || !resDiv) return;
  const result = sqlEngine.exec(query);
  resDiv.innerHTML = result.success ? sqlEngine.renderResults(result.results) : `<div class="feedback feedback-error"><span class="feedback-icon">❌</span><span>${escapeHtml(result.error)}</span></div>`;
}
