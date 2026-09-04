import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { fetchPaymentStatus, parseGatewayEvent } from '@/lib/xpay';
import { markOrderFailed, markOrderPaid } from '@/lib/orders';
import { site } from '@/lib/config';

/**
 * Shopper-facing return URL. XPay may send the shopper back via GET or POST, so
 * both are handled. The browser is NOT trusted: whatever it claims, we confirm
 * the payment server-to-server before flipping the order to PAID.
 */
async function handle(req: Request, params: Record<string, string>) {
  const merchantOrderId = params.merchant_order_id || params.order_id || params.orderId || '';

  if (!merchantOrderId) {
    return NextResponse.redirect(`${site.url}/checkout?error=missing-order`, 303);
  }

  const order = await prisma.order.findUnique({ where: { orderNumber: merchantOrderId } });
  if (!order) {
    return NextResponse.redirect(`${site.url}/checkout?error=unknown-order`, 303);
  }

  const event = parseGatewayEvent(params);
  const verified = await fetchPaymentStatus(order.xpayOrderId || event.gatewayOrderId || merchantOrderId);

  if (verified.status === 'PAID') {
    await markOrderPaid(order.orderNumber, {
      paymentId: verified.paymentId || event.paymentId,
      signature: event.signature,
      raw: verified.raw,
    });
    return NextResponse.redirect(`${site.url}/order/${order.orderNumber}?status=paid`, 303);
  }

  if (verified.status === 'FAILED') {
    await markOrderFailed(order.orderNumber, verified.raw);
    return NextResponse.redirect(`${site.url}/order/${order.orderNumber}?status=failed`, 303);
  }

  return NextResponse.redirect(`${site.url}/order/${order.orderNumber}?status=pending`, 303);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  return handle(req, Object.fromEntries(url.searchParams.entries()));
}

export async function POST(req: Request) {
  const contentType = req.headers.get('content-type') || '';
  let params: Record<string, string> = {};
  if (contentType.includes('application/json')) {
    params = await req.json().catch(() => ({}));
  } else {
    const form = await req.formData().catch(() => null);
    if (form) params = Object.fromEntries([...form.entries()].map(([k, v]) => [k, String(v)]));
  }
  // Query string wins nothing — merge so either transport works.
  const url = new URL(req.url);
  return handle(req, { ...Object.fromEntries(url.searchParams.entries()), ...params });
}
