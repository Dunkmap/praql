import { escapeHtml } from '../engine/sql-engine.js';

export function renderLanding() {
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
          <div class="feature-icon">📚</div>
          <h3>Structured Learning</h3>
          <p>8 categories, 30+ interactive modules from SELECT basics to Window Functions.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">🎯</div>
          <h3>130+ Practice Questions</h3>
          <p>Easy → Hard with instant feedback, hints, and answer verification.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">🧪</div>
          <h3>SQL Playground</h3>
          <p>Write any query against 5 built-in datasets. Schema viewer included.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">☁️</div>
          <h3>Data Studio</h3>
          <p>Upload CSV or Excel files and query your own data with SQL instantly.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">📊</div>
          <h3>Progress Tracking</h3>
          <p>Daily challenges, streaks, speed stats, clause mastery, and weak area analysis.</p>
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
}
