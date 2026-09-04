import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { JsonLd } from '@/components/JsonLd';
import { ProductGallery } from '@/components/ProductGallery';
import { AddToCartButton } from '@/components/AddToCartButton';
import { ProductCard } from '@/components/ProductCard';
import { getProductBySlug, getRelatedProducts } from '@/lib/queries';
import { breadcrumbJsonLd, buildMetadata, productJsonLd } from '@/lib/seo';
import { formatMoney } from '@/lib/utils';

export const revalidate = 300;

export async function generateStaticParams() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: { slug: true },
    take: 200,
    orderBy: { createdAt: 'desc' },
  });
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return buildMetadata({ title: 'Rug not found', noIndex: true });

  const auto = [product.technique, product.material, product.style, 'rug']
    .filter(Boolean)
    .join(' ');
  return buildMetadata({
    title: product.metaTitle || `${product.name} — ${product.sizeLabel ?? ''} ${auto}`.trim(),
    description:
      product.metaDescription ||
      product.shortDesc ||
      `${product.name}: a ${auto} handmade in Jaipur${product.sizeLabel ? `, ${product.sizeLabel}` : ''}. ${formatMoney(product.price, product.currency)} with free shipping across India.`,
    path: `/rugs/${product.slug}`,
    image: product.images[0]?.url,
    type: 'product',
  });
}

const SPEC_LABELS: [string, string][] = [
  ['sku', 'SKU'],
  ['technique', 'Technique'],
  ['material', 'Material'],
  ['style', 'Style'],
  ['colorFamily', 'Colour family'],
  ['shape', 'Shape'],
  ['sizeLabel', 'Size'],
  ['pileHeight', 'Pile height'],
  ['knotsPerSqIn', 'Knots per sq. inch'],
  ['originCity', 'Made in'],
];

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = await getRelatedProducts(product);
  const crumbs = [
    { name: 'Home', url: '/' },
    { name: 'All Rugs', url: '/rugs' },
    ...(product.category ? [{ name: product.category.name, url: `/collections/${product.category.slug}` }] : []),
    { name: product.name, url: `/rugs/${product.slug}` },
  ];

  const specs = SPEC_LABELS.map(([key, label]) => [label, (product as any)[key]]).filter(
    ([, value]) => value !== null && value !== undefined && value !== ''
  ) as [string, string | number][];

  const discount =
    product.compareAt && product.compareAt > product.price
      ? Math.round(((product.compareAt - product.price) / product.compareAt) * 100)
      : 0;

  return (
    <div className="container-page pb-20">
      <JsonLd
        data={[
          breadcrumbJsonLd(crumbs),
          productJsonLd({
            name: product.name,
            slug: product.slug,
            sku: product.sku,
            description: product.shortDesc || product.description,
            price: product.price,
            currency: product.currency,
            stock: product.stock,
            images: product.images.map((i) => i.url),
            material: product.material,
            colorFamily: product.colorFamily,
            widthCm: product.widthCm,
            lengthCm: product.lengthCm,
          }),
        ]}
      />

      <Breadcrumbs items={crumbs} />

      <div className="grid gap-12 pt-4 lg:grid-cols-2 lg:gap-16">
        <ProductGallery images={product.images} name={product.name} />

        <div className="lg:pt-6">
          {product.category && (
            <Link
              href={`/collections/${product.category.slug}`}
              className="eyebrow hover:underline hover:underline-offset-4"
            >
              {product.category.name}
            </Link>
          )}
          <h1 className="mt-3 font-display text-4xl leading-tight">{product.name}</h1>

          <div className="mt-5 flex items-baseline gap-3">
            <span className="text-2xl font-medium">{formatMoney(product.price, product.currency)}</span>
            {discount > 0 && (
              <>
                <span className="text-base text-ink/40 line-through">
                  {formatMoney(product.compareAt!, product.currency)}
                </span>
                <span className="badge bg-brand-100 text-brand-800">Save {discount}%</span>
              </>
            )}
          </div>
          <p className="mt-1 text-xs text-ink/50">Inclusive of all taxes. Free shipping in India above ₹15,000.</p>

          {product.shortDesc && (
            <p className="mt-6 text-sm leading-relaxed text-ink/70">{product.shortDesc}</p>
          )}

          <div className="mt-8 border-y border-ink/10 py-8">
            <AddToCartButton
              stock={product.stock}
              line={{
                productId: product.id,
                slug: product.slug,
                name: product.name,
                sku: product.sku,
                sizeLabel: product.sizeLabel,
                image: product.images[0]?.url ?? null,
                price: product.price,
                quantity: 1,
              }}
            />
          </div>

          {specs.length > 0 && (
            <section className="mt-8">
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-ink">Specifications</h2>
              <dl className="divide-y divide-ink/8 text-sm">
                {specs.map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-6 py-2.5">
                    <dt className="text-ink/55">{label}</dt>
                    <dd className="text-right text-ink">{String(value)}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {product.description && (
            <section className="mt-8">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-ink">About this rug</h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-ink/70">{product.description}</p>
            </section>
          )}

          <section className="mt-8 space-y-2 text-sm text-ink/60">
            <p>· Dispatched from our Jaipur studio within 3–5 working days.</p>
            <p>· 30-day room trial — return it if the colour is not right.</p>
            <p>· <Link href="/contact?topic=custom" className="text-brand-700 underline underline-offset-2">Need another size?</Link> We weave to order.</p>
          </section>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-24">
          <h2 className="mb-10 font-display text-3xl">You may also like</h2>
          <div className="grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
