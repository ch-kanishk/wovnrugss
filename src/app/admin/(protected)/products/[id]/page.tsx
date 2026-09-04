import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { ProductForm } from '@/components/admin/ProductForm';

export const dynamic = 'force-dynamic';

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    prisma.product.findUnique({ where: { id }, include: { images: { orderBy: { sortOrder: 'asc' } } } }),
    prisma.category.findMany({ orderBy: { sortOrder: 'asc' }, select: { id: true, name: true } }),
  ]);
  if (!product) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/products" className="text-xs text-ink/50 hover:text-ink">← Products</Link>
          <h1 className="mt-2 font-display text-3xl">{product.name}</h1>
        </div>
        <Link href={`/rugs/${product.slug}`} target="_blank" className="btn-outline px-4 py-2 text-xs">
          View on store ↗
        </Link>
      </div>
      <ProductForm product={product} categories={categories} />
    </div>
  );
}
