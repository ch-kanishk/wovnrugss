/**
 * XPay payment gateway adapter.
 * ---------------------------------------------------------------------------
 * Flow implemented (hosted checkout, the standard XPay integration):
 *
 *   1. Server creates a payment order   ->  createPaymentOrder()
 *   2. Browser is redirected to XPay's hosted page (paymentUrl)
 *   3. XPay redirects the shopper back  ->  /api/payments/xpay/callback
 *   4. XPay calls us server-to-server   ->  /api/payments/xpay/webhook  (source of truth)
 *
 * Every request/response is signed with HMAC-SHA256 over a deterministic
 * "key=value|key=value" payload using XPAY_SALT, which is how XPay's checksum
 * scheme works. If your merchant account is provisioned with a different
 * field naming, only `buildOrderPayload` and `parseGatewayEvent` need editing —
 * nothing else in the app talks to the gateway directly.
 *
 * Set XPAY_MODE=mock to run the whole checkout locally with no credentials:
 * the app then routes to /checkout/mock-gateway which simulates success/failure.
 */
import crypto from 'crypto';

export type XPayMode = 'mock' | 'test' | 'live';

export interface XPayConfig {
  mode: XPayMode;
  baseUrl: string;
  merchantId: string;
  apiKey: string;
  salt: string;
  webhookSecret: string;
}

export function getXPayConfig(): XPayConfig {
  const mode = (process.env.XPAY_MODE || 'mock') as XPayMode;
  return {
    mode,
    baseUrl: (process.env.XPAY_BASE_URL || 'https://api.xpay.co.in').replace(/\/$/, ''),
    merchantId: process.env.XPAY_MERCHANT_ID || '',
    apiKey: process.env.XPAY_API_KEY || '',
    salt: process.env.XPAY_SALT || '',
    webhookSecret: process.env.XPAY_WEBHOOK_SECRET || '',
  };
}

export function isMockMode(cfg = getXPayConfig()) {
  return cfg.mode === 'mock' || !cfg.merchantId || !cfg.apiKey;
}

/** Deterministic signing string: sorted keys, empty values skipped. */
export function signPayload(payload: Record<string, unknown>, salt: string) {
  const base = Object.keys(payload)
    .filter((k) => k !== 'signature' && payload[k] !== undefined && payload[k] !== null && payload[k] !== '')
    .sort()
    .map((k) => `${k}=${String(payload[k])}`)
    .join('|');
  return crypto.createHmac('sha256', salt).update(base).digest('hex');
}

export function verifySignature(
  payload: Record<string, unknown>,
  signature: string | undefined,
  salt: string
) {
  if (!signature) return false;
  const expected = signPayload(payload, salt);
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** Verify a raw webhook body against the X-XPay-Signature header. */
export function verifyWebhookBody(rawBody: string, header: string | null, secret: string) {
  if (!header || !secret) return false;
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const provided = header.replace(/^sha256=/, '').trim();
  const a = Buffer.from(expected);
  const b = Buffer.from(provided);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export interface CreateOrderInput {
  orderNumber: string;
  amount: number; // paise
  currency: string;
  customer: { name: string; email: string; phone: string };
  returnUrl: string;
  webhookUrl: string;
  description?: string;
}

export interface CreateOrderResult {
  gatewayOrderId: string;
  paymentUrl: string;
  raw: unknown;
}

function buildOrderPayload(input: CreateOrderInput, cfg: XPayConfig) {
  return {
    merchant_id: cfg.merchantId,
    merchant_order_id: input.orderNumber,
    amount: input.amount, // paise
    currency: input.currency,
    customer_name: input.customer.name,
    customer_email: input.customer.email,
    customer_phone: input.customer.phone,
    description: input.description || `Order ${input.orderNumber}`,
    return_url: input.returnUrl,
    webhook_url: input.webhookUrl,
    timestamp: Date.now(),
  } as Record<string, unknown>;
}

export async function createPaymentOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  const cfg = getXPayConfig();

  if (isMockMode(cfg)) {
    const id = `mock_${input.orderNumber}`;
    const url = new URL('/checkout/mock-gateway', input.returnUrl);
    url.searchParams.set('order', input.orderNumber);
    url.searchParams.set('amount', String(input.amount));
    return { gatewayOrderId: id, paymentUrl: url.toString(), raw: { mock: true } };
  }

  const payload = buildOrderPayload(input, cfg);
  payload.signature = signPayload(payload, cfg.salt);

  const res = await fetch(`${cfg.baseUrl}/v1/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cfg.apiKey}`,
      'X-Merchant-Id': cfg.merchantId,
    },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  const text = await res.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`XPay returned a non-JSON response (${res.status}): ${text.slice(0, 300)}`);
  }
  if (!res.ok) {
    throw new Error(data?.message || data?.error || `XPay order creation failed (${res.status})`);
  }

  const gatewayOrderId = data.order_id || data.id || data.data?.order_id;
  const paymentUrl = data.payment_url || data.redirect_url || data.data?.payment_url;
  if (!gatewayOrderId || !paymentUrl) {
    throw new Error('XPay response did not include an order id / payment url.');
  }
  return { gatewayOrderId, paymentUrl, raw: data };
}

/** Server-side verification of a payment before we mark an order PAID. */
export async function fetchPaymentStatus(gatewayOrderId: string): Promise<{
  status: 'PAID' | 'FAILED' | 'PENDING';
  paymentId?: string;
  raw: unknown;
}> {
  const cfg = getXPayConfig();
  if (isMockMode(cfg)) {
    return { status: 'PAID', paymentId: `mock_pay_${gatewayOrderId}`, raw: { mock: true } };
  }

  const res = await fetch(`${cfg.baseUrl}/v1/orders/${encodeURIComponent(gatewayOrderId)}`, {
    headers: { Authorization: `Bearer ${cfg.apiKey}`, 'X-Merchant-Id': cfg.merchantId },
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({}));
  const raw = String(data.status || data.data?.status || '').toLowerCase();
  const status = ['paid', 'success', 'captured', 'completed'].includes(raw)
    ? 'PAID'
    : ['failed', 'cancelled', 'declined', 'expired'].includes(raw)
      ? 'FAILED'
      : 'PENDING';
  return { status, paymentId: data.payment_id || data.data?.payment_id, raw: data };
}

/** Normalise a webhook/callback body into the fields the app cares about. */
export function parseGatewayEvent(body: Record<string, any>) {
  const status = String(body.status || body.event || body.payment_status || '').toLowerCase();
  return {
    merchantOrderId: body.merchant_order_id || body.order_id || body.orderId || '',
    gatewayOrderId: body.xpay_order_id || body.order_id || body.id || '',
    paymentId: body.payment_id || body.transaction_id || '',
    signature: body.signature || '',
    outcome: ['paid', 'success', 'captured', 'completed', 'payment.success'].includes(status)
      ? ('PAID' as const)
      : ['failed', 'cancelled', 'declined', 'expired', 'payment.failed'].includes(status)
        ? ('FAILED' as const)
        : ('PENDING' as const),
  };
}
