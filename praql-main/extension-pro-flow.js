/**
 * ══════════════════════════════════════════════════════════════════════
 *  EXTENSION PRO FLOW — Reference Implementation
 * ══════════════════════════════════════════════════════════════════════
 *
 *  This file is NOT deployed. It contains the code snippets to integrate
 *  into your Chrome extension for the "Verify Purchase" Pro flow.
 *
 *  Integration points:
 *    1. popup.html  — Add "Verify Purchase" button + email input UI
 *    2. popup.js    — Add verification logic + UI state management
 *    3. background.js — Add auto-check on extension open
 *
 *  Storage keys used (chrome.storage.local):
 *    - sqlens_pro         : boolean  — Whether Pro is active
 *    - sqlens_pro_email   : string   — Email used for verification
 *    - sqlens_pro_checked : number   — Timestamp of last verification
 *    - sqlens_pro_sub     : object   — Subscription details from API
 * ══════════════════════════════════════════════════════════════════════
 */

// ─── Configuration ───────────────────────────────────────────────────

const VERIFY_API_URL = 'https://praql.vercel.app/api/verify-subscription';
// ↑ Update this to your actual deployed Vercel URL

const RECHECK_INTERVAL_MS = 24 * 60 * 60 * 1000; // Re-verify every 24 hours

// =====================================================================
//  SNIPPET 1: Core verification function (popup.js or shared utils)
// =====================================================================

/**
 * Verify a purchase by email. Calls the backend API and stores the result.
 *
 * @param {string} email — The email used during Paddle checkout
 * @returns {Promise<{active: boolean, subscription: object|null}>}
 */
