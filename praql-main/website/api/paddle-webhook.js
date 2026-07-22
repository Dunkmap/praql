/**
 * Paddle Webhook Handler — Vercel Serverless Function
 *
 * Receives webhook events from Paddle Billing and returns 200 OK.
 * Verifies the webhook signature to ensure authenticity.
 *
 * Endpoint: POST /api/paddle-webhook
 *
 * Required env vars:
 *   PADDLE_WEBHOOK_SECRET — Signing secret from Paddle Dashboard > Notifications
 */

import crypto from 'crypto';

export default async function handler(req, res) {
  // Only accept POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const rawBody = typeof req.body === 'string'
      ? req.body
      : JSON.stringify(req.body);

    // --- Verify Paddle signature ---
    const secret = process.env.PADDLE_WEBHOOK_SECRET;
    if (!secret) {
      console.error('[Webhook] PADDLE_WEBHOOK_SECRET not configured');
      // Still return 200 so Paddle doesn't retry endlessly during setup
      return res.status(200).json({ received: true, warning: 'signature not verified — secret not configured' });
    }

    const signature = req.headers['paddle-signature'];
    if (signature) {
      const isValid = verifyPaddleSignature(rawBody, signature, secret);
      if (!isValid) {
        console.error('[Webhook] Invalid signature');
        return res.status(401).json({ error: 'Invalid webhook signature' });
      }
    }

    // --- Parse the event ---
    const event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const eventType = event.event_type;
    const data = event.data;

    console.log(`[Webhook] Received: ${eventType}`, JSON.stringify({
      event_id: event.event_id,
      occurred_at: event.occurred_at,
      subscription_id: data?.id || data?.subscription_id,
      customer_id: data?.customer_id,
      status: data?.status,
    }));

    // --- Handle specific events ---
    switch (eventType) {
      case 'subscription.created':
        console.log(`[Webhook] Subscription created: ${data.id} for customer ${data.customer_id}, status: ${data.status}`);
        break;

      case 'subscription.updated':
        console.log(`[Webhook] Subscription updated: ${data.id}, status: ${data.status}, scheduled_change: ${JSON.stringify(data.scheduled_change)}`);
        break;

      case 'subscription.canceled':
        console.log(`[Webhook] Subscription canceled: ${data.id} for customer ${data.customer_id}`);
        break;

      case 'transaction.completed':
        console.log(`[Webhook] Transaction completed: ${data.id}, subscription: ${data.subscription_id}`);
        break;

      default:
        console.log(`[Webhook] Unhandled event type: ${eventType}`);
    }

    // Always return 200 to acknowledge receipt
    return res.status(200).json({ received: true, event_type: eventType });

  } catch (err) {
    console.error('[Webhook] Error processing webhook:', err);
    // Return 200 anyway to prevent Paddle from retrying on our errors
    return res.status(200).json({ received: true, error: 'Processing error' });
  }
}

/**
 * Verify Paddle webhook signature (Paddle Billing v2 format).
 *
 * The Paddle-Signature header looks like:
 *   ts=1234567890;h1=<hex_signature>
 *
 * The signed payload is: ts + ":" + rawBody
 * Verified with HMAC-SHA256 using the webhook secret.
 */
function verifyPaddleSignature(rawBody, signatureHeader, secret) {
  try {
    const parts = {};
    signatureHeader.split(';').forEach(part => {
      const [key, value] = part.split('=');
      parts[key] = value;
    });

    const ts = parts['ts'];
    const h1 = parts['h1'];

    if (!ts || !h1) return false;

    const signedPayload = `${ts}:${rawBody}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(signedPayload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(h1),
      Buffer.from(expectedSignature)
    );
  } catch (err) {
    console.error('[Webhook] Signature verification error:', err);
    return false;
  }
}
