/**
 * ══════════════════════════════════════════════════════════════════════
 *  EXTENSION PRO FLOW — Email Backend Verification & Txn Code Support
 * ══════════════════════════════════════════════════════════════════════
 *
 *  This file is NOT deployed. It contains the code snippets to integrate
 *  into your Chrome extension.
 *
 *  How it works with your Backend:
 *    1. User enters their email in the extension popup.
 *    2. Extension calls your backend API: GET /api/verify-subscription?email=...
 *    3. Backend queries Paddle API to confirm active subscription/payment.
 *    4. Extension stores Pro status in chrome.storage.local.
 *
 *  Storage keys used (chrome.storage.local):
 *    - sqlens_pro         : boolean — Whether Pro is active
 *    - sqlens_pro_email   : string  — User email
 *    - sqlens_pro_checked : number   — Timestamp of last API verification
 * ══════════════════════════════════════════════════════════════════════
 */

// ─── Configuration ───────────────────────────────────────────────────

// Replace with your domain when live (e.g. 'https://yourdomain.com/api/verify-subscription')
const VERIFY_API_URL = 'https://praql.vercel.app/api/verify-subscription';

const RECHECK_INTERVAL_MS = 24 * 60 * 60 * 1000; // Re-verify with backend every 24 hours

// =====================================================================
//  SNIPPET 1: Verify Purchase by Email (Calls Backend API)
// =====================================================================

/**
 * Verify subscription using backend API.
 *
 * @param {string} email — The email used during Paddle checkout
 * @returns {Promise<{active: boolean, subscription: object|null}>}
 */
async function verifyPurchaseByEmail(email) {
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

  // Persist in chrome.storage.local
  await chrome.storage.local.set({
    sqlens_pro: result.active,
    sqlens_pro_email: email.trim().toLowerCase(),
    sqlens_pro_checked: Date.now(),
    sqlens_pro_sub: result.subscription || null,
  });

  return result;
}

// =====================================================================
//  SNIPPET 2: Check Cached Pro Status (Background & Auto-recheck)
// =====================================================================

/**
 * Checks cached status. If > 24 hours old, re-verifies in background.
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

  // Background silent re-check if stale
  if (data.sqlens_pro_email && isStale) {
    verifyPurchaseByEmail(data.sqlens_pro_email).catch((err) => {
      console.warn('[SQLens] Silent re-verification failed:', err.message);
    });
  }

  return isPro;
}

// =====================================================================
//  SNIPPET 3: Auto-recheck on Extension Installed / Updated
// =====================================================================

chrome.runtime.onInstalled?.addListener(async () => {
  const data = await chrome.storage.local.get(['sqlens_pro_email']);
  if (data.sqlens_pro_email) {
    try {
      await verifyPurchaseByEmail(data.sqlens_pro_email);
      console.log('[SQLens] Pro status re-verified on update');
    } catch (err) {
      console.warn('[SQLens] Re-verification failed:', err.message);
    }
  }
});

// =====================================================================
//  SNIPPET 4: Popup UI HTML
// =====================================================================

const VERIFY_PURCHASE_HTML = `
<!-- Pro Badge -->
<div id="pro-badge" style="display:none; margin-bottom:16px; padding:12px 16px;
  background:linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  border-radius:10px; text-align:center;">
  <div style="font-size:1.2rem; font-weight:900; color:#78350f;">
    ⭐ PRO UNLOCKED
  </div>
  <div id="pro-email-display" style="font-size:0.75rem; color:#92400e;
    margin-top:4px; font-weight:600;"></div>
</div>

<!-- Email Verification Form -->
<div id="verify-section" style="margin-top:16px; padding:16px;
  background:#1a1a2e; border-radius:10px; border:1px solid #2d2d44;">

  <div style="font-weight:800; font-size:0.85rem; color:#e2e8f0;
    margin-bottom:12px;">
    🔑 Verify Purchase
  </div>

  <div style="font-size:0.75rem; color:#94a3b8; margin-bottom:12px; line-height:1.6;">
    Enter the email address used during Paddle checkout.
  </div>

  <input id="verify-email-input" type="email" placeholder="your@email.com"
    style="width:100%; padding:10px 12px; border-radius:8px;
      border:1px solid #374151; background:#0f172a; color:#e2e8f0;
      font-size:0.85rem; outline:none; box-sizing:border-box; margin-bottom:10px;" />

  <button id="verify-purchase-btn"
    style="width:100%; padding:10px 16px; border-radius:8px; border:none;
      background:linear-gradient(135deg, #8b5cf6, #6d28d9); color:white;
      font-size:0.85rem; font-weight:800; cursor:pointer;">
    Verify Email
  </button>

  <div id="verify-status" style="display:none; margin-top:10px; padding:10px;
    border-radius:8px; font-size:0.78rem; font-weight:600;"></div>
</div>
`;

// =====================================================================
//  SNIPPET 5: Popup JS Initializer
// =====================================================================

async function initVerifyUI() {
  const badge = document.getElementById('pro-badge');
  const section = document.getElementById('verify-section');
  const emailInput = document.getElementById('verify-email-input');
  const btn = document.getElementById('verify-purchase-btn');
  const statusEl = document.getElementById('verify-status');
  const emailDisplay = document.getElementById('pro-email-display');

  if (!btn) return;

  const stored = await chrome.storage.local.get(['sqlens_pro', 'sqlens_pro_email']);
  if (stored.sqlens_pro) {
    if (badge) badge.style.display = 'block';
    if (section) section.style.display = 'none';
    if (emailDisplay) emailDisplay.textContent = stored.sqlens_pro_email;
  }

  btn.addEventListener('click', async () => {
    const email = emailInput.value.trim();
    if (!email) return;

    btn.disabled = true;
    btn.textContent = 'Verifying…';

    try {
      const res = await verifyPurchaseByEmail(email);
      if (res.active) {
        if (badge) badge.style.display = 'block';
        if (section) section.style.display = 'none';
        if (emailDisplay) emailDisplay.textContent = email;
      } else {
        if (statusEl) {
          statusEl.style.display = 'block';
          statusEl.style.background = '#2d0a0a';
          statusEl.style.color = '#fca5a5';
          statusEl.textContent = '❌ No active purchase found for this email.';
        }
      }
    } catch (err) {
      if (statusEl) {
        statusEl.style.display = 'block';
        statusEl.style.background = '#2d0a0a';
        statusEl.style.color = '#fca5a5';
        statusEl.textContent = `⚠️ ${err.message}`;
      }
    } finally {
      btn.disabled = false;
      btn.textContent = 'Verify Email';
    }
  });
}