async function verifyPurchase(email) {
  if (!email || !email.includes('@')) {
    throw new Error('Please enter a valid email address');
  }

  const url = `${VERIFY_API_URL}?email=${encodeURIComponent(email.trim().toLowerCase())}`;

  const response = await fetch(url);

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Verification failed (${response.status})`);
  }

  const result = await response.json();

  // Persist the result in chrome.storage.local
  await chrome.storage.local.set({
    sqlens_pro: result.active,
    sqlens_pro_email: email.trim().toLowerCase(),
    sqlens_pro_checked: Date.now(),
    sqlens_pro_sub: result.subscription || null,
  });

  return result;
}

// =====================================================================
//  SNIPPET 2: Check cached Pro status (use anywhere in the extension)
// =====================================================================

/**
 * Check if the user has Pro status (from cached storage).
 * Optionally triggers a background re-check if stale.
 *
 * @returns {Promise<boolean>}
 */
async function checkProStatus() {
  const data = await chrome.storage.local.get([
    'sqlens_pro',
    'sqlens_pro_email',
    'sqlens_pro_checked',
  ]);

  const isPro = data.sqlens_pro === true;
  const lastChecked = data.sqlens_pro_checked || 0;
  const isStale = Date.now() - lastChecked > RECHECK_INTERVAL_MS;

  // If we have an email and the status is stale, re-verify silently
  if (data.sqlens_pro_email && isStale) {
    // Fire-and-forget — don't block the caller
    verifyPurchase(data.sqlens_pro_email).catch((err) => {
      console.warn('[SQLens] Background re-verification failed:', err.message);
    });
  }

  return isPro;
}

// =====================================================================
//  SNIPPET 3: Auto-check on extension open (background.js)
// =====================================================================

/**
 * Add this to your background.js / service_worker script.
 * It re-verifies Pro status whenever the extension is installed/updated
 * or when the user clicks the extension icon.
 */

// On install/update — re-verify if we have a stored email
chrome.runtime.onInstalled.addListener(async () => {
  const data = await chrome.storage.local.get(['sqlens_pro_email']);
  if (data.sqlens_pro_email) {
    try {
      await verifyPurchase(data.sqlens_pro_email);
      console.log('[SQLens] Pro status re-verified on install/update');
    } catch (err) {
      console.warn('[SQLens] Re-verification failed:', err.message);
    }
  }
});

// On extension icon click — check and refresh Pro status
// (Only needed if you use chrome.action.onClicked instead of a popup)
// chrome.action.onClicked.addListener(async (tab) => {
//   await checkProStatus();
// });

// =====================================================================
//  SNIPPET 4: Popup HTML — "Verify Purchase" UI
// =====================================================================

/**
 * Add this HTML block to your popup.html inside the main container.
 * It provides:
 *   - A "Pro badge" shown when verified
 *   - A "Verify Purchase" section with email input
 *   - Status feedback messages
 */

const VERIFY_PURCHASE_HTML = `
<!-- Pro Status Badge (shown when verified) -->
<div id="pro-badge" style="display:none; margin-bottom:16px; padding:12px 16px;
  background:linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  border-radius:10px; text-align:center;">
  <div style="font-size:1.2rem; font-weight:900; color:#78350f;">
    ⭐ PRO ACTIVE
  </div>
  <div id="pro-email-display" style="font-size:0.75rem; color:#92400e;
    margin-top:4px; font-weight:600;"></div>
</div>

<!-- Verify Purchase Section -->
<div id="verify-section" style="margin-top:16px; padding:16px;
  background:#1a1a2e; border-radius:10px; border:1px solid #2d2d44;">

  <div style="font-weight:800; font-size:0.85rem; color:#e2e8f0;
    margin-bottom:12px; display:flex; align-items:center; gap:8px;">
    🔑 Verify Purchase
  </div>

  <div style="font-size:0.75rem; color:#94a3b8; margin-bottom:12px;
    line-height:1.6;">
    Enter the email you used during checkout to unlock Pro features.
  </div>

  <input id="verify-email-input" type="email"
    placeholder="your@email.com"
    style="width:100%; padding:10px 12px; border-radius:8px;
      border:1px solid #374151; background:#0f172a; color:#e2e8f0;
      font-size:0.85rem; font-weight:600; outline:none;
      box-sizing:border-box; margin-bottom:10px;"
  />

  <button id="verify-purchase-btn"
    style="width:100%; padding:10px 16px; border-radius:8px;
      border:none; background:linear-gradient(135deg, #8b5cf6, #6d28d9);
      color:white; font-size:0.85rem; font-weight:800; cursor:pointer;
      transition:all 0.2s ease;">
    Verify Purchase
  </button>

  <div id="verify-status" style="display:none; margin-top:10px;
    padding:10px 12px; border-radius:8px; font-size:0.78rem;
    font-weight:600; line-height:1.5;"></div>
</div>
`;

// =====================================================================
//  SNIPPET 5: Popup JS — Wire up the Verify Purchase UI
// =====================================================================

/**
 * Call this function in your popup.js after the DOM is loaded.
 * It wires up the "Verify Purchase" button, handles the email input,
 * and updates the UI based on Pro status.
 */
async function initVerifyPurchaseUI() {
  const badge = document.getElementById('pro-badge');
  const section = document.getElementById('verify-section');
  const emailInput = document.getElementById('verify-email-input');
  const verifyBtn = document.getElementById('verify-purchase-btn');
  const statusEl = document.getElementById('verify-status');
  const emailDisplay = document.getElementById('pro-email-display');

  if (!verifyBtn) return; // UI not present

  // ── Load existing state ──
  const stored = await chrome.storage.local.get([
    'sqlens_pro',
    'sqlens_pro_email',
  ]);

  if (stored.sqlens_pro) {
    showProActive(stored.sqlens_pro_email);
  }
  if (stored.sqlens_pro_email) {
    emailInput.value = stored.sqlens_pro_email;
  }

  // ── Verify button click ──
  verifyBtn.addEventListener('click', async () => {
    const email = emailInput.value.trim();
    if (!email) {
      showStatus('Please enter your email address', 'error');
      return;
    }

    verifyBtn.disabled = true;
    verifyBtn.textContent = 'Verifying…';
    showStatus('Checking your purchase…', 'info');

    try {
      const result = await verifyPurchase(email);

      if (result.active) {
        showProActive(email);
        showStatus('✅ Purchase verified! Pro features unlocked.', 'success');
      } else {
        showStatus(
          '❌ No active purchase found for this email. Make sure you used the same email during checkout.',
          'error'
        );
      }
    } catch (err) {
      showStatus(`⚠️ ${err.message}`, 'error');
    } finally {
      verifyBtn.disabled = false;
      verifyBtn.textContent = 'Verify Purchase';
    }
  });

  // Enter key submits
  emailInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') verifyBtn.click();
  });

  // ── Helper: show Pro badge ──
  function showProActive(email) {
    if (badge) {
      badge.style.display = 'block';
      if (emailDisplay) emailDisplay.textContent = email;
    }
  }

  // ── Helper: show status message ──
  function showStatus(message, type) {
    if (!statusEl) return;
    statusEl.style.display = 'block';
    statusEl.textContent = message;

    const colors = {
      success: { bg: '#052e16', border: '#166534', color: '#4ade80' },
      error:   { bg: '#2d0a0a', border: '#7f1d1d', color: '#fca5a5' },
      info:    { bg: '#0c1929', border: '#1e3a5f', color: '#93c5fd' },
    };
    const c = colors[type] || colors.info;
    statusEl.style.background = c.bg;
    statusEl.style.border = `1px solid ${c.border}`;
    statusEl.style.color = c.color;
  }
}

// =====================================================================
//  SNIPPET 6: Feature-gate helper (use anywhere in extension)
// =====================================================================

/**
 * Gate a Pro-only feature. Shows a prompt to verify if not Pro.
 *
 * Usage:
 *   if (await isProFeature()) {
 *     // run Pro-only code
 *   }
 */
async function isProFeature() {
  const isPro = await checkProStatus();
  if (!isPro) {
    // Optionally open the popup or show a notification
    console.log('[SQLens] Pro feature requires a verified purchase');
    return false;
  }
  return true;
}

// =====================================================================
//  INTEGRATION CHECKLIST
// =====================================================================
//
//  □ Copy VERIFY_API_URL constant and update with your Vercel URL
//  □ Copy verifyPurchase() + checkProStatus() into popup.js or a shared util
//  □ Copy the background.js snippet into your service worker
//  □ Add VERIFY_PURCHASE_HTML to your popup.html
//  □ Call initVerifyPurchaseUI() in your popup.js DOMContentLoaded handler
//  □ Use isProFeature() or checkProStatus() to gate Pro features
//  □ Add "storage" permission to manifest.json if not already present
//
// =====================================================================
