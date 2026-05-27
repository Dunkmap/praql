import { ProgressManager } from '../engine/progress.js';
import { escapeHtml } from '../engine/sql-engine.js';

export function renderProgress() {
  const savedName = localStorage.getItem('sqlmaster-username') || '';
  const savedEmoji = localStorage.getItem('sqlmaster-useremoji') !== null ? parseInt(localStorage.getItem('sqlmaster-useremoji')) : 0;

  let profileHtml = '';
  if (savedName) {
    const emojiSvg = getEmojiSvg(savedEmoji);
    const avatarHtml = `<div class="icon-3d" style="width:60px;height:60px;border-radius:16px;background:var(--bg-secondary);border:1.5px solid var(--border-color);display:flex;align-items:center;justify-content:center;box-shadow:var(--shadow-sm);flex-shrink:0;">
      <div class="icon-3d-inner" style="display:flex;align-items:center;justify-content:center;">
        ${emojiSvg}
      </div>
    </div>`;

    profileHtml = `
      <div class="card" style="margin-bottom:24px;padding:20px 28px;display:flex;align-items:center;gap:20px;border-color:var(--accent-primary);background:var(--accent-pink-light);animation:fadeIn 0.5s ease;">
        ${avatarHtml}
        <div>
          <div style="font-size:1.25rem;font-weight:900;color:var(--accent-primary);">${escapeHtml(savedName)}</div>
          <div style="font-size:0.78rem;color:var(--text-secondary);font-weight:600;margin-top:2px;">SQL Master Guild Member · Profile Active</div>
        </div>
      </div>`;
  } else {
    // Elegant in-line setup widget when profile isn't configured yet
    profileHtml = `
      <div class="card" style="margin-bottom:28px;padding:28px;border-color:var(--border-color);background:var(--bg-card);animation:fadeIn 0.5s ease;">
        <div style="font-size:0.8rem;font-weight:800;letter-spacing:1px;color:var(--accent-primary);margin-bottom:12px;text-transform:uppercase;"> Personalize Your Journey</div>
        <h3 style="font-size:1.2rem;font-weight:900;margin-bottom:8px;color:var(--text-primary);">Create Your Guild Profile</h3>
        <p style="font-size:0.82rem;color:var(--text-muted);margin-bottom:20px;font-weight:500;">Choose an interactive 3D avatar and enter your name to activate your personalized SQL mastery dashboard.</p>
        
        <div style="display:flex;gap:24px;align-items:center;flex-wrap:wrap;">
          <!-- 3D Emojis Selection in Progress -->
          <div class="profile-3d-emojis" id="progress-3d-emojis" style="display:flex;gap:12px;">
            <div class="emoji-3d" id="progress-avatar-toggle" data-idx="${savedEmoji}" title="Click to toggle SQL Master Avatar">
              <div class="emoji-3d-body" style="width:52px;height:52px;border-radius:12px;">
                ${getEmojiSvg(savedEmoji)}
              </div>
            </div>
          </div>
          
          <div style="display:flex;gap:10px;align-items:center;flex:1;max-width:320px;">
            <input type="text" id="progress-name-input" class="profile-name-input" placeholder="Enter your name..." style="background:var(--bg-tertiary);" maxlength="30" autocomplete="off" spellcheck="false">
            <button class="btn btn-primary" id="progress-save-btn">Save</button>
          </div>
        </div>
      </div>`;
  }

  return `
  <div class="page-header">
    <h1 class="page-title">Progress Dashboard</h1>
    <p class="page-subtitle">Track your SQL mastery journey.</p>
  </div>

  ${profileHtml}

  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px;margin-bottom:32px;" id="stats-grid"></div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:32px;">
    <div class="card">
      <div class="card-title" style="margin-bottom:12px;"> 7-DAY ACTIVITY</div>
      <div id="progress-activity" style="height:160px;"></div>
    </div>
    <div class="card">
      <div class="card-title" style="margin-bottom:12px;"> SPEED STATS</div>
      <div id="speed-stats"></div>
    </div>
  </div>

  <div class="card" style="margin-bottom:24px;">
    <div class="card-title" style="margin-bottom:12px;"> CLAUSE MASTERY</div>
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

  // Handle single avatar clicking to toggle and save immediately inside progress
  const progressToggle = document.getElementById('progress-avatar-toggle');
  if (progressToggle) {
    progressToggle.addEventListener('click', () => {
      let currentIdx = parseInt(progressToggle.dataset.idx || '0');
      let newIdx = currentIdx === 0 ? 1 : 0;
      
      progressToggle.dataset.idx = newIdx;
      localStorage.setItem('sqlmaster-useremoji', newIdx);
      
      // Update SVG content inside
      const body = progressToggle.querySelector('.emoji-3d-body');
      if (body) {
        body.innerHTML = getEmojiSvg(newIdx);
        // Dynamic confirmation bounce
        body.style.transform = 'scale(1.25) translateY(-6px)';
        setTimeout(() => { body.style.transform = ''; }, 200);
      }
    });
  }

  // Bind inline profile save button inside progress
  const saveBtn = document.getElementById('progress-save-btn');
  const nameInput = document.getElementById('progress-name-input');
  if (saveBtn && nameInput) {
    saveBtn.addEventListener('click', () => {
      const name = nameInput.value.trim();
      if (name) {
        localStorage.setItem('sqlmaster-username', name);
        
        // Save selected emoji index
        const selected = document.getElementById('progress-avatar-toggle');
        if (selected) {
          localStorage.setItem('sqlmaster-useremoji', selected.dataset.idx);
        } else {
          localStorage.setItem('sqlmaster-useremoji', '0');
        }

        // Instantly reload page to showcase active Guild Profile
        location.reload();
      }
    });

    nameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') saveBtn.click();
    });

    let typingTimeout;
    const handleTypingStart = () => {
      if (progressToggle) progressToggle.classList.add('typing');
      
      clearTimeout(typingTimeout);
      typingTimeout = setTimeout(() => {
        if (progressToggle) progressToggle.classList.remove('typing');
      }, 800);
    };

    nameInput.addEventListener('input', handleTypingStart);
    nameInput.addEventListener('focus', handleTypingStart);
    nameInput.addEventListener('blur', () => {
      clearTimeout(typingTimeout);
      if (progressToggle) progressToggle.classList.remove('typing');
    });
  }

  // Initialize mouse-tracking for inline profile setup emojis
  initProgressEmojiTracking();

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
    { icon: '', label: 'Questions Solved', value: progress.questionsSolved || 0 },
    { icon: '', label: 'Attempted', value: progress.questionsAttempted || 0 },
    { icon: '', label: 'Current Streak', value: `${progress.streak || 0}d` },
    { icon: '', label: 'Topics Done', value: progress.topicsCompleted?.length || 0 },
    { icon: '', label: 'Clauses Mastered', value: progress.clausesMastered?.length || 0 },
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
    container.innerHTML = allClauses.map(c => `<span class="clause-chip ${mastered.has(c) ? 'mastered' : 'locked'}">${mastered.has(c) ? '' : ''} ${c}</span>`).join('');
  } else {
    const clauses = progress.clausesMastered || [];
    container.innerHTML = clauses.length > 0
      ? clauses.map(c => `<span class="clause-chip mastered"> ${c}</span>`).join('')
      : '<span style="color:var(--text-muted);font-size:0.85rem;">Solve practice questions to master clauses.</span>';
  }
}

function getEmojiSvg(idx) {
  const svgs = [
    // Male Face SVG
    `<svg viewBox="0 0 64 64" width="48" height="48">
      <defs>
        <linearGradient id="skin-m-s" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#fed7aa"/>
          <stop offset="100%" stop-color="#fdbb2d"/>
        </linearGradient>
        <linearGradient id="hair-m-s" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#374151"/>
          <stop offset="100%" stop-color="#111827"/>
        </linearGradient>
      </defs>
      <circle cx="14" cy="32" r="6" fill="#fdbb2d" />
      <circle cx="50" cy="32" r="6" fill="#fdbb2d" />
      <circle cx="32" cy="32" r="20" fill="url(#skin-m-s)" stroke="#ea580c" stroke-width="1.5" />
      <ellipse cx="24" cy="28" rx="5" ry="6" fill="#ffffff" stroke="#9a3412" stroke-width="1" />
      <ellipse cx="40" cy="28" rx="5" ry="6" fill="#ffffff" stroke="#9a3412" stroke-width="1" />
      <circle class="pupil" cx="24" cy="28" r="2.5" fill="#1e293b" />
      <circle class="pupil" cx="40" cy="28" r="2.5" fill="#1e293b" />
      <path class="eyebrow" d="M19 21 Q24 19 29 22" stroke="#111827" stroke-width="2" stroke-linecap="round" fill="none" />
      <path class="eyebrow" d="M45 21 Q40 19 35 22" stroke="#111827" stroke-width="2" stroke-linecap="round" fill="none" />
      <path class="mouth" d="M25 40 Q32 45 39 40" stroke="#9a3412" stroke-width="2" stroke-linecap="round" fill="none" />
      <path d="M14 26 C14 14, 50 14, 50 26 C46 22, 38 21, 32 24 C26 21, 18 22, 14 26 Z" fill="url(#hair-m-s)" />
      <path d="M12 26 L15 32 L15 26 Z" fill="url(#hair-m-s)" />
      <path d="M52 26 L49 32 L49 26 Z" fill="url(#hair-m-s)" />
    </svg>`,
    // Female Face SVG
    `<svg viewBox="0 0 64 64" width="48" height="48">
      <defs>
        <linearGradient id="skin-f-s" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#fed7aa"/>
          <stop offset="100%" stop-color="#fdbb2d"/>
        </linearGradient>
        <linearGradient id="hair-f-s" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#78350f"/>
          <stop offset="100%" stop-color="#451a03"/>
        </linearGradient>
      </defs>
      <path d="M12 30 C6 30, 6 54, 14 54 C20 54, 18 42, 18 36 Z" fill="url(#hair-f-s)" />
      <path d="M52 30 C58 30, 58 54, 50 54 C44 54, 46 42, 46 36 Z" fill="url(#hair-f-s)" />
      <circle cx="15" cy="33" r="5" fill="#fdbb2d" />
      <circle cx="49" cy="33" r="5" fill="#fdbb2d" />
      <circle cx="32" cy="32" r="19" fill="url(#skin-f-s)" stroke="#ea580c" stroke-width="1.5" />
      <ellipse cx="24" cy="28" rx="5" ry="6" fill="#ffffff" stroke="#9a3412" stroke-width="1" />
      <ellipse cx="40" cy="28" rx="5" ry="6" fill="#ffffff" stroke="#9a3412" stroke-width="1" />
      <circle class="pupil" cx="24" cy="28" r="2.5" fill="#0f766e" />
      <circle class="pupil" cx="40" cy="28" r="2.5" fill="#0f766e" />
      <path class="eyebrow" d="M18 22 Q24 19 28 23" stroke="#451a03" stroke-width="2" stroke-linecap="round" fill="none" />
      <path class="eyebrow" d="M46 22 Q40 19 36 23" stroke="#451a03" stroke-width="2" stroke-linecap="round" fill="none" />
      <path d="M17 24 L14 22" stroke="#451a03" stroke-width="1.5" stroke-linecap="round" />
      <path d="M47 24 L50 22" stroke="#451a03" stroke-width="1.5" stroke-linecap="round" />
      <circle cx="18" cy="36" r="3" fill="#f43f5e" opacity="0.3" />
      <circle cx="46" cy="36" r="3" fill="#f43f5e" opacity="0.3" />
      <path class="mouth" d="M26 39 Q32 44 38 39" stroke="#9a3412" stroke-width="2" stroke-linecap="round" fill="none" />
      <path d="M13 28 C13 14, 51 14, 51 28 C51 18, 44 19, 32 21 C20 19, 13 18, 13 28 Z" fill="url(#hair-f-s)" />
      <path d="M13 28 C13 36, 17 38, 17 40" stroke="url(#hair-f-s)" stroke-width="4" stroke-linecap="round" fill="none" />
      <path d="M51 28 C51 36, 47 38, 47 40" stroke="url(#hair-f-s)" stroke-width="4" stroke-linecap="round" fill="none" />
    </svg>`
  ];
  return svgs[idx] || '';
}

function initProgressEmojiTracking() {
  const container = document.getElementById('progress-3d-emojis');
  if (!container) return;

  const emojis = container.querySelectorAll('.emoji-3d');
  document.addEventListener('mousemove', (e) => {
    emojis.forEach((emoji) => {
      const rect = emoji.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Dynamic pupils eye-tracking calculation
      const angle = Math.atan2(dy, dx);
      const lookRadius = Math.min(2.5, dist / 30); // Max 2.5px shift inside eyeballs
      const pupilX = Math.cos(angle) * lookRadius;
      const pupilY = Math.sin(angle) * lookRadius;

      const isTyping = emoji.classList.contains('typing');
      const pupils = emoji.querySelectorAll('.pupil');
      pupils.forEach(pupil => {
        if (isTyping) {
          pupil.style.transform = 'translate(1.8px, 1.8px)';
          pupil.style.transition = 'transform 0.15s ease-out';
        } else {
          pupil.style.transform = `translate(${pupilX}px, ${pupilY}px)`;
          pupil.style.transition = 'none'; // Instant responsive feel
        }
      });

      // Only tilt head within 400px radius
      const maxDist = 400;
      if (dist > maxDist) {
        const body = emoji.querySelector('.emoji-3d-body');
        if (body) body.style.transform = '';
        return;
      }

      const intensity = 1 - dist / maxDist;
      const maxAngle = 35;
      const rotateY = (dx / maxDist) * maxAngle * intensity;
      const rotateX = -(dy / maxDist) * maxAngle * intensity;
      const scale = 1 + 0.15 * intensity;
      const lift = -8 * intensity;

      const body = emoji.querySelector('.emoji-3d-body');
      if (body) {
        body.style.transform = `perspective(300px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale}) translateY(${lift}px)`;
        body.style.filter = `drop-shadow(0 ${6 + 10 * intensity}px ${12 + 16 * intensity}px rgba(0,0,0,${0.1 + 0.12 * intensity}))`;
      }
    });
  });

  document.addEventListener('mouseleave', () => {
    emojis.forEach((emoji) => {
      const body = emoji.querySelector('.emoji-3d-body');
      if (body) {
        body.style.transform = '';
        body.style.filter = '';
      }
      
      const pupils = emoji.querySelectorAll('.pupil');
      pupils.forEach(pupil => {
        pupil.style.transform = '';
        pupil.style.transition = 'transform 0.2s ease';
      });
    });
  });
}

