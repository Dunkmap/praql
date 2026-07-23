/**
 * /api/paddle-webhook.js — Vercel Serverless Function
 *
 * Receives Paddle Billing (v2) webhook events, verifies the HMAC-SHA256
 * signature, logs the event, and returns 200.
 *
 * Security:
 *   1. IP allowlist — dynamically fetched from https://api.paddle.com/ips
 *      (cached 1 hour). Rejects requests from non-Paddle IPs.
 *   2. HMAC-SHA256 signature verification using the webhook signing secret.
 *
 * Environment variables required:
 *   PADDLE_WEBHOOK_SECRET — The webhook endpoint's signing secret
 *                           (from Paddle → Developer Tools → Notifications)
 */

import crypto from 'crypto';

/* ── Dynamic Paddle IP allowlist ─────────────────────────────────── */

let cachedIps = null;
let cacheExpiry = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Fetch Paddle's current webhook source IPs from the /ips endpoint.
 * Returns an array of plain IP strings (parsed from /32 CIDRs).
 * Falls back to empty array on error (allows signature-only validation).
 */
async function getPaddleAllowedIps() {
  const now = Date.now();
  if (cachedIps && now < cacheExpiry) return cachedIps;

  try {
    const resp = await fetch('https://api.paddle.com/ips');
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const json = await resp.json();
    const cidrs = json?.data?.ipv4_cidrs || [];
    // CIDRs are /32 (single IPs) — strip the /32 suffix
    cachedIps = cidrs.map((cidr) => cidr.replace(/\/32$/, ''));
    cacheExpiry = now + CACHE_TTL_MS;
    console.log(`[Webhook] Refreshed Paddle IP allowlist: ${cachedIps.length} IPs`);
  } catch (err) {
    console.warn(`[Webhook] Failed to fetch Paddle IPs: ${err.message}. Allowing signature-only validation.`);
    if (!cachedIps) cachedIps = []; // don't block if first fetch fails
  }

  return cachedIps;
}

/**
 * Extract the client IP from the request (Vercel uses x-forwarded-for).
 */
function getClientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (xff) return xff.split(',')[0].trim();
  return req.socket?.remoteAddress || req.connection?.remoteAddress || '';
}

function parsePaddleSignature(header) {
  const parts = {};
  if (!header) return parts;

  header.split(';').forEach((segment) => {
    const [key, ...rest] = segment.split('=');
    if (key && rest.length) {
      parts[key.trim()] = rest.join('=').trim();
    }
  });

  return parts;
}

function verifySignature(rawBody, signatureHeader, secret) {
  const { ts, h1 } = parsePaddleSignature(signatureHeader);

  if (!ts || !h1) {
    console.error('[Webhook] Missing ts or h1 in Paddle-Signature header');
    return false;
  }

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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  /* ── IP allowlist check ── */
  const allowedIps = await getPaddleAllowedIps();
  if (allowedIps.length > 0) {
    const clientIp = getClientIp(req);
    if (!allowedIps.includes(clientIp)) {
      console.warn(`[Webhook] Rejected request from non-Paddle IP: ${clientIp}`);
      return res.status(403).json({ error: 'Forbidden: IP not in Paddle allowlist' });
    }
  }

  const secret = process.env.PADDLE_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[Webhook] PADDLE_WEBHOOK_SECRET is not set in Environment Variables');
    return res.status(200).json({ received: true, warning: 'PADDLE_WEBHOOK_SECRET not set' });
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

  if (signatureHeader) {
    const isValid = verifySignature(rawBody, signatureHeader, secret);
    if (!isValid) {
      console.warn('[Webhook] Invalid signature');
      return res.status(403).json({ error: 'Invalid signature' });
    }
  }

  const event = typeof req.body === 'object' ? req.body : JSON.parse(rawBody);

  console.log(`[Webhook] ✓ Received Paddle Event: ${event.event_type}`, {
    event_id: event.event_id,
    occurred_at: event.occurred_at,
    data_id: event.data?.id,
  });

  return res.status(200).json({ received: true });
}

export const config = {
  api: {
    bodyParser: false,
  },
};
