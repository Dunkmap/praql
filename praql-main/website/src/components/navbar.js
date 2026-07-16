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
      <a class="nav-link" href="#/learn"><span class="nav-link-inner"><span class="nav-icon"></span> Learn</span></a>
      <a class="nav-link" href="#/practice"><span class="nav-link-inner"><span class="nav-icon"></span> Practice</span></a>
      <a class="nav-link" href="#/playground"><span class="nav-link-inner"><span class="nav-icon"></span> Playground</span></a>
      <a class="nav-link" href="#/bugsquasher"><span class="nav-link-inner"><span class="nav-icon"></span> Bug Squasher</span></a>
      <a class="nav-link" href="#/detective"><span class="nav-link-inner"><span class="nav-icon"></span> Detective</span></a>
      <a class="nav-link" href="#/sqlens"><span class="nav-link-inner"><span class="nav-icon"></span> SQLens</span></a>
      <a class="nav-link" href="#/progress"><span class="nav-link-inner"><span class="nav-icon"></span> Progress</span></a>
      <label class="switch" id="theme-toggle-btn" title="Toggle theme">
        <input id="theme-checkbox" type="checkbox" />
        <span class="slider">
          <div class="star star_1"></div>
          <div class="star star_2"></div>
          <div class="star star_3"></div>
          <svg viewBox="0 0 16 16" class="cloud_1 cloud">
            <path
              transform="matrix(.77976 0 0 .78395-299.99-418.63)"
              fill="#fff"
              d="m391.84 540.91c-.421-.329-.949-.524-1.523-.524-1.351 0-2.451 1.084-2.485 2.435-1.395.526-2.388 1.88-2.388 3.466 0 1.874 1.385 3.423 3.182 3.667v.034h12.73v-.006c1.775-.104 3.182-1.584 3.182-3.395 0-1.747-1.309-3.186-2.994-3.379.007-.106.011-.214.011-.322 0-2.707-2.271-4.901-5.072-4.901-2.073 0-3.856 1.202-4.643 2.925"
            ></path>
          </svg>
        </span>
      </label>
      <button class="mobile-menu-btn" id="mobile-menu-btn" aria-label="Toggle menu"></button>
    </div>
  </nav>`;
}

export function initNavbar() {
  // Theme toggle
  const themeCheckbox = document.getElementById('theme-checkbox');
  if (themeCheckbox) {
    themeCheckbox.addEventListener('change', () => {
      const isLight = themeCheckbox.checked;
      const theme = isLight ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('sqlmaster-theme', theme);
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
  if (themeCheckbox) {
    themeCheckbox.checked = savedTheme === 'light';
  }

  // Letter-scramble effect on nav links
  initNavScramble();
}

/* ── Letter Scramble Effect ── */
const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*!?<>';
const SCRAMBLE_SPEED = 40;   // ms per scramble tick
const RESOLVE_DELAY = 3;     // ticks before each letter resolves back

function initNavScramble() {
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    // Find the text node (skip the .nav-icon span)
    const textNode = getTextContent(link);
    if (!textNode) return;

    const originalText = textNode.trim();
    if (!originalText) return;

    // Store original text
    link.dataset.originalText = originalText;
    let scrambleInterval = null;
    let tickCount = 0;

    link.addEventListener('mouseenter', () => {
      tickCount = 0;
      if (scrambleInterval) clearInterval(scrambleInterval);

      scrambleInterval = setInterval(() => {
        tickCount++;
        const resolvedCount = Math.floor(tickCount / RESOLVE_DELAY);
        let result = '';

        for (let i = 0; i < originalText.length; i++) {
          if (originalText[i] === ' ') {
            result += ' ';
          } else if (i < resolvedCount) {
            // This letter has "resolved" back to original
            result += originalText[i];
          } else {
            // Scramble this letter
            result += SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
          }
        }

        setTextContent(link, result);

        // Once fully resolved, stop and restart the cycle
        if (resolvedCount >= originalText.length) {
          tickCount = 0;
        }
      }, SCRAMBLE_SPEED);
    });

    link.addEventListener('mouseleave', () => {
      if (scrambleInterval) {
        clearInterval(scrambleInterval);
        scrambleInterval = null;
      }
      setTextContent(link, originalText);
    });

    link.addEventListener('click', () => {
      if (scrambleInterval) {
        clearInterval(scrambleInterval);
        scrambleInterval = null;
      }
      setTextContent(link, originalText);
    });
  });
}

function getTextContent(link) {
  // Get the raw text after the icon span
  const icon = link.querySelector('.nav-icon');
  if (icon) {
    // Text is the sibling text node after the icon
    let node = icon.nextSibling;
    while (node) {
      if (node.nodeType === 3 && node.textContent.trim()) {
        return node.textContent.trim();
      }
      node = node.nextSibling;
    }
  }
  return link.textContent.trim();
}

function setTextContent(link, text) {
  const icon = link.querySelector('.nav-icon');
  if (icon) {
    let node = icon.nextSibling;
    while (node) {
      if (node.nodeType === 3 && node.textContent.trim()) {
        node.textContent = ' ' + text;
        return;
      }
      node = node.nextSibling;
    }
  }
  link.textContent = text;
}
