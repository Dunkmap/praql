/**
 * SQL Master — Main Entry Point
 */
import './styles/index.css';
import './styles/landing.css';
import './styles/learn.css';
import { Router } from './router.js';
import { renderNavbar, initNavbar } from './components/navbar.js';
import { sqlEngine } from './engine/sql-engine.js';

// Global references
window.sqlEngine = sqlEngine;

const app = document.getElementById('app');
const router = new Router();

// Engine initialization (once)
let engineReady = false;
async function ensureEngine() {
  if (engineReady) return;
  await sqlEngine.init();
  await sqlEngine.loadAllDatasets();
  engineReady = true;
}

async function loadPage(pageName, needsEngine = true) {
  // Show loading state
  app.innerHTML = renderNavbar() + `<main class="main-content"><div style="text-align:center;padding:80px 20px;"><div style="font-size:2rem;margin-bottom:16px;"></div><div style="color:var(--text-muted);font-weight:700;">Loading${pageName !== 'landing' ? ' ' + pageName : ''}...</div></div></main>`;
  initNavbar();
  router.updateActiveNav();

  try {
    if (needsEngine) await ensureEngine();
    const module = await import(`./pages/${pageName}.js`);
    const html = module[`render${capitalize(pageName)}`]();
    app.innerHTML = renderNavbar() + `<main class="main-content" id="page-content">${html}</main>`;
    initNavbar();
    router.updateActiveNav();
    if (module[`init${capitalize(pageName)}`]) {
      await module[`init${capitalize(pageName)}`]();
    }
    window.scrollTo(0, 0);
  } catch (e) {
    console.error(`Failed to load ${pageName}:`, e);
    app.innerHTML = renderNavbar() + `<main class="main-content"><div style="text-align:center;padding:80px 20px;"><div style="font-size:2rem;margin-bottom:16px;"></div><div style="color:var(--accent-red);font-weight:700;">Failed to load page</div><div style="color:var(--text-muted);margin-top:8px;font-size:0.85rem;">${e.message}</div></div></main>`;
    initNavbar();
  }
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Routes
router
  .on('/', () => loadPage('landing', false))
  .on('/learn', () => loadPage('learn'))
  .on('/practice', () => loadPage('practice'))
  .on('/playground', () => loadPage('playground'))
  .on('/bugsquasher', () => loadPage('bugsquasher'))
  .on('/detective', () => loadPage('detective'))
  .on('/sqlens', () => loadPage('sqlens'))
  .on('/studio', () => loadPage('studio'))
  .on('/progress', () => loadPage('progress'))
  .on('/legal', () => loadPage('legal', false))
  .on('/checkout', () => loadPage('checkout', false));

router.start();
