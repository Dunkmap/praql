/**
 * Verify Subscription — Vercel Serverless Function
 *
 * The Chrome extension calls this endpoint to check if a user
 * has an active Pro subscription. Queries Paddle API directly
 * (no database needed — Paddle is the source of truth).
 *
 * Endpoint: GET /api/verify-subscription?email=user@example.com
 *
 * Required env vars:
 *   PADDLE_API_KEY — Paddle Billing API key (live)
 *
 * Response:
 *   {
 *     "plan": "pro" | "free",
 *     "subscription_id": "sub_xxx" | null,
 *     "status": "active" | "trialing" | "canceled" | null,
 *     "next_billed_at": "2026-08-22T..." | null,
 *     "price_id": "pri_xxx" | null,
 *     "customer_id": "ctm_xxx" | null
 *   }
 */

const PADDLE_API_BASE = 'https://api.paddle.com';

export default async function handler(req, res) {
  // --- CORS headers (allow Chrome extension to call this) ---
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const email = (req.query.email || '').trim().toLowerCase();
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email is required', plan: 'free' });
  }

  const apiKey = process.env.PADDLE_API_KEY;
  if (!apiKey) {
    console.error('[Verify] PADDLE_API_KEY not configured');
    return res.status(500).json({ error: 'Server misconfigured', plan: 'free' });
  }

  try {
    // Step 1: Find customer by email
    const customersRes = await paddleGet(`/customers?email=${encodeURIComponent(email)}`, apiKey);
    const customers = customersRes.data || [];

    if (customers.length === 0) {
      return res.status(200).json({
        plan: 'free',
        subscription_id: null,
        status: null,
        next_billed_at: null,
        price_id: null,
        customer_id: null,
        reason: 'No customer found with this email'
      });
    }

    const customer = customers[0];

    // Step 2: Get active/trialing subscriptions for this customer
    const subsRes = await paddleGet(
      `/subscriptions?customer_id=${customer.id}&status=active,trialing,past_due`,
      apiKey
    );
    const subscriptions = subsRes.data || [];

    if (subscriptions.length === 0) {
      // Check for canceled subscriptions (might have scheduled_change)
      const canceledRes = await paddleGet(
        `/subscriptions?customer_id=${customer.id}&status=canceled`,
        apiKey
      );
      const canceledSubs = canceledRes.data || [];

      return res.status(200).json({
        plan: 'free',
        subscription_id: canceledSubs.length > 0 ? canceledSubs[0].id : null,
        status: canceledSubs.length > 0 ? 'canceled' : null,
        next_billed_at: null,
        price_id: null,
        customer_id: customer.id,
        reason: canceledSubs.length > 0
          ? 'Subscription is canceled'
          : 'No active subscription found'
      });
    }

    // Step 3: Found an active subscription — user is Pro!
    const sub = subscriptions[0];
    const priceId = sub.items?.[0]?.price?.id || null;

    return res.status(200).json({
      plan: 'pro',
      subscription_id: sub.id,
      status: sub.status,
      next_billed_at: sub.next_billed_at || null,
      scheduled_change: sub.scheduled_change || null,
      price_id: priceId,
      customer_id: customer.id,
    });

  } catch (err) {
    console.error('[Verify] Error:', err);
    return res.status(500).json({
      error: 'Failed to verify subscription',
      plan: 'free'
    });
  }
}

/**
 * Helper to call the Paddle API.
 */
async function paddleGet(path, apiKey) {
  const url = `${PADDLE_API_BASE}${path}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Paddle API ${response.status}: ${errText}`);
  }

  return response.json();
}
