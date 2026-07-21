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

export function initCheckout() {
  // Debug logging for troubleshooting
  console.log('[Checkout] URL:', window.location.href);
  console.log('[Checkout] hash:', window.location.hash);
  console.log('[Checkout] search:', window.location.search);
  console.log('[Checkout] pathname:', window.location.pathname);

  // --- 1. Read the priceId from hash params (+ fallback to location.search) ---
  let priceId = getHashParams().get('price')
             || new URLSearchParams(location.search).get('price');

  console.log('[Checkout] Extracted priceId:', priceId);

  if (!priceId) {
    showError(
      'No price specified',
      'Add <code>?price=pri_XXXX</code> to the URL to start a checkout.'
    );
    return;
  }

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
      // Paddle reports checkout failures (bad token, unknown price, environment
      // mismatch, unapproved domain, etc.) ASYNCHRONOUSLY via this callback —
      // Checkout.open() does not throw for them. Without this, failures are silent
      // and the overlay simply never appears.
      Paddle.Initialize({
        token: 'live_4ff9963e1d96ee6ed3187d8bba4',
        eventCallback: (event) => {
          console.log('[Checkout] Paddle event:', event.name, event.data);
          if (event.name === 'checkout.error') {
            // Log the full payload — the actionable detail (e.g. "price_id must be a
            // valid paddle id") comes back on the network response, not always on event.data.
            console.error('[Checkout] checkout.error payload:', JSON.stringify(event.data));
            const detail =
              (event.data && (event.data.error || event.data.message)) ||
              `Paddle rejected this checkout for price "${priceId}". Most likely the price ID doesn't exist or belongs to a different environment (a sandbox price cannot be used with a live token, or vice versa). Check the console for details.`;
            showError('Could not open checkout', detail);
          }
        },
      });

      updateStatus('Opening checkout…');

      Paddle.Checkout.open({
        items: [{ priceId, quantity: 1 }],
        settings: {
          successUrl: window.location.origin + '/#/sqlens',
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
