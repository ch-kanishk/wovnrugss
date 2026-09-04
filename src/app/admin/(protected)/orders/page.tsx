import Link from 'next/link';
import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { formatMoney, formatDate } from '@/lib/utils';
import { StatusBadge } from '@/components/admin/StatusBadge';

export const dynamic = 'force-dynamic';

const STATUSES = ['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED', 'FAILED'];

export default async function AdminOrders({
  searchParams,
}: { searchParams: Promise<{ status?: string; q?: string; page?: string }> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1));
  const perPage = 25;

  const where: Prisma.OrderWhereInput = {
    ...(sp.status ? { status: sp.status } : {}),
    ...(sp.q
      ? {
          OR: [
            { orderNumber: { contains: sp.q, mode: 'insensitive' } },
            { email: { contains: sp.q, mode: 'insensitive' } },
            { firstName: { contains: sp.q, mode: 'insensitive' } },
            { lastName: { contains: sp.q, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [orders, total, revenue] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { items: { select: { id: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.order.count({ where }),
    prisma.order.aggregate({ _sum: { total: true }, where: { ...where, paymentStatus: 'PAID' } }),
  ]);

  const pages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">Orders</h1>
          <p className="mt-1 text-sm text-ink/55">
            {total} order{total === 1 ? '' : 's'} · {formatMoney(revenue._sum.total ?? 0)} paid
          </p>
        </div>
        <form className="flex flex-wrap gap-2">
          <input name="q" defaultValue={sp.q ?? ''} placeholder="Order no., name or email" className="input max-w-xs" />
          <select name="status" defaultValue={sp.status ?? ''} className="input w-auto">
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <button type="submit" className="btn-outline px-5 py-2 text-xs">Filter</button>
        </form>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-ink/10 text-left text-xs uppercase tracking-wider text-ink/50">
            <tr>
              <th className="px-4 py-3 font-medium">Order</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Items</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Payment</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Placed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/8">
            {orders.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-16 text-center text-ink/50">No orders match.</td></tr>
            )}
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-sand">
                <td className="px-4 py-3">
                  <Link href={`/admin/orders/${o.id}`} className="font-mono text-xs text-brand-700 hover:underline">
                    {o.orderNumber}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <p>{o.firstName} {o.lastName}</p>
                  <p className="text-xs text-ink/45">{o.email}</p>
                </td>
                <td className="px-4 py-3 text-ink/60">{o.items.length}</td>
                <td className="px-4 py-3">{formatMoney(o.total, o.currency)}</td>
                <td className="px-4 py-3"><StatusBadge status={o.paymentStatus} /></td>
                <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                <td className="px-4 py-3 text-ink/55">{formatDate(o.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <nav className="flex justify-center gap-2 text-sm">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/admin/orders?page=${p}${sp.status ? `&status=${sp.status}` : ''}${sp.q ? `&q=${encodeURIComponent(sp.q)}` : ''}`}
              className={`flex h-8 w-8 items-center justify-center border ${p === page ? 'border-ink bg-ink text-white' : 'border-ink/15'}`}
            >
              {p}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
