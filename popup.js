document.addEventListener('DOMContentLoaded', () => {
  setupNavigation();
});

function setupNavigation() {
  const pages = {
    'open-learn': 'pages/learn.html',
    'open-practice': 'pages/practice.html',
    'open-challenges': 'pages/challenges.html',
    'open-ai': 'pages/ai.html',
    'open-progress-btn': 'pages/progress.html'
  };

  Object.entries(pages).forEach(([id, path]) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('click', () => {
        chrome.tabs.create({ url: chrome.runtime.getURL(path) });
      });
    }
  });

  // Google Sheets - open Google Sheets
  const sheetsBtn = document.getElementById('open-sheets');
  if (sheetsBtn) {
    sheetsBtn.addEventListener('click', () => {
      chrome.tabs.create({ url: 'https://docs.google.com/spreadsheets/' });
    });
  }
}

function loadStats() {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.local.get(['topicsCompleted', 'questionsSolved', 'questionsAttempted'], (data) => {
      const topics = data.topicsCompleted || [];
      const solved = data.questionsSolved || 0;
      const attempted = data.questionsAttempted || 0;
      const accuracy = attempted > 0 ? Math.round((solved / attempted) * 100) : 0;

      const tEl = document.getElementById('stat-topics');
      const qEl = document.getElementById('stat-questions');
      const aEl = document.getElementById('stat-accuracy');
      
      if (tEl) tEl.textContent = topics.length;
      if (qEl) qEl.textContent = solved;
      if (aEl) aEl.textContent = accuracy + '%';
    });
  }
}
