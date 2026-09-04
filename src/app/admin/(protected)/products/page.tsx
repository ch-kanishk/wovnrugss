import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { formatMoney } from '@/lib/utils';
import { deleteProduct, toggleProductActive } from '@/app/admin/actions';
import { ConfirmSubmit } from '@/components/admin/ConfirmSubmit';

export const dynamic = 'force-dynamic';

export default async function AdminProducts({
  searchParams,
}: { searchParams: Promise<{ q?: string; lowStock?: string; page?: string }> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1));
  const perPage = 25;

  const where: Prisma.ProductWhereInput = {
    ...(sp.q ? { OR: [{ name: { contains: sp.q, mode: 'insensitive' as const } }, { sku: { contains: sp.q, mode: 'insensitive' as const } }] } : {}),
    ...(sp.lowStock ? { stock: { lte: 2 } } : {}),
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { images: { take: 1, orderBy: { sortOrder: 'asc' } }, category: { select: { name: true } } },
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.product.count({ where }),
  ]);

  const pages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">Products</h1>
          <p className="mt-1 text-sm text-ink/55">{total} total</p>
        </div>
        <Link href="/admin/products/new" className="btn-primary px-5 py-2.5 text-xs">+ Add product</Link>
      </div>

      <form className="flex flex-wrap gap-2">
        <input name="q" defaultValue={sp.q ?? ''} placeholder="Search by name or SKU" className="input max-w-xs" />
        <label className="flex items-center gap-2 text-sm text-ink/65">
          <input type="checkbox" name="lowStock" value="1" defaultChecked={Boolean(sp.lowStock)} className="accent-brand-700" />
          Low stock only
        </label>
        <button type="submit" className="btn-outline px-5 py-2 text-xs">Filter</button>
        {(sp.q || sp.lowStock) && (
          <Link href="/admin/products" className="btn-ghost text-xs">Clear</Link>
        )}
      </form>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-ink/10 text-left text-xs uppercase tracking-wider text-ink/50">
            <tr>
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">SKU</th>
              <th className="px-4 py-3 font-medium">Collection</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Stock</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/8">
            {products.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-16 text-center text-ink/50">No products found.</td></tr>
            )}
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-sand">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-10 shrink-0 overflow-hidden bg-sand">
                      {p.images[0] && <Image src={p.images[0].url} alt="" fill sizes="40px" className="object-cover" />}
                    </div>
                    <div>
                      <Link href={`/admin/products/${p.id}`} className="font-medium text-ink hover:text-brand-700">{p.name}</Link>
                      <p className="text-xs text-ink/45">{p.sizeLabel ?? '—'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-ink/60">{p.sku}</td>
                <td className="px-4 py-3 text-ink/60">{p.category?.name ?? '—'}</td>
                <td className="px-4 py-3">{formatMoney(p.price, p.currency)}</td>
                <td className={p.stock <= 2 ? 'px-4 py-3 font-medium text-red-600' : 'px-4 py-3'}>{p.stock}</td>
                <td className="px-4 py-3">
                  <span className={`badge ${p.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-ink/10 text-ink/55'}`}>
                    {p.isActive ? 'Live' : 'Hidden'}
                  </span>
                  {p.isFeatured && <span className="badge ml-1 bg-brand-100 text-brand-800">Featured</span>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2 text-xs">
                    <Link href={`/rugs/${p.slug}`} target="_blank" className="text-ink/50 hover:text-ink">View</Link>
                    <Link href={`/admin/products/${p.id}`} className="text-brand-700 hover:underline">Edit</Link>
                    <form action={toggleProductActive}>
                      <input type="hidden" name="id" value={p.id} />
                      <button type="submit" className="text-ink/50 hover:text-ink">{p.isActive ? 'Hide' : 'Show'}</button>
                    </form>
                    <form action={deleteProduct}>
                      <input type="hidden" name="id" value={p.id} />
                      <ConfirmSubmit label="Delete" message={`Delete “${p.name}” permanently?`} />
                    </form>
                  </div>
                </td>
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
              href={`/admin/products?page=${p}${sp.q ? `&q=${encodeURIComponent(sp.q)}` : ''}`}
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
