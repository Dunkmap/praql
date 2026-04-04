/**
 * 🚀 SQL Master: GLOBAL LEETCODE INJECTOR
 * This script runs everywhere on leetcode.com but only captures in /problems/.
 * Force-Capture: ALT + Q
 */

(function() {
  console.log('🚀 SQL MASTER INJECTOR: LOADED (WAITING FOR CONTENT...)');

  let lastCapturedUrl = '';
  let captureTimeout = null;

  // Watch for the page to finish building (SPA and dynamic content)
  const observer = new MutationObserver(() => {
    if (location.href.includes('/problems/') && location.href !== lastCapturedUrl) {
        const isTabSpecific = location.href.includes('/solutions/') || location.href.includes('/submissions/');
        if (!isTabSpecific) {
           clearTimeout(captureTimeout);
           captureTimeout = setTimeout(captureLeetCodeQuestion, 5000); 
        }
    }
  });

  // Start observing once body exists
  const startObserver = () => {
    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true });
      if (location.href.includes('/problems/')) {
        setTimeout(captureLeetCodeQuestion, 5000);
      }
    } else {
      setTimeout(startObserver, 100);
    }
  };
  startObserver();

  // Manual Force-Capture (ALT + Q)
  window.addEventListener('keydown', (e) => {
    if (e.altKey && e.code === 'KeyQ') {
      console.log('⚡ SQL Master: Force Scan Initiated!');
      captureLeetCodeQuestion(true);
    }
  });

  // --- Glass-Piercing Search ---
  function deepQuerySelector(selector, root = document) {
    let el = root.querySelector(selector);
    if (el) return el;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
    let node;
    while (node = walker.nextNode()) {
      if (node.shadowRoot) {
        el = deepQuerySelector(selector, node.shadowRoot);
        if (el) return el;
      }
    }
    return null;
  }

  async function captureLeetCodeQuestion(isForce = false) {
    if (!isForce && location.href === lastCapturedUrl) return;

    try {
      console.log('🔍 SQL Master: Deep-Scanning...');

      let titleEl = deepQuerySelector('[data-cy="question-title"]') || 
                    deepQuerySelector('.text-title-large') ||
                    document.querySelector('h4');

      let contentEl = deepQuerySelector('[data-track-load="description_content"]') ||
                      deepQuerySelector('[data-cy="question-content"]') || 
                      deepQuerySelector('.question-content__JfgR') || 
                      document.querySelector('.d_description');

      // 2. Structural Search (Title) - deepest match
      if (!titleEl) {
        const titleMatches = Array.from(document.querySelectorAll('div, a, span, h4')).filter(el => {
          const t = el.innerText || el.textContent || '';
          return /^\d+\.\s+/.test(t.trim()) && t.trim().length < 150;
        });
        if (titleMatches.length > 0) titleEl = titleMatches.pop(); // Deepest nested element with the title
      }

      // 3. Structural Search (Body) - deepest container holding the SQL problem markers
      if (!contentEl) {
        const contentMatches = Array.from(document.querySelectorAll('div, section')).filter(el => {
          const t = el.innerText || el.textContent || '';
          return t.includes('Table:') && t.length > 100 && t.length < 5000;
        });
        if (contentMatches.length > 0) contentEl = contentMatches.pop(); // Deepest container holding the 'Table:' keyword
      }

      if (!titleEl || !contentEl) {
        if (isForce) console.error('❌ SQL Master: Points not found. Scan failed.');
        return;
      }

      // ❗ CRUCIAL: Use innerText to preserve actual visible line-breaks, needed for parser regex!
      const title = (titleEl.innerText || titleEl.textContent).trim();
      const body = (contentEl.innerText || contentEl.textContent).trim();
      const url = window.location.href;

      // SQL Validation
      const isSql = location.href.includes('database') || 
                    body.includes('Table:') || 
                    body.toLowerCase().includes('result table');

      if (!isSql && !isForce) return;

      console.log('✨ SQL Master: Found problem:', title);

      // Analyze
      let cats = [];
      if (typeof SQL_CLAUSE_TAXONOMY !== 'undefined' && typeof detectIntentClauses === 'function') {
        const result = detectIntentClauses(body, '');
        const catSet = new Set();
        result.primary.forEach(c => {
          for (const [k, v] of Object.entries(SQL_CLAUSE_TAXONOMY)) {
            if (v.clauses.includes(c)) catSet.add(v.label);
          }
        });
        cats = Array.from(catSet);
      }

      // Store
      chrome.storage.local.get({ capturedLeetCode: [] }, (res) => {
        let list = res.capturedLeetCode;
        if (list.some(q => q.title === title)) {
          lastCapturedUrl = location.href;
          return;
        }

        list.unshift({
          id: 'lc_' + Date.now(),
          source: 'LeetCode',
          title: title,
          question: body,
          url: url,
          categories: cats,
          timestamp: new Date().toISOString()
        });

        chrome.storage.local.set({ capturedLeetCode: list.slice(0, 50) }, () => {
          lastCapturedUrl = location.href;
          console.log('📦 SQL Master: Captured & Securely Stored!');
          showCaptureToast(title, cats);
        });
      });

    } catch (e) {
      console.error('⚠️ SQL Master Error:', e);
    }
  }

  function showCaptureToast(title, cats) {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed; top: 24px; right: 24px; padding: 22px 34px;
      background: rgba(255, 255, 255, 0.82); backdrop-filter: blur(24px) saturate(160%);
      -webkit-backdrop-filter: blur(24px) saturate(160%); border: 1px solid rgba(184, 106, 124, 0.4);
      border-radius: 30px; box-shadow: 0 25px 60px rgba(0,0,0,0.15);
      z-index: 10000000; font-family: 'JetBrains Mono', monospace;
      animation: sqlIn 0.8s cubic-bezier(0.18, 0.89, 0.32, 1.28);
      display: flex; flex-direction: column; gap: 4px; max-width: 350px;
    `;

    toast.innerHTML = `
      <div style="font-size: 0.6rem; font-weight: 800; color: #b86a7c; letter-spacing: 2px;">⚡ SECURED (ALT+Q READY)</div>
      <div style="font-size: 1rem; font-weight: 800; color: #1a202c; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; letter-spacing: -0.5px;">${title}</div>
      <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-top: 10px;">
        ${cats.map(c => `<span style="font-size: 0.6rem; padding: 6px 14px; background: rgba(184,106,124,0.1); color: #b86a7c; border-radius: 14px; font-weight: 800;">${c}</span>`).join('')}
      </div>
    `;

    if (!document.getElementById('sql-style')) {
      const s = document.createElement('style'); s.id = 'sql-style';
      s.innerHTML = '@keyframes sqlIn { from { transform: translate(140%, 0); opacity: 0; } to { transform: translate(0, 0); opacity: 1; } }';
      document.head.appendChild(s);
    }

    document.body.appendChild(toast);
    setTimeout(() => {
      if (document.body.contains(toast)) {
        toast.style.opacity = '0'; toast.style.transform = 'translateY(-20px) scale(0.95)';
        toast.style.transition = 'all 0.6s ease';
        setTimeout(() => toast.remove(), 700);
      }
    }, 7000);
  }
})();
