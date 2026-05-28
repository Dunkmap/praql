import { escapeHtml } from '../engine/sql-engine.js';

export function renderLanding() {
  const savedName = localStorage.getItem('sqlmaster-username') || '';
  const savedEmoji = localStorage.getItem('sqlmaster-useremoji') !== null ? parseInt(localStorage.getItem('sqlmaster-useremoji')) : 0;
  const greeting = savedName ? `Welcome back, <strong>${escapeHtml(savedName)}</strong>!` : 'Set your name to personalize your journey';

  return `
  <div class="landing">
    <!-- Hero -->
    <section class="hero">
      <div class="hero-badge">100% FREE · NO SIGNUP · RUNS IN YOUR BROWSER</div>
      <h1 class="hero-title">Master SQL<br><span class="hero-accent">Without Leaving Your Browser</span></h1>
      <p class="hero-desc">130+ practice questions, structured learning paths, a live SQL playground, and a real database engine — all running locally via WebAssembly.</p>
      <div class="hero-actions">
        <a href="#/learn" class="btn btn-primary hero-btn">Start Learning →</a>
        <a href="#/playground" class="btn btn-secondary hero-btn">Open Playground</a>
      </div>
      <div class="hero-terminal">
        <div class="terminal-bar"><span class="terminal-dot red"></span><span class="terminal-dot yellow"></span><span class="terminal-dot green"></span><span class="terminal-label">> sql_master</span></div>
        <pre class="terminal-code"><span class="sql-keyword">SELECT</span> skill, confidence
<span class="sql-keyword">FROM</span> your_career
<span class="sql-keyword">WHERE</span> tool = <span class="sql-string">'SQL Master'</span>
<span class="sql-keyword">ORDER BY</span> growth <span class="sql-keyword">DESC</span>;</pre>
      </div>
    </section>


    <!-- Features Grid -->
    <section class="features-section">
      <h2 class="section-title">Everything You Need</h2>
      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon"></div>
          <h3>Structured Learning</h3>
          <p>8 categories, 30+ interactive modules from SELECT basics to Window Functions.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon"></div>
          <h3>130+ Practice Questions</h3>
          <p>Easy → Hard with instant feedback, hints, and answer verification.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon"></div>
          <h3>SQL Playground</h3>
          <p>Write any query against 5 built-in datasets. Schema viewer included.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon"></div>
          <h3>Data Detective</h3>
          <p>Solve mysteries and real-world cases using your SQL skills and deduction.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon"></div>
          <h3>Bug Squasher</h3>
          <p>Race against the clock to fix broken SQL queries in this fast-paced game.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon"></div>
          <h3>LeetCode Prep</h3>
          <p>Tackle technical interview questions with built-in test cases and validation.</p>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="cta-section">
      <div class="cta-card">
        <h2>Ready to write your first query?</h2>
        <p>No account needed. No downloads. Just click and start.</p>
        <a href="#/learn" class="btn btn-primary hero-btn">Begin Your Journey →</a>
      </div>
    </section>

    <!-- Footer -->
    <footer class="site-footer">
      <div class="footer-inner">
        <span>SQL Master v2.0 · Built with WebAssembly</span>
        <span>100% Client-Side · Zero Server Costs</span>
      </div>
    </footer>
  </div>`;
}

export function initLanding() {
  // Animate hero terminal typing effect
  const code = document.querySelector('.terminal-code');
  if (code) {
    code.style.opacity = '0';
    code.style.transform = 'translateY(10px)';
    setTimeout(() => {
      code.style.transition = 'all 0.8s ease';
      code.style.opacity = '1';
      code.style.transform = 'translateY(0)';
    }, 300);
  }

  // Profile name save
  const saveBtn = document.getElementById('profile-save-btn');
  const nameInput = document.getElementById('profile-name-input');
  const greeting = document.getElementById('profile-greeting');

  // Handle single avatar clicking to toggle and save immediately
  const toggleBox = document.getElementById('avatar-toggle-box');
  if (toggleBox) {
    toggleBox.addEventListener('click', () => {
      let currentIdx = parseInt(toggleBox.dataset.idx || '0');
      let newIdx = currentIdx === 0 ? 1 : 0;
      
      toggleBox.dataset.idx = newIdx;
      localStorage.setItem('sqlmaster-useremoji', newIdx);
      
      // Update SVG content inside
      const body = toggleBox.querySelector('.emoji-3d-body');
      if (body) {
        body.innerHTML = getEmojiSvg(newIdx);
        // Dynamic visual confirmation pulse on selection
        body.style.transform = 'scale(1.3) translateY(-8px)';
        setTimeout(() => { body.style.transform = ''; }, 200);
      }
    });
  }

  if (saveBtn && nameInput) {
    saveBtn.addEventListener('click', () => {
      const name = nameInput.value.trim();
      if (name) {
        localStorage.setItem('sqlmaster-username', name);
        greeting.innerHTML = `Welcome back, <strong>${escapeHtml(name)}</strong>!`;
        saveBtn.textContent = 'Saved!';
        saveBtn.style.background = 'var(--accent-green-light)';
        saveBtn.style.color = 'var(--accent-green-dark)';
        saveBtn.style.borderColor = 'var(--accent-green-border)';
        
        // Ensure there's a selected emoji saved too
        const selected = document.getElementById('avatar-toggle-box');
        if (selected) {
          localStorage.setItem('sqlmaster-useremoji', selected.dataset.idx);
        } else {
          localStorage.setItem('sqlmaster-useremoji', '0');
        }

        setTimeout(() => {
          saveBtn.textContent = 'Save';
          saveBtn.style.background = '';
          saveBtn.style.color = '';
          saveBtn.style.borderColor = '';
        }, 2000);
      } else {
        localStorage.removeItem('sqlmaster-username');
        greeting.innerHTML = 'Set your name to personalize your journey';
      }
    });

    nameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') saveBtn.click();
    });

    let typingTimeout;
    const handleTypingStart = () => {
      if (toggleBox) toggleBox.classList.add('typing');
      
      clearTimeout(typingTimeout);
      typingTimeout = setTimeout(() => {
        if (toggleBox) toggleBox.classList.remove('typing');
      }, 800);
    };

    nameInput.addEventListener('input', handleTypingStart);
    nameInput.addEventListener('focus', handleTypingStart);
    nameInput.addEventListener('blur', () => {
      clearTimeout(typingTimeout);
      if (toggleBox) toggleBox.classList.remove('typing');
    });
  }

  // 3D cursor-tracking rotation for emoji icons
  init3DEmojiTracking();
}

