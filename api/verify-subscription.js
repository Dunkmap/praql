/**
 * /api/verify-subscription.js — Vercel Serverless Function
 *
 * The Chrome extension calls this endpoint with an email address to check
 * whether the user has an active Paddle subscription or completed transaction (Pro status).
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

const PADDLE_API_BASE = 'https://api.paddle.com';

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

async function findCustomerByEmail(email, apiKey) {
  const data = await paddleGet(
    `/customers?email=${encodeURIComponent(email)}`,
    apiKey
  );
  return data.data && data.data.length > 0 ? data.data[0] : null;
}

async function getActiveSubscription(customerId, apiKey) {
  const data = await paddleGet(
    `/subscriptions?customer_id=${encodeURIComponent(customerId)}&status=active`,
    apiKey
  );
  return data.data && data.data.length > 0 ? data.data[0] : null;
}

async function getCompletedTransaction(customerId, apiKey) {
  const data = await paddleGet(
    `/transactions?customer_id=${encodeURIComponent(customerId)}&status=completed`,
    apiKey
  );
  return data.data && data.data.length > 0 ? data.data[0] : null;
}

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

module.exports = async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST, OPTIONS');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = process.env.PADDLE_API_KEY;
  if (!apiKey) {
    console.error('[VerifySub] PADDLE_API_KEY is not set');
    return res.status(500).json({ error: 'Server misconfigured' });
  }

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

  email = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  try {
    // Step 1: Find customer by email
    const customer = await findCustomerByEmail(email, apiKey);

    if (!customer) {
      console.log(`[VerifySub] No customer found for ${email}`);
      return res.status(200).json({ active: false, subscription: null });
    }

    console.log(`[VerifySub] Customer found ${customer.id} for ${email}`);

    // Step 2: Check active recurring subscription
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

    // Step 3: Check completed one-time transaction
    const transaction = await getCompletedTransaction(customer.id, apiKey);
    if (transaction) {
      console.log(`[VerifySub] ✓ Completed transaction ${transaction.id} for ${email}`);
      return res.status(200).json({
        active: true,
        subscription: {
          id: transaction.id,
          status: 'lifetime',
          completed_at: transaction.completed_at || transaction.created_at,
        },
      });
    }

    console.log(`[VerifySub] ✗ No active subscription or transaction for ${email}`);
    return res.status(200).json({ active: false, subscription: null });
  } catch (err) {
    console.error(`[VerifySub] Paddle API error for ${email}:`, err.message);
    return res.status(502).json({
      error: 'Failed to verify subscription',
      detail: err.message,
    });
  }
};
