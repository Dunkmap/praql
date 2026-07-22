/**
 * /api/verify-subscription.js — Vercel Serverless Function
 *
 * The Chrome extension calls this endpoint with an email address to check
 * whether the user has an active Paddle subscription (Pro status).
 *
 * Usage:
 *   GET  /api/verify-subscription?email=user@example.com
 *   POST /api/verify-subscription  { "email": "user@example.com" }
 *
 * Environment variables required:
 *   PADDLE_API_KEY — Paddle Billing API key
 *                    (from Paddle → Developer Tools → Authentication → API Keys)
 *
 * Response:
 *   { "active": true|false, "subscription": { ... } | null }
 */

// ── Paddle API helpers ───────────────────────────────────────────────

const PADDLE_API_BASE = 'https://api.paddle.com';

/**
 * Make an authenticated GET request to the Paddle Billing API.
 */
async function paddleGet(path, apiKey) {
  const url = `${PADDLE_API_BASE}${path}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Paddle API ${res.status}: ${text}`);
  }

  return res.json();
}

/**
 * Find a Paddle customer by email.
 * Returns the first matching customer object, or null.
 */
async function findCustomerByEmail(email, apiKey) {
  const data = await paddleGet(
    `/customers?email=${encodeURIComponent(email)}`,
    apiKey
  );
  return data.data && data.data.length > 0 ? data.data[0] : null;
}

/**
 * Check if a customer has any active subscription.
 * Returns the first active subscription, or null.
 */
async function getActiveSubscription(customerId, apiKey) {
  const data = await paddleGet(
    `/subscriptions?customer_id=${encodeURIComponent(customerId)}&status=active`,
    apiKey
  );
  return data.data && data.data.length > 0 ? data.data[0] : null;
}

/**
 * Fallback: check if a customer has a completed one-time transaction.
 * Useful if the product is a one-time purchase rather than a subscription.
 * Returns the most recent completed transaction, or null.
 */
async function getCompletedTransaction(customerId, apiKey) {
  const data = await paddleGet(
    `/transactions?customer_id=${encodeURIComponent(customerId)}&status=completed`,
    apiKey
  );
  return data.data && data.data.length > 0 ? data.data[0] : null;
}

// ── CORS headers ─────────────────────────────────────────────────────

function setCorsHeaders(res) {
  // Allow the Chrome extension and any origin to call this endpoint
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// ── Handler ──────────────────────────────────────────────────────────

module.exports = async function handler(req, res) {
  setCorsHeaders(res);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // Accept GET (query param) and POST (JSON body)
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST, OPTIONS');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = process.env.PADDLE_API_KEY;
  if (!apiKey) {
    console.error('[VerifySub] PADDLE_API_KEY is not set');
    return res.status(500).json({ error: 'Server misconfigured' });
  }

  // Extract email from query param or request body
  let email;
  if (req.method === 'GET') {
    email = req.query?.email;
  } else {
    email = req.body?.email;
  }

  if (!email || typeof email !== 'string') {
    return res.status(400).json({
      error: 'Missing required parameter: email',
      usage: 'GET /api/verify-subscription?email=user@example.com',
    });
  }

  // Basic email format validation
  email = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  try {
    // Step 1: Find the customer by email
    const customer = await findCustomerByEmail(email, apiKey);

    if (!customer) {
      console.log(`[VerifySub] No customer found for ${email}`);
      return res.status(200).json({ active: false, subscription: null });
    }

    console.log(`[VerifySub] Found customer ${customer.id} for ${email}`);

    // Step 2: Check for active subscription
    const subscription = await getActiveSubscription(customer.id, apiKey);

    if (subscription) {
      console.log(`[VerifySub] ✓ Active subscription ${subscription.id} for ${email}`);
      return res.status(200).json({
        active: true,
        subscription: {
          id: subscription.id,
          status: subscription.status,
          started_at: subscription.started_at,
          current_billing_period: subscription.current_billing_period,
          next_billed_at: subscription.next_billed_at,
        },
      });
    }

    // Step 3: Fallback — check for completed one-time transaction
    const transaction = await getCompletedTransaction(customer.id, apiKey);

    if (transaction) {
      console.log(`[VerifySub] ✓ Completed transaction ${transaction.id} for ${email}`);
      return res.status(200).json({
        active: true,
        subscription: {
          id: transaction.id,
          status: 'lifetime', // one-time purchase = lifetime access
          completed_at: transaction.completed_at || transaction.created_at,
        },
      });
    }

    // No active subscription or completed transaction
    console.log(`[VerifySub] ✗ No active subscription for ${email}`);
    return res.status(200).json({ active: false, subscription: null });
  } catch (err) {
    console.error(`[VerifySub] Paddle API error for ${email}:`, err.message);
    return res.status(502).json({
      error: 'Failed to verify subscription',
      detail: err.message,
    });
  }
};
