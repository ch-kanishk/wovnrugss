import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Filters, SortBar } from '@/components/Filters';
import { Pagination } from '@/components/Pagination';
import { ProductGrid } from '@/components/ProductGrid';
import { JsonLd } from '@/components/JsonLd';
import { getFacets, listProducts } from '@/lib/queries';
import { absoluteUrl, breadcrumbJsonLd, buildMetadata } from '@/lib/seo';

export const revalidate = 120;

type SP = Record<string, string | string[] | undefined>;

export async function generateMetadata({ searchParams }: { searchParams: Promise<SP> }): Promise<Metadata> {
  const sp = await searchParams;
  const page = Number(sp.page ?? 1);
  const suffix = page > 1 ? ` — Page ${page}` : '';
  // Filtered permutations are noindexed to avoid crawling thin, near-duplicate facets.
  const isFiltered = ['material', 'technique', 'style', 'color', 'shape', 'minPrice', 'maxPrice'].some((k) => sp[k]);
  return buildMetadata({
    title: `Hand-Knotted & Hand-Tufted Rugs${suffix}`,
    description:
      'Browse the full Bonanza Rugs collection — hand-knotted wool and silk carpets, hand-tufted rugs, flatweave dhurries and runners, made in Jaipur and shipped worldwide.',
    path: page > 1 ? `/rugs?page=${page}` : '/rugs',
    noIndex: isFiltered,
  });
}

function arr(v: string | string[] | undefined): string[] | undefined {
  if (!v) return undefined;
  return Array.isArray(v) ? v : [v];
}

export default async function RugsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;

  const [{ items, total, page, pages }, facets] = await Promise.all([
    listProducts({
      q: typeof sp.q === 'string' ? sp.q : undefined,
      material: arr(sp.material),
      technique: arr(sp.technique),
      style: arr(sp.style),
      color: arr(sp.color),
      shape: arr(sp.shape),
      minPrice: sp.minPrice ? Number(sp.minPrice) : undefined,
      maxPrice: sp.maxPrice ? Number(sp.maxPrice) : undefined,
      sort: typeof sp.sort === 'string' ? sp.sort : undefined,
      page: Number(sp.page ?? 1),
    }),
    getFacets(),
  ]);

  const crumbs = [{ name: 'Home', url: '/' }, { name: 'All Rugs', url: '/rugs' }];

  return (
    <div className="container-page pb-20">
      <JsonLd
        data={[
          breadcrumbJsonLd(crumbs),
          {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: 'Hand-Knotted & Hand-Tufted Rugs',
            url: absoluteUrl('/rugs'),
            hasPart: items.slice(0, 12).map((p) => ({
              '@type': 'Product',
              name: p.name,
              url: absoluteUrl(`/rugs/${p.slug}`),
              image: p.images[0]?.url,
              offers: { '@type': 'Offer', price: (p.price / 100).toFixed(2), priceCurrency: p.currency },
            })),
          },
        ]}
      />

      <Breadcrumbs items={crumbs} />

      <header className="border-b border-ink/10 pb-10 pt-4">
        <h1 className="font-display text-5xl">All Rugs</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink/60">
          Every rug in this collection is made by hand in Jaipur. Filter by technique, material, colour
          and size to find the piece that fits your room — or ask us to weave it to your exact dimensions.
        </p>
      </header>

      <div className="grid gap-10 pt-10 lg:grid-cols-[240px_1fr] lg:gap-14">
        <Suspense fallback={<div className="text-sm text-ink/40">Loading filters…</div>}>
          <Filters facets={facets} basePath="/rugs" />
        </Suspense>

        <div>
          <Suspense fallback={null}>
            <SortBar total={total} basePath="/rugs" />
          </Suspense>
          <ProductGrid products={items} />
          <Pagination page={page} pages={pages} basePath="/rugs" searchParams={sp} />
        </div>
      </div>
    </div>
  );
}
