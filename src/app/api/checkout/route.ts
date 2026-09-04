import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { priceCart } from '@/lib/pricing';
import { createPaymentOrder } from '@/lib/xpay';
import { orderNumber } from '@/lib/utils';
import { site } from '@/lib/config';

const customerSchema = z.object({
  firstName: z.string().trim().min(1).max(60),
  lastName: z.string().trim().min(1).max(60),
  email: z.string().trim().email().max(160),
  phone: z.string().trim().min(8).max(20),
  address1: z.string().trim().min(4).max(200),
  address2: z.string().trim().max(200).optional().or(z.literal('')),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2).max(80),
  postcode: z.string().trim().min(3).max(16),
  country: z.string().trim().min(2).max(60).default('India'),
  notes: z.string().trim().max(600).optional().or(z.literal('')),
});

const bodySchema = z.object({
  customer: customerSchema,
  items: z.array(z.object({ productId: z.string().min(1), quantity: z.number().int().min(1).max(99) })).min(1),
});

export async function POST(req: Request) {
  let parsed;
  try {
    parsed = bodySchema.parse(await req.json());
  } catch (err) {
    const message =
      err instanceof z.ZodError
        ? `Please check: ${err.errors.map((e) => e.path.join('.')).join(', ')}`
        : 'Invalid request.';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const { customer, items } = parsed;

  try {
    const priced = await priceCart(items);
    const number = orderNumber();

    const order = await prisma.order.create({
      data: {
        orderNumber: number,
        status: 'PENDING',
        paymentStatus: 'UNPAID',
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        phone: customer.phone,
        address1: customer.address1,
        address2: customer.address2 || null,
        city: customer.city,
        state: customer.state,
        postcode: customer.postcode,
        country: customer.country,
        subtotal: priced.subtotal,
        shippingFee: priced.shippingFee,
        taxAmount: priced.taxAmount,
        total: priced.total,
        currency: priced.currency,
        notes: customer.notes || null,
        items: {
          create: priced.lines.map((l) => ({
            productId: l.productId,
            name: l.name,
            sku: l.sku,
            sizeLabel: l.sizeLabel,
            image: l.image,
            unitPrice: l.unitPrice,
            quantity: l.quantity,
            lineTotal: l.lineTotal,
          })),
        },
      },
    });

    const payment = await createPaymentOrder({
      orderNumber: order.orderNumber,
      amount: order.total,
      currency: order.currency,
      customer: {
        name: `${customer.firstName} ${customer.lastName}`,
        email: customer.email,
        phone: customer.phone,
      },
      returnUrl: `${site.url}/api/payments/xpay/callback`,
      webhookUrl: `${site.url}/api/payments/xpay/webhook`,
      description: `${site.name} order ${order.orderNumber}`,
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { xpayOrderId: payment.gatewayOrderId, paymentRaw: JSON.stringify(payment.raw) },
    });

    return NextResponse.json({
      orderNumber: order.orderNumber,
      paymentUrl: payment.paymentUrl,
    });
  } catch (err) {
    console.error('[checkout]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Checkout failed. Please try again.' },
      { status: 400 }
    );
  }
}
