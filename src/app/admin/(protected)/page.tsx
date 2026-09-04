import Link from 'next/link';
import { prisma } from '@/lib/db';
import { formatMoney, formatDate } from '@/lib/utils';
import { StatusBadge } from '@/components/admin/StatusBadge';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [revenue, orderCount, pendingCount, productCount, lowStock, draftPosts, unreadEnquiries, recentOrders] =
    await Promise.all([
      prisma.order.aggregate({ _sum: { total: true }, where: { paymentStatus: 'PAID', createdAt: { gte: thirtyDaysAgo } } }),
      prisma.order.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.order.count({ where: { status: { in: ['PAID', 'PROCESSING'] } } }),
      prisma.product.count({ where: { isActive: true } }),
      prisma.product.count({ where: { isActive: true, stock: { lte: 2 } } }),
      prisma.post.count({ where: { isPublished: false } }),
      prisma.enquiry.count({ where: { isRead: false } }),
      prisma.order.findMany({ orderBy: { createdAt: 'desc' }, take: 8, include: { items: true } }),
    ]);

  const stats = [
    { label: 'Revenue (30 days)', value: formatMoney(revenue._sum.total ?? 0), href: '/admin/orders' },
    { label: 'Orders (30 days)', value: String(orderCount), href: '/admin/orders' },
    { label: 'Awaiting fulfilment', value: String(pendingCount), href: '/admin/orders?status=PROCESSING' },
    { label: 'Live products', value: String(productCount), href: '/admin/products' },
  ];

  const alerts = [
    lowStock > 0 && { text: `${lowStock} product${lowStock > 1 ? 's' : ''} low on stock`, href: '/admin/products?lowStock=1' },
    draftPosts > 0 && { text: `${draftPosts} unpublished blog draft${draftPosts > 1 ? 's' : ''}`, href: '/admin/blog' },
    unreadEnquiries > 0 && { text: `${unreadEnquiries} unread enquir${unreadEnquiries > 1 ? 'ies' : 'y'}`, href: '/admin/enquiries' },
  ].filter(Boolean) as { text: string; href: string }[];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl">Dashboard</h1>
        <div className="flex gap-2">
          <Link href="/admin/products/new" className="btn-primary px-4 py-2 text-xs">+ New product</Link>
          <Link href="/admin/blog/new" className="btn-outline px-4 py-2 text-xs">+ New post</Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="card p-6 transition-colors hover:border-ink/25">
            <p className="text-xs uppercase tracking-wider text-ink/50">{s.label}</p>
            <p className="mt-2 font-display text-3xl">{s.value}</p>
          </Link>
        ))}
      </div>

      {alerts.length > 0 && (
        <ul className="card divide-y divide-ink/10">
          {alerts.map((a) => (
            <li key={a.text}>
              <Link href={a.href} className="flex items-center justify-between px-6 py-3 text-sm hover:bg-sand">
                <span>{a.text}</span>
                <span className="text-ink/40">→</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <section className="card">
        <div className="flex items-center justify-between border-b border-ink/10 px-6 py-4">
          <h2 className="font-display text-xl">Recent orders</h2>
          <Link href="/admin/orders" className="text-xs text-brand-700 underline underline-offset-4">View all</Link>
        </div>
        {recentOrders.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-ink/50">No orders yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-ink/10 text-left text-xs uppercase tracking-wider text-ink/50">
                <tr>
                  <th className="px-6 py-3 font-medium">Order</th>
                  <th className="px-6 py-3 font-medium">Customer</th>
                  <th className="px-6 py-3 font-medium">Items</th>
                  <th className="px-6 py-3 font-medium">Total</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/8">
                {recentOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-sand">
                    <td className="px-6 py-3">
                      <Link href={`/admin/orders/${o.id}`} className="text-brand-700 hover:underline">{o.orderNumber}</Link>
                    </td>
                    <td className="px-6 py-3">{o.firstName} {o.lastName}</td>
                    <td className="px-6 py-3 text-ink/60">{o.items.length}</td>
                    <td className="px-6 py-3">{formatMoney(o.total, o.currency)}</td>
                    <td className="px-6 py-3"><StatusBadge status={o.status} /></td>
                    <td className="px-6 py-3 text-ink/55">{formatDate(o.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
