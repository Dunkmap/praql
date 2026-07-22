/**
 * ══════════════════════════════════════════════════════════════════════
 *  EXTENSION PRO FLOW — Transaction-ID Activation (No Server)
 * ══════════════════════════════════════════════════════════════════════
 *
 *  This file is NOT deployed. It contains the code snippets to integrate
 *  into your Chrome extension for the "Activate Pro" flow.
 *
 *  How it works:
 *    1. User completes Paddle checkout on the website
 *    2. checkout.completed event fires → website shows the transaction ID
 *    3. User copies the transaction ID and pastes it into the extension
 *    4. Extension stores it in chrome.storage.local → Pro unlocked
 *
 *  No server, no API keys, no secrets, no attack surface.
 *
 *  Storage keys used (chrome.storage.local):
 *    - sqlens_pro           : boolean — Whether Pro is active
 *    - sqlens_pro_txn       : string  — Transaction ID (activation code)
 *    - sqlens_pro_activated : number  — Timestamp of activation
 * ══════════════════════════════════════════════════════════════════════
 */

// =====================================================================
//  SNIPPET 1: Activate Pro with a transaction ID (popup.js or utils)
// =====================================================================

/**
 * Activate Pro using a Paddle transaction ID.
 * Validates the format and stores it.
 *
 * @param {string} code — The transaction ID from the checkout success page
 * @returns {Promise<boolean>} — true if activation succeeded
 */
async function activatePro(code) {
  if (!code || typeof code !== 'string') {
    throw new Error('Please enter your activation code');
  }

  const trimmed = code.trim();

  // Paddle transaction IDs start with "txn_"
  if (!trimmed.startsWith('txn_')) {
    throw new Error(
      'Invalid activation code. It should start with "txn_" — ' +
      'copy the full code from the checkout success page.'
    );
  }

  // Store in chrome.storage.local
  await chrome.storage.local.set({
    sqlens_pro: true,
    sqlens_pro_txn: trimmed,
    sqlens_pro_activated: Date.now(),
  });

  console.log('[SQLens] ✓ Pro activated with transaction:', trimmed);
  return true;
}

// =====================================================================
//  SNIPPET 2: Check Pro status (use anywhere in the extension)
// =====================================================================

/**
 * Check if Pro is active.
 *
 * @returns {Promise<boolean>}
 */
async function isProActive() {
  const data = await chrome.storage.local.get(['sqlens_pro']);
  return data.sqlens_pro === true;
}

/**
 * Get full Pro details (status + transaction ID + activation date).
 *
 * @returns {Promise<{active: boolean, txn: string|null, activatedAt: number|null}>}
 */
async function getProDetails() {
  const data = await chrome.storage.local.get([
    'sqlens_pro',
    'sqlens_pro_txn',
    'sqlens_pro_activated',
  ]);

  return {
    active: data.sqlens_pro === true,
    txn: data.sqlens_pro_txn || null,
    activatedAt: data.sqlens_pro_activated || null,
  };
}

// =====================================================================
//  SNIPPET 3: Deactivate / reset Pro (for debugging or support)
// =====================================================================

async function deactivatePro() {
  await chrome.storage.local.remove([
    'sqlens_pro',
    'sqlens_pro_txn',
    'sqlens_pro_activated',
  ]);
  console.log('[SQLens] Pro deactivated');
}

// =====================================================================
//  SNIPPET 4: Auto-check on extension open (popup.js DOMContentLoaded)
// =====================================================================

/**
 * Call this when the popup opens. It checks Pro status and updates
 * the UI accordingly (show Pro badge or show activation form).
 */
async function initProUI() {
  const pro = await getProDetails();

  const badge = document.getElementById('pro-badge');
  const activateSection = document.getElementById('activate-section');

  if (pro.active) {
    // Show Pro badge, hide activation form
    if (badge) badge.style.display = 'block';
    if (activateSection) activateSection.style.display = 'none';
  } else {
    // Show activation form, hide badge
    if (badge) badge.style.display = 'none';
    if (activateSection) activateSection.style.display = 'block';
  }
}

// =====================================================================
//  SNIPPET 5: Popup HTML — "Activate Pro" UI
// =====================================================================

/**
 * Add this HTML block to your popup.html inside the main container.
 */
