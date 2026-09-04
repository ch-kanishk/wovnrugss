import { ProductCard } from './ProductCard';
import type { ProductCardData } from '@/lib/queries';

export function ProductGrid({ products }: { products: ProductCardData[] }) {
  if (!products.length) {
    return (
      <div className="col-span-full py-24 text-center">
        <p className="font-display text-2xl text-ink">No rugs match these filters</p>
        <p className="mt-2 text-sm text-ink/60">Try widening your selection or clearing a filter.</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} priority={i < 4} />
      ))}
    </div>
  );
}
