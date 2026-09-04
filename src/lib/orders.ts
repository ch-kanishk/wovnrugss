import { prisma } from './db';

/**
 * Marks an order paid exactly once and decrements stock in the same transaction.
 * Safe to call repeatedly — the callback and the webhook both route through here.
 */
export async function markOrderPaid(
  orderNumber: string,
  { paymentId, signature, raw }: { paymentId?: string; signature?: string; raw?: unknown }
) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { orderNumber },
      include: { items: true },
    });
    if (!order) return { ok: false as const, reason: 'NOT_FOUND' as const };
    if (order.paymentStatus === 'PAID') return { ok: true as const, order, alreadyPaid: true };

    for (const item of order.items) {
      if (!item.productId) continue;
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    const updated = await tx.order.update({
      where: { id: order.id },
      data: {
        status: 'PROCESSING',
        paymentStatus: 'PAID',
        xpayPaymentId: paymentId ?? order.xpayPaymentId,
        xpaySignature: signature ?? order.xpaySignature,
        paymentRaw: raw ? JSON.stringify(raw) : order.paymentRaw,
      },
      include: { items: true },
    });
    return { ok: true as const, order: updated, alreadyPaid: false };
  });
}

export async function markOrderFailed(orderNumber: string, raw?: unknown) {
  const order = await prisma.order.findUnique({ where: { orderNumber } });
  if (!order || order.paymentStatus === 'PAID') return null;
  return prisma.order.update({
    where: { id: order.id },
    data: {
      status: 'FAILED',
      paymentStatus: 'FAILED',
      paymentRaw: raw ? JSON.stringify(raw) : order.paymentRaw,
    },
  });
}
