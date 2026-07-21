/**
 * Checkout Page — Paddle Integration
 * Reads a `price` query param from the URL and opens a Paddle checkout overlay.
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
        <div style="color: var(--text-muted); font-weight: 700;">Preparing checkout…</div>
      </div>
    </div>
  `;
}

export function initCheckout() {
  // Dynamically load the Paddle.js script
  const script = document.createElement('script');
  script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';
  script.onload = () => {
    /* global Paddle */
    Paddle.Initialize({ token: 'your_paddle_client_token' }); // TODO: replace with real token

    const priceId = new URLSearchParams(location.search).get('price');
    if (priceId) {
      Paddle.Checkout.open({ items: [{ priceId, quantity: 1 }] });
    } else {
      const container = document.getElementById('checkout-container');
      if (container) {
        container.innerHTML = `
          <div>
            <div style="font-size: 2rem; margin-bottom: 16px;">⚠️</div>
            <div style="color: var(--accent-red, #e74c3c); font-weight: 700;">
              No price specified
            </div>
            <div style="color: var(--text-muted); margin-top: 8px; font-size: 0.85rem;">
              Add <code>?price=pri_XXXX</code> to the URL to start a checkout.
            </div>
          </div>
        `;
      }
    }
  };
  document.head.appendChild(script);
}
