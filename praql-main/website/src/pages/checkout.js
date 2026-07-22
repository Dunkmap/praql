/**
 * Checkout Page — Paddle Integration
 * Reads a `price` query param from the URL hash and opens a Paddle checkout overlay.
 *
 * Since this is a hash-based SPA, the URL looks like:
 *   https://site.com/#/checkout?price=pri_XXXX
 * so we must parse the query string from `location.hash`, not `location.search`.
 */

export function renderCheckout() {
  return `
    <div id="checkout-container" style="
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 60vh;
      text-align: center;
      padding: 40px 20px;
    ">
      <div>
        <div style="font-size: 2rem; margin-bottom: 16px;">💳</div>
        <div id="checkout-status" style="color: var(--text-muted); font-weight: 700;">Preparing checkout…</div>
      </div>
    </div>
  `;
}

/**
 * Extract query params from the hash fragment.
 * e.g.  #/checkout?price=pri_123&foo=bar  →  URLSearchParams { price: "pri_123", foo: "bar" }
 */
function getHashParams() {
  const hash = window.location.hash; // e.g. "#/checkout?price=pri_123"
  const qIndex = hash.indexOf('?');
  if (qIndex === -1) return new URLSearchParams();
  return new URLSearchParams(hash.slice(qIndex + 1));
}

function showError(title, detail) {
  const container = document.getElementById('checkout-container');
  if (!container) return;
  container.innerHTML = `
    <div>
      <div style="font-size: 2rem; margin-bottom: 16px;">⚠️</div>
      <div style="color: var(--accent-red, #e74c3c); font-weight: 700;">
        ${title}
      </div>
      <div style="color: var(--text-muted); margin-top: 8px; font-size: 0.85rem;">
        ${detail}
      </div>
    </div>
  `;
}

function updateStatus(msg) {
  const el = document.getElementById('checkout-status');
  if (el) el.textContent = msg;
}

/**
 * Show the activation code screen after successful checkout.
 * The transaction ID is the activation key — no server needed.
 */
function showActivationCode(transactionId) {
  const container = document.getElementById('checkout-container');
  if (!container) return;

  container.style.minHeight = '70vh';
  container.innerHTML = `
    <div style="max-width: 520px; margin: 0 auto;">
      <!-- Success header -->
      <div style="font-size: 3.5rem; margin-bottom: 8px;">🎉</div>
      <div style="font-size: 1.6rem; font-weight: 900; color: var(--text-primary); margin-bottom: 6px;">
        Payment Successful!
      </div>
      <div style="font-size: 0.88rem; color: var(--text-muted); font-weight: 600; margin-bottom: 32px; line-height: 1.7;">
        Thank you for your purchase. Use the activation code below to unlock Pro features in the extension.
      </div>

      <!-- Activation code box -->
      <div style="
        background: var(--bg-editor, #0d1117);
        border: 2px solid var(--accent-primary, #8b5cf6);
        border-radius: 12px;
        padding: 24px;
        margin-bottom: 24px;
        position: relative;
      ">
        <div style="font-size: 0.72rem; font-weight: 800; color: var(--accent-primary, #8b5cf6);
          text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 12px;">
          🔑 Your Activation Code
        </div>
        <div id="activation-code" style="
          font-family: var(--font-mono, 'JetBrains Mono', monospace);
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--accent-green, #4ade80);
          background: var(--bg-tertiary, #161b22);
          padding: 14px 16px;
          border-radius: 8px;
          word-break: break-all;
          user-select: all;
          cursor: text;
          letter-spacing: 0.5px;
        ">${transactionId}</div>

        <button id="copy-code-btn" style="
          margin-top: 14px;
          padding: 10px 28px;
          border: none;
          border-radius: 8px;
          background: linear-gradient(135deg, #8b5cf6, #6d28d9);
          color: white;
          font-size: 0.85rem;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        ">📋 Copy Code</button>
      </div>

      <!-- Instructions -->
      <div style="
        background: var(--bg-tertiary, #161b22);
        border: 1px solid var(--border-color, #2d333b);
        border-radius: 10px;
        padding: 20px 24px;
        text-align: left;
      ">
        <div style="font-weight: 800; font-size: 0.82rem; color: var(--text-primary);
          margin-bottom: 14px;">
          How to activate:
        </div>
        <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600; line-height: 2;">
          <div>1️⃣ Open the SQLens extension in your browser</div>
          <div>2️⃣ Click <strong style="color: var(--text-secondary);">"Activate Pro"</strong></div>
          <div>3️⃣ Paste your activation code</div>
          <div>4️⃣ Done — Pro features are unlocked! 🚀</div>
        </div>
      </div>

      <!-- Back to home -->
      <a href="#/" style="
        display: inline-block;
        margin-top: 28px;
        font-size: 0.82rem;
        font-weight: 700;
        color: var(--accent-primary, #8b5cf6);
        text-decoration: none;
        border-bottom: 1px dashed var(--accent-primary, #8b5cf6);
        padding-bottom: 2px;
      ">← Back to SQL Master</a>
    </div>
  `;

  // Wire up copy button
  const copyBtn = document.getElementById('copy-code-btn');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(transactionId).then(() => {
        copyBtn.innerHTML = '✅ Copied!';
        copyBtn.style.background = 'linear-gradient(135deg, #059669, #047857)';
        setTimeout(() => {
          copyBtn.innerHTML = '📋 Copy Code';
          copyBtn.style.background = 'linear-gradient(135deg, #8b5cf6, #6d28d9)';
        }, 2000);
      }).catch(() => {
        // Fallback: select the text
        const codeEl = document.getElementById('activation-code');
        if (codeEl) {
          const range = document.createRange();
          range.selectNodeContents(codeEl);
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
        }
        copyBtn.textContent = 'Select & copy manually (Ctrl+C)';
      });
    });
  }
}

