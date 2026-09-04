import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { formatMoney, formatDate } from '@/lib/utils';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { OrderStatusForm } from '@/components/admin/OrderStatusForm';

export const dynamic = 'force-dynamic';

export default async function AdminOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
  if (!order) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/admin/orders" className="text-xs text-ink/50 hover:text-ink">← Orders</Link>
          <h1 className="mt-2 font-display text-3xl">{order.orderNumber}</h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-ink/55">
            {formatDate(order.createdAt)} · <StatusBadge status={order.status} /> <StatusBadge status={order.paymentStatus} />
          </p>
        </div>
        <Link href={`/order/${order.orderNumber}`} target="_blank" className="btn-outline px-4 py-2 text-xs">
          Customer view ↗
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <section className="card">
            <h2 className="border-b border-ink/10 px-6 py-4 font-display text-xl">Items</h2>
            <ul className="divide-y divide-ink/8">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-center gap-4 px-6 py-4">
                  <div className="relative h-16 w-12 shrink-0 overflow-hidden bg-sand">
                    {item.image && <Image src={item.image} alt="" fill sizes="48px" className="object-cover" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-ink/45">
                      {item.sku}{item.sizeLabel ? ` · ${item.sizeLabel}` : ''} · {formatMoney(item.unitPrice, order.currency)} × {item.quantity}
                    </p>
                  </div>
                  <p className="text-sm">{formatMoney(item.lineTotal, order.currency)}</p>
                </li>
              ))}
            </ul>
            <dl className="space-y-2 border-t border-ink/10 px-6 py-5 text-sm">
              <div className="flex justify-between"><dt className="text-ink/55">Subtotal</dt><dd>{formatMoney(order.subtotal, order.currency)}</dd></div>
              <div className="flex justify-between"><dt className="text-ink/55">Shipping</dt><dd>{order.shippingFee ? formatMoney(order.shippingFee, order.currency) : 'Free'}</dd></div>
              <div className="flex justify-between text-xs text-ink/45"><dt>Includes GST</dt><dd>{formatMoney(order.taxAmount, order.currency)}</dd></div>
              <div className="flex justify-between border-t border-ink/10 pt-2 text-base font-medium"><dt>Total</dt><dd>{formatMoney(order.total, order.currency)}</dd></div>
            </dl>
          </section>

          <section className="card p-6">
            <h2 className="mb-4 font-display text-xl">Payment</h2>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="label">Provider</dt><dd>{order.paymentProvider ?? 'xpay'}</dd></div>
              <div><dt className="label">Payment status</dt><dd><StatusBadge status={order.paymentStatus} /></dd></div>
              <div><dt className="label">XPay order id</dt><dd className="break-all font-mono text-xs">{order.xpayOrderId ?? '—'}</dd></div>
              <div><dt className="label">XPay payment id</dt><dd className="break-all font-mono text-xs">{order.xpayPaymentId ?? '—'}</dd></div>
            </dl>
            {order.paymentRaw && (
              <details className="mt-4">
                <summary className="cursor-pointer text-xs text-ink/50">Raw gateway response</summary>
                <pre className="mt-2 max-h-64 overflow-auto bg-sand p-3 text-[11px] leading-relaxed">
                  {JSON.stringify(JSON.parse(order.paymentRaw), null, 2)}
                </pre>
              </details>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className="card p-6">
            <h2 className="mb-4 font-display text-lg">Fulfilment</h2>
            <OrderStatusForm order={order} />
          </section>

          <section className="card p-6 text-sm">
            <h2 className="mb-4 font-display text-lg">Customer</h2>
            <p className="font-medium">{order.firstName} {order.lastName}</p>
            <p className="mt-1 text-ink/60">
              <a href={`mailto:${order.email}`} className="hover:text-brand-700">{order.email}</a>
            </p>
            <p className="text-ink/60">
              <a href={`tel:${order.phone}`} className="hover:text-brand-700">{order.phone}</a>
            </p>
            <h3 className="label mt-5">Shipping address</h3>
            <address className="not-italic leading-relaxed text-ink/70">
              {order.address1}{order.address2 ? <>, {order.address2}</> : null}<br />
              {order.city}, {order.state} {order.postcode}<br />
              {order.country}
            </address>
            {order.notes && (
              <>
                <h3 className="label mt-5">Notes</h3>
                <p className="whitespace-pre-line text-ink/70">{order.notes}</p>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
