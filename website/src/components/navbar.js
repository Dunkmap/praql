/**
 * Shared navbar component
 */
export function renderNavbar() {
  return `
  <nav class="top-nav" id="main-nav">
    <a class="nav-brand" href="#/">
      <div class="nav-brand-icon">
        <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
          <ellipse cx="20" cy="12" rx="14" ry="6" fill="currentColor"/>
          <path d="M6 12V20C6 23.3 12.3 26 20 26C27.7 26 34 23.3 34 20V12" stroke="currentColor" stroke-width="2"/>
          <path d="M6 20V28C6 31.3 12.3 34 20 34C27.7 34 34 31.3 34 28V20" stroke="currentColor" stroke-width="2"/>
        </svg>
      </div>
      <span class="nav-brand-text">SQL MASTER</span>
    </a>
    <div class="nav-links" id="nav-links">
      <a class="nav-link" href="#/learn"><span class="nav-icon">📚</span> Learn</a>
      <a class="nav-link" href="#/practice"><span class="nav-icon">🎯</span> Practice</a>
      <a class="nav-link" href="#/playground"><span class="nav-icon">🧪</span> Playground</a>
      <a class="nav-link" href="#/bugsquasher"><span class="nav-icon">🐛</span> Bug Squasher</a>
      <a class="nav-link" href="#/detective"><span class="nav-icon">🕵️</span> Detective</a>
      <a class="nav-link" href="#/leetcode"><span class="nav-icon">⚡</span> LeetCode</a>
      <a class="nav-link" href="#/progress"><span class="nav-icon">📊</span> Progress</a>
      <button class="theme-btn" id="theme-toggle-btn" title="Toggle theme">
        <span class="theme-icon">🌙</span>
      </button>
      <button class="mobile-menu-btn" id="mobile-menu-btn" aria-label="Toggle menu">☰</button>
    </div>
  </nav>`;
}

export function initNavbar() {
  // Theme toggle
  const themeBtn = document.getElementById('theme-toggle-btn');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
      localStorage.setItem('sqlmaster-theme', isDark ? 'light' : 'dark');
      themeBtn.querySelector('.theme-icon').textContent = isDark ? '🌙' : '☀️';
    });
  }

  // Mobile menu
  const menuBtn = document.getElementById('mobile-menu-btn');
  if (menuBtn) {
    menuBtn.addEventListener('click', () => {
      document.getElementById('nav-links').classList.toggle('open');
    });
  }

  // Apply saved theme
  const savedTheme = localStorage.getItem('sqlmaster-theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  if (themeBtn) {
    themeBtn.querySelector('.theme-icon').textContent = savedTheme === 'dark' ? '☀️' : '🌙';
  }
}
