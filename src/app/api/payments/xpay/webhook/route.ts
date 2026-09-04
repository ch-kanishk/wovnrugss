import { NextResponse } from 'next/server';
import { getXPayConfig, isMockMode, parseGatewayEvent, verifyWebhookBody } from '@/lib/xpay';
import { markOrderFailed, markOrderPaid } from '@/lib/orders';

export const dynamic = 'force-dynamic';

/**
 * Server-to-server notification from XPay — the authoritative source of payment
 * truth. Signature is verified over the raw body before anything is written.
 */
export async function POST(req: Request) {
  const cfg = getXPayConfig();
  const raw = await req.text();
  const signature = req.headers.get('x-xpay-signature') || req.headers.get('x-signature');

  if (!isMockMode(cfg) && !verifyWebhookBody(raw, signature, cfg.webhookSecret)) {
    console.warn('[xpay-webhook] rejected: bad signature');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let body: Record<string, any>;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const event = parseGatewayEvent(body);
  if (!event.merchantOrderId) {
    return NextResponse.json({ error: 'Missing merchant_order_id' }, { status: 400 });
  }

  if (event.outcome === 'PAID') {
    const result = await markOrderPaid(event.merchantOrderId, {
      paymentId: event.paymentId,
      signature: event.signature,
      raw: body,
    });
    if (!result.ok) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    return NextResponse.json({ received: true, alreadyPaid: result.alreadyPaid });
  }

  if (event.outcome === 'FAILED') {
    await markOrderFailed(event.merchantOrderId, body);
  }

  return NextResponse.json({ received: true });
}
