import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/db';
import { deleteCategory } from '@/app/admin/actions';
import { ConfirmSubmit } from '@/components/admin/ConfirmSubmit';
import { CategoryForm } from '@/components/admin/CategoryForm';

export const dynamic = 'force-dynamic';

export default async function AdminCategories() {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: 'asc' },
    include: { _count: { select: { products: true } } },
  });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl">Collections</h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-ink/10 text-left text-xs uppercase tracking-wider text-ink/50">
              <tr>
                <th className="px-4 py-3 font-medium">Collection</th>
                <th className="px-4 py-3 font-medium">Products</th>
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/8">
              {categories.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-16 text-center text-ink/50">No collections yet.</td></tr>
              )}
              {categories.map((c) => (
                <tr key={c.id} className="hover:bg-sand">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-14 shrink-0 overflow-hidden bg-sand">
                        {c.heroImage && <Image src={c.heroImage} alt="" fill sizes="56px" className="object-cover" />}
                      </div>
                      <div>
                        <p className="font-medium">{c.name}</p>
                        <p className="font-mono text-[11px] text-ink/40">/collections/{c.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-ink/60">{c._count.products}</td>
                  <td className="px-4 py-3 text-ink/60">{c.sortOrder}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${c.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-ink/10 text-ink/55'}`}>
                      {c.isActive ? 'Live' : 'Hidden'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-3 text-xs">
                      <Link href={`/collections/${c.slug}`} target="_blank" className="text-ink/50 hover:text-ink">View</Link>
                      <form action={deleteCategory}>
                        <input type="hidden" name="id" value={c.id} />
                        <ConfirmSubmit label="Delete" message={`Delete the “${c.name}” collection? Products stay but lose their collection.`} />
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <section className="card h-fit p-6">
          <h2 className="mb-5 font-display text-lg">Add a collection</h2>
          <CategoryForm />
        </section>
      </div>
    </div>
  );
}