export function initCheckout() {
  // Debug logging for troubleshooting
  console.log('[Checkout] URL:', window.location.href);
  console.log('[Checkout] hash:', window.location.hash);
  console.log('[Checkout] search:', window.location.search);
  console.log('[Checkout] pathname:', window.location.pathname);

  // --- 1. Read the priceId from hash params (+ fallback to location.search + default fallback) ---
  let priceId = getHashParams().get('price')
             || new URLSearchParams(location.search).get('price')
             || 'pri_01ky1xwc21295dbedpt82ppvqb';

  console.log('[Checkout] Extracted priceId:', priceId);

  updateStatus('Loading payment system…');

  // --- 2. Load the Paddle.js SDK ---
  const script = document.createElement('script');
  script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';

  script.onerror = () => {
    showError(
      'Failed to load payment system',
      'Please check your internet connection and try again.'
    );
  };

  script.onload = () => {
    try {
      /* global Paddle */
      // Support optional Paddle Retain (pwCustomer) if logged-in customer ID (ctm_...) is present
      const customerId = getHashParams().get('customer') || new URLSearchParams(location.search).get('customer');
      const initOptions = {
        token: import.meta.env.VITE_PADDLE_CLIENT_TOKEN || 'live_4ff9963e1d96ee6ed3187d8bba4',
        eventCallback: (event) => {
          console.log('[Checkout] Paddle event:', event.name, event.data);

          // ── Checkout completed — show the activation code ──
          if (event.name === 'checkout.completed') {
            const txnId = event.data?.transaction_id
                       || event.data?.id
                       || 'UNKNOWN';
            console.log('[Checkout] ✓ Purchase complete! Transaction:', txnId);
            showActivationCode(txnId);
            return;
          }

          // ── Checkout error ──
          if (event.name === 'checkout.error') {
            console.error('[Checkout] checkout.error payload:', JSON.stringify(event.data));
            const detail =
              (event.data && (event.data.error || event.data.message)) ||
              `Paddle rejected this checkout for price "${priceId}". Most likely the price ID doesn't exist or belongs to a different environment (a sandbox price cannot be used with a live token, or vice versa). Check the console for details.`;
            showError('Could not open checkout', detail);
          }
        },
      };

      if (customerId && customerId.startsWith('ctm_')) {
        initOptions.pwCustomer = { id: customerId };
      }

      Paddle.Initialize(initOptions);

      updateStatus('Opening checkout…');

      Paddle.Checkout.open({
        items: [{ priceId: priceId, quantity: 1 }],
        settings: {
          displayMode: 'overlay',
        },
      });
    } catch (err) {
      console.error('Paddle initialization error:', err);
      showError(
        'Payment system error',
        err && err.message ? err.message : 'Something went wrong initializing the checkout. Please try again later.'
      );
    }
  };

  document.head.appendChild(script);
}
