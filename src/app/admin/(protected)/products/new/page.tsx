import Link from 'next/link';
import { prisma } from '@/lib/db';
import { ProductForm } from '@/components/admin/ProductForm';

export const dynamic = 'force-dynamic';

export default async function NewProductPage() {
  const categories = await prisma.category.findMany({ orderBy: { sortOrder: 'asc' }, select: { id: true, name: true } });
  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/products" className="text-xs text-ink/50 hover:text-ink">← Products</Link>
        <h1 className="mt-2 font-display text-3xl">Add a product</h1>
      </div>
      <ProductForm categories={categories} />
    </div>
  );
}
