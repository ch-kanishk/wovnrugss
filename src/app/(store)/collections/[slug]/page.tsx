import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Suspense } from 'react';
import { prisma } from '@/lib/db';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Filters, SortBar } from '@/components/Filters';
import { Pagination } from '@/components/Pagination';
import { ProductGrid } from '@/components/ProductGrid';
import { JsonLd } from '@/components/JsonLd';
import { getFacets, listProducts } from '@/lib/queries';
import { breadcrumbJsonLd, buildMetadata } from '@/lib/seo';

export const revalidate = 300;

type SP = Record<string, string | string[] | undefined>;

export async function generateStaticParams() {
  const categories = await prisma.category.findMany({ where: { isActive: true }, select: { slug: true } });
  return categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const category = await prisma.category.findUnique({ where: { slug } });
  if (!category) return buildMetadata({ title: 'Collection not found', noIndex: true });
  return buildMetadata({
    title: category.metaTitle || `${category.name} Rugs`,
    description: category.metaDescription || category.description || undefined,
    path: `/collections/${category.slug}`,
    image: category.heroImage || undefined,
  });
}

function arr(v: string | string[] | undefined) {
  if (!v) return undefined;
  return Array.isArray(v) ? v : [v];
}

export default async function CollectionPage({
  params, searchParams,
}: { params: Promise<{ slug: string }>; searchParams: Promise<SP> }) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const category = await prisma.category.findFirst({ where: { slug, isActive: true } });
  if (!category) notFound();

  const basePath = `/collections/${category.slug}`;
  const [{ items, total, page, pages }, facets] = await Promise.all([
    listProducts({
      category: category.slug,
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

  const crumbs = [
    { name: 'Home', url: '/' },
    { name: 'Collections', url: '/rugs' },
    { name: category.name, url: basePath },
  ];

  return (
    <div>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />

      {category.heroImage && (
        <div className="relative h-[38vh] min-h-[280px] w-full overflow-hidden bg-sand">
          <Image src={category.heroImage} alt={category.name} fill priority sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-black/35" />
          <div className="container-page relative flex h-full items-end pb-10">
            <h1 className="font-display text-5xl text-white">{category.name}</h1>
          </div>
        </div>
      )}

      <div className="container-page pb-20">
        <Breadcrumbs items={crumbs} />
        {!category.heroImage && <h1 className="pb-4 font-display text-5xl">{category.name}</h1>}
        {category.description && (
          <p className="max-w-2xl border-b border-ink/10 pb-10 text-sm leading-relaxed text-ink/60">
            {category.description}
          </p>
        )}

        <div className="grid gap-10 pt-10 lg:grid-cols-[240px_1fr] lg:gap-14">
          <Suspense fallback={null}>
            <Filters facets={facets} basePath={basePath} />
          </Suspense>
          <div>
            <Suspense fallback={null}>
              <SortBar total={total} basePath={basePath} />
            </Suspense>
            <ProductGrid products={items} />
            <Pagination page={page} pages={pages} basePath={basePath} searchParams={sp} />
          </div>
        </div>
      </div>
    </div>
  );
}
