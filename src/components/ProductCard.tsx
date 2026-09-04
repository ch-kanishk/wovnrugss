import Image from 'next/image';
import Link from 'next/link';
import { formatMoney } from '@/lib/utils';
import type { ProductCardData } from '@/lib/queries';

export function ProductCard({ product, priority = false }: { product: ProductCardData; priority?: boolean }) {
  const primary = product.images[0];
  const hover = product.images[1];
  const discount =
    product.compareAt && product.compareAt > product.price
      ? Math.round(((product.compareAt - product.price) / product.compareAt) * 100)
      : 0;

  return (
    <article className="group">
      <Link href={`/rugs/${product.slug}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden bg-sand">
          {primary ? (
            <>
              <Image
                src={primary.url}
                alt={primary.alt || product.name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                priority={priority}
                className="object-cover transition-opacity duration-500 group-hover:opacity-0"
              />
              {hover && (
                <Image
                  src={hover.url}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                />
              )}
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-ink/30">No image</div>
          )}

          {discount > 0 && (
            <span className="badge absolute left-3 top-3 bg-ink text-white">{discount}% off</span>
          )}
          {product.stock === 0 && (
            <span className="badge absolute right-3 top-3 bg-white text-ink">Sold out</span>
          )}
        </div>

        <div className="pt-4">
          <p className="text-[11px] uppercase tracking-[0.16em] text-ink/45">
            {[product.technique, product.material].filter(Boolean).join(' · ')}
          </p>
          <h3 className="mt-1.5 font-display text-lg leading-snug text-ink transition-colors group-hover:text-brand-700">
            {product.name}
          </h3>
          {product.sizeLabel && <p className="mt-0.5 text-xs text-ink/50">{product.sizeLabel}</p>}
          <p className="mt-2 flex items-baseline gap-2">
            <span className="text-sm font-medium text-ink">{formatMoney(product.price, product.currency)}</span>
            {product.compareAt && product.compareAt > product.price && (
              <span className="text-xs text-ink/40 line-through">
                {formatMoney(product.compareAt, product.currency)}
              </span>
            )}
          </p>
        </div>
      </Link>
    </article>
  );
}
