import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { buildMetadata } from '@/lib/seo';
import { formatMoney, formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export const metadata = buildMetadata({ title: 'Order confirmation', path: '/order', noIndex: true });

const COPY: Record<string, { title: string; body: string; tone: string }> = {
  paid: {
    title: 'Thank you — your order is confirmed',
    body: 'We have received your payment. Your rug will be inspected, rolled and dispatched from Jaipur within 3–5 working days.',
    tone: 'text-brand-800',
  },
  pending: {
    title: 'Payment is being confirmed',
    body: 'XPay has not finalised this payment yet. This page updates once the gateway confirms — we will also email you.',
    tone: 'text-amber-700',
  },
  failed: {
    title: 'Payment did not go through',
    body: 'No money has been taken. You can try again with a different method, or contact us and we will help.',
    tone: 'text-red-700',
  },
};

export default async function OrderPage({
  params, searchParams,
}: {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const [{ orderNumber }, { status }] = await Promise.all([params, searchParams]);

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { items: true },
  });
  if (!order) notFound();

  const state =
    order.paymentStatus === 'PAID' ? 'paid' : order.paymentStatus === 'FAILED' ? 'failed' : (status ?? 'pending');
  const copy = COPY[state] ?? COPY.pending;

  return (
    <div className="container-page max-w-3xl py-16">
      <p className="eyebrow">Order {order.orderNumber}</p>
      <h1 className={`mt-3 font-display text-4xl ${copy.tone}`}>{copy.title}</h1>
      <p className="mt-3 text-sm leading-relaxed text-ink/65">{copy.body}</p>

      <div className="mt-10 grid gap-4 border-y border-ink/10 py-6 text-sm sm:grid-cols-3">
        <div>
          <p className="label">Placed on</p>
          <p>{formatDate(order.createdAt)}</p>
        </div>
        <div>
          <p className="label">Status</p>
          <p>{order.status}</p>
        </div>
        <div>
          <p className="label">Payment</p>
          <p>{order.paymentStatus} · XPay</p>
        </div>
      </div>

      <ul className="divide-y divide-ink/10">
        {order.items.map((item) => (
          <li key={item.id} className="flex items-center gap-4 py-5">
            <div className="relative h-20 w-16 shrink-0 overflow-hidden bg-sand">
              {item.image && <Image src={item.image} alt="" fill sizes="64px" className="object-cover" />}
            </div>
            <div className="flex-1">
              <p className="font-display text-lg">{item.name}</p>
              <p className="text-xs text-ink/50">
                {item.sku}{item.sizeLabel ? ` · ${item.sizeLabel}` : ''} · Qty {item.quantity}
              </p>
            </div>
            <p className="text-sm">{formatMoney(item.lineTotal, order.currency)}</p>
          </li>
        ))}
      </ul>

      <dl className="mt-6 space-y-2 border-t border-ink/10 pt-6 text-sm">
        <div className="flex justify-between"><dt className="text-ink/60">Subtotal</dt><dd>{formatMoney(order.subtotal, order.currency)}</dd></div>
        <div className="flex justify-between"><dt className="text-ink/60">Shipping</dt><dd>{order.shippingFee ? formatMoney(order.shippingFee, order.currency) : 'Free'}</dd></div>
        <div className="flex justify-between text-xs text-ink/45"><dt>Includes GST</dt><dd>{formatMoney(order.taxAmount, order.currency)}</dd></div>
        <div className="flex justify-between border-t border-ink/10 pt-3 text-base font-medium"><dt>Total</dt><dd>{formatMoney(order.total, order.currency)}</dd></div>
      </dl>

      <section className="mt-10 text-sm text-ink/65">
        <h2 className="label">Shipping to</h2>
        <address className="not-italic leading-relaxed">
          {order.firstName} {order.lastName}<br />
          {order.address1}{order.address2 ? <>, {order.address2}</> : null}<br />
          {order.city}, {order.state} {order.postcode}<br />
          {order.country}<br />
          {order.phone} · {order.email}
        </address>
      </section>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/rugs" className="btn-primary">Continue shopping</Link>
        {state === 'failed' && <Link href="/cart" className="btn-outline">Back to cart</Link>}
        <Link href="/contact" className="btn-outline">Need help?</Link>
      </div>
    </div>
  );
}