/* ── 3D Emoji Cursor Tracking ── */
function init3DEmojiTracking() {
  const container = document.getElementById('profile-3d-emojis');
  if (!container) return;

  const emojis = container.querySelectorAll('.emoji-3d');

  // Track mouse globally for smooth effect
  document.addEventListener('mousemove', (e) => {
    emojis.forEach((emoji) => {
      const rect = emoji.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Distance from cursor to emoji center
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

      // Intensity falls off with distance
      const intensity = 1 - dist / maxDist;
      const maxAngle = 35;

      // Rotate toward cursor
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

  // Reset on mouse leave from the whole page
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

function getEmojiSvg(idx) {
  const svgs = [
    // Male Face SVG
    `<svg viewBox="0 0 64 64" width="48" height="48">
      <defs>
        <linearGradient id="skin-m-l" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#fed7aa"/>
          <stop offset="100%" stop-color="#fdbb2d"/>
        </linearGradient>
        <linearGradient id="hair-m-l" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#374151"/>
          <stop offset="100%" stop-color="#111827"/>
        </linearGradient>
      </defs>
      <circle cx="14" cy="32" r="6" fill="#fdbb2d" />
      <circle cx="50" cy="32" r="6" fill="#fdbb2d" />
      <circle cx="32" cy="32" r="20" fill="url(#skin-m-l)" stroke="#ea580c" stroke-width="1.5" />
      <ellipse cx="24" cy="28" rx="5" ry="6" fill="#ffffff" stroke="#9a3412" stroke-width="1" />
      <ellipse cx="40" cy="28" rx="5" ry="6" fill="#ffffff" stroke="#9a3412" stroke-width="1" />
      <circle class="pupil" cx="24" cy="28" r="2.5" fill="#1e293b" />
      <circle class="pupil" cx="40" cy="28" r="2.5" fill="#1e293b" />
      <path class="eyebrow" d="M19 21 Q24 19 29 22" stroke="#111827" stroke-width="2" stroke-linecap="round" fill="none" />
      <path class="eyebrow" d="M45 21 Q40 19 35 22" stroke="#111827" stroke-width="2" stroke-linecap="round" fill="none" />
      <path class="mouth" d="M25 40 Q32 45 39 40" stroke="#9a3412" stroke-width="2" stroke-linecap="round" fill="none" />
      <path d="M14 26 C14 14, 50 14, 50 26 C46 22, 38 21, 32 24 C26 21, 18 22, 14 26 Z" fill="url(#hair-m-l)" />
      <path d="M12 26 L15 32 L15 26 Z" fill="url(#hair-m-l)" />
      <path d="M52 26 L49 32 L49 26 Z" fill="url(#hair-m-l)" />
    </svg>`,
    // Female Face SVG
    `<svg viewBox="0 0 64 64" width="48" height="48">
      <defs>
        <linearGradient id="skin-f-l" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#fed7aa"/>
          <stop offset="100%" stop-color="#fdbb2d"/>
        </linearGradient>
        <linearGradient id="hair-f-l" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#78350f"/>
          <stop offset="100%" stop-color="#451a03"/>
        </linearGradient>
      </defs>
      <path d="M12 30 C6 30, 6 54, 14 54 C20 54, 18 42, 18 36 Z" fill="url(#hair-f-l)" />
      <path d="M52 30 C58 30, 58 54, 50 54 C44 54, 46 42, 46 36 Z" fill="url(#hair-f-l)" />
      <circle cx="15" cy="33" r="5" fill="#fdbb2d" />
      <circle cx="49" cy="33" r="5" fill="#fdbb2d" />
      <circle cx="32" cy="32" r="19" fill="url(#skin-f-l)" stroke="#ea580c" stroke-width="1.5" />
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
      <path d="M13 28 C13 14, 51 14, 51 28 C51 18, 44 19, 32 21 C20 19, 13 18, 13 28 Z" fill="url(#hair-f-l)" />
      <path d="M13 28 C13 36, 17 38, 17 40" stroke="url(#hair-f-l)" stroke-width="4" stroke-linecap="round" fill="none" />
      <path d="M51 28 C51 36, 47 38, 47 40" stroke="url(#hair-f-l)" stroke-width="4" stroke-linecap="round" fill="none" />
    </svg>`
  ];
  return svgs[idx] || '';
}

