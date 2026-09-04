import type { Metadata } from 'next';
import { listProducts } from '@/lib/queries';
import { ProductGrid } from '@/components/ProductGrid';
import { Pagination } from '@/components/Pagination';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { buildMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  searchParams,
}: { searchParams: Promise<Record<string, string | string[] | undefined>> }): Promise<Metadata> {
  const sp = await searchParams;
  const q = typeof sp.q === 'string' ? sp.q : '';
  // Search result pages are intentionally kept out of the index.
  return buildMetadata({ title: q ? `Search: ${q}` : 'Search', path: '/search', noIndex: true });
}

export default async function SearchPage({
  searchParams,
}: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const q = typeof sp.q === 'string' ? sp.q.trim() : '';
  const { items, total, page, pages } = await listProducts({ q: q || undefined, page: Number(sp.page ?? 1), perPage: 16 });

  return (
    <div className="container-page pb-20">
      <Breadcrumbs items={[{ name: 'Home', url: '/' }, { name: 'Search', url: '/search' }]} />
      <header className="border-b border-ink/10 pb-8">
        <h1 className="font-display text-4xl">{q ? `Results for “${q}”` : 'Search our rugs'}</h1>
        <p className="mt-2 text-sm text-ink/60">{total} {total === 1 ? 'match' : 'matches'}</p>
        <form action="/search" role="search" className="mt-6 flex max-w-md gap-2">
          <label htmlFor="search-q" className="sr-only">Search rugs</label>
          <input id="search-q" name="q" defaultValue={q} placeholder="Try “blue wool runner”" className="input" />
          <button type="submit" className="btn-primary px-6">Search</button>
        </form>
      </header>
      <div className="pt-10">
        <ProductGrid products={items} />
        <Pagination page={page} pages={pages} basePath="/search" searchParams={sp} />
      </div>
    </div>
  );
}
