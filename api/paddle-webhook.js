/**
 * /api/paddle-webhook.js — Vercel Serverless Function
 *
 * Receives Paddle Billing (v2) webhook events, verifies the HMAC-SHA256
 * signature, logs the event, and returns 200.
 *
 * Environment variables required:
 *   PADDLE_WEBHOOK_SECRET — The webhook endpoint's signing secret
 *                           (from Paddle → Developer Tools → Notifications)
 *
 * Paddle Signature Format (Paddle-Signature header):
 *   ts=<timestamp>;h1=<hmac_hex>
 *
 * The signed payload is:  ts + ":" + rawBody
 * HMAC algorithm:         SHA-256 with PADDLE_WEBHOOK_SECRET as key
 */

const crypto = require('crypto');

/**
 * Parse the Paddle-Signature header into its components.
 * Format: "ts=1234567890;h1=abc123def456..."
 */
function parsePaddleSignature(header) {
  const parts = {};
  if (!header) return parts;

  header.split(';').forEach((segment) => {
    const [key, ...rest] = segment.split('=');
    if (key && rest.length) {
      parts[key.trim()] = rest.join('=').trim();
    }
  });

  return parts; // { ts: '...', h1: '...' }
}

/**
 * Verify the Paddle webhook signature using timing-safe comparison.
 * Returns true if signature is valid.
 */
function verifySignature(rawBody, signatureHeader, secret) {
  const { ts, h1 } = parsePaddleSignature(signatureHeader);

  if (!ts || !h1) {
    console.error('[Webhook] Missing ts or h1 in Paddle-Signature header');
    return false;
  }

  // Paddle signs: ts + ":" + rawBody
  const signedPayload = `${ts}:${rawBody}`;

  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(h1, 'hex'),
      Buffer.from(expectedSig, 'hex')
    );
  } catch {
    return false;
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const secret = process.env.PADDLE_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[Webhook] PADDLE_WEBHOOK_SECRET is not set in Environment Variables');
    return res.status(500).json({ error: 'Server misconfigured' });
  }

  let rawBody;
  if (typeof req.body === 'string') {
    rawBody = req.body;
  } else if (Buffer.isBuffer(req.body)) {
    rawBody = req.body.toString('utf8');
  } else if (req.body && typeof req.body === 'object') {
    rawBody = JSON.stringify(req.body);
  } else {
    rawBody = await new Promise((resolve, reject) => {
      const chunks = [];
      req.on('data', (chunk) => chunks.push(chunk));
      req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      req.on('error', reject);
    });
  }

  const signatureHeader = req.headers['paddle-signature'];

  if (!signatureHeader) {
    console.warn('[Webhook] Missing Paddle-Signature header');
    return res.status(403).json({ error: 'Missing signature' });
  }

  const isValid = verifySignature(rawBody, signatureHeader, secret);

  if (!isValid) {
    console.warn('[Webhook] Invalid signature');
    return res.status(403).json({ error: 'Invalid signature' });
  }

  // Signature is valid
  const event = typeof req.body === 'object' ? req.body : JSON.parse(rawBody);

  console.log(`[Webhook] ✓ Verified Paddle Event: ${event.event_type}`, {
    event_id: event.event_id,
    occurred_at: event.occurred_at,
    data_id: event.data?.id,
    customer_id: event.data?.customer_id,
  });

  // Events handled: transaction.completed, subscription.created, subscription.canceled, etc.
  return res.status(200).json({ received: true });
};

module.exports.config = {
  api: {
    bodyParser: false,
  },
};