const ACTIVATE_PRO_HTML = `
<!-- Pro Status Badge (shown when activated) -->
<div id="pro-badge" style="display:none; margin-bottom:16px; padding:12px 16px;
  background:linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  border-radius:10px; text-align:center;">
  <div style="font-size:1.2rem; font-weight:900; color:#78350f;">
    ⭐ PRO ACTIVE
  </div>
  <div id="pro-txn-display" style="font-size:0.7rem; color:#92400e;
    margin-top:4px; font-weight:600; font-family:monospace;"></div>
</div>

<!-- Activate Pro Section -->
<div id="activate-section" style="margin-top:16px; padding:16px;
  background:#1a1a2e; border-radius:10px; border:1px solid #2d2d44;">

  <div style="font-weight:800; font-size:0.85rem; color:#e2e8f0;
    margin-bottom:12px; display:flex; align-items:center; gap:8px;">
    🔑 Activate Pro
  </div>

  <div style="font-size:0.75rem; color:#94a3b8; margin-bottom:12px;
    line-height:1.6;">
    Paste the activation code from your checkout confirmation to unlock Pro features.
  </div>

  <input id="activate-code-input" type="text"
    placeholder="txn_01abc123..."
    style="width:100%; padding:10px 12px; border-radius:8px;
      border:1px solid #374151; background:#0f172a; color:#e2e8f0;
      font-size:0.85rem; font-weight:600; font-family:monospace;
      outline:none; box-sizing:border-box; margin-bottom:10px;"
  />

  <button id="activate-pro-btn"
    style="width:100%; padding:10px 16px; border-radius:8px;
      border:none; background:linear-gradient(135deg, #8b5cf6, #6d28d9);
      color:white; font-size:0.85rem; font-weight:800; cursor:pointer;
      transition:all 0.2s ease;">
    Activate Pro
  </button>

  <div id="activate-status" style="display:none; margin-top:10px;
    padding:10px 12px; border-radius:8px; font-size:0.78rem;
    font-weight:600; line-height:1.5;"></div>

  <div style="margin-top:12px; text-align:center;">
    <a href="https://praql.vercel.app/#/checkout" target="_blank"
      style="font-size:0.73rem; color:#8b5cf6; text-decoration:none;
        font-weight:700; border-bottom:1px dashed #8b5cf6;">
      Don't have a code? Purchase here →
    </a>
  </div>
</div>
`;

// =====================================================================
//  SNIPPET 6: Popup JS — Wire up the Activate Pro UI
// =====================================================================

/**
 * Call this in your popup.js after DOMContentLoaded.
 */
async function initActivateProUI() {
  const badge = document.getElementById('pro-badge');
  const section = document.getElementById('activate-section');
  const codeInput = document.getElementById('activate-code-input');
  const activateBtn = document.getElementById('activate-pro-btn');
  const statusEl = document.getElementById('activate-status');
  const txnDisplay = document.getElementById('pro-txn-display');

  if (!activateBtn) return;

  // ── Load existing state ──
  const pro = await getProDetails();
  if (pro.active) {
    if (badge) badge.style.display = 'block';
    if (section) section.style.display = 'none';
    if (txnDisplay) txnDisplay.textContent = pro.txn;
  }

  // ── Activate button click ──
  activateBtn.addEventListener('click', async () => {
    const code = codeInput.value.trim();
    if (!code) {
      showActivateStatus('Please paste your activation code', 'error');
      return;
    }

    activateBtn.disabled = true;
    activateBtn.textContent = 'Activating…';

    try {
      await activatePro(code);
      showActivateStatus('✅ Pro activated! Enjoy your Pro features.', 'success');

      // Update UI
      if (badge) {
        badge.style.display = 'block';
        if (txnDisplay) txnDisplay.textContent = code;
      }
      if (section) {
        setTimeout(() => { section.style.display = 'none'; }, 1500);
      }
    } catch (err) {
      showActivateStatus(`⚠️ ${err.message}`, 'error');
    } finally {
      activateBtn.disabled = false;
      activateBtn.textContent = 'Activate Pro';
    }
  });

  // Enter key submits
  codeInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') activateBtn.click();
  });

  function showActivateStatus(message, type) {
    if (!statusEl) return;
    statusEl.style.display = 'block';
    statusEl.textContent = message;

    const colors = {
      success: { bg: '#052e16', border: '#166534', color: '#4ade80' },
      error:   { bg: '#2d0a0a', border: '#7f1d1d', color: '#fca5a5' },
    };
    const c = colors[type] || colors.error;
    statusEl.style.background = c.bg;
    statusEl.style.border = `1px solid ${c.border}`;
    statusEl.style.color = c.color;
  }
}

// =====================================================================
//  SNIPPET 7: Feature-gate helper
// =====================================================================

/**
 * Gate a Pro-only feature.
 *
 * Usage:
 *   if (await requirePro()) {
 *     // run Pro-only code
 *   }
 */
async function requirePro() {
  const active = await isProActive();
  if (!active) {
    console.log('[SQLens] This feature requires Pro activation');
  }
  return active;
}

// =====================================================================
//  INTEGRATION CHECKLIST
// =====================================================================
//
//  □ Copy activatePro() + isProActive() + getProDetails() into popup.js
//  □ Add ACTIVATE_PRO_HTML to your popup.html
//  □ Call initActivateProUI() in your popup.js DOMContentLoaded handler
//  □ Use requirePro() or isProActive() to gate Pro features
//  □ Ensure "storage" permission is in manifest.json
//
//  NO server needed. NO API keys. NO environment variables.
//
// =====================================================================
