import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Pagination } from '@/components/Pagination';
import { JsonLd } from '@/components/JsonLd';
import { listPosts } from '@/lib/queries';
import { absoluteUrl, breadcrumbJsonLd, buildMetadata } from '@/lib/seo';
import { formatDate, readingTime } from '@/lib/utils';

export const revalidate = 300;

export async function generateMetadata({
  searchParams,
}: { searchParams: Promise<Record<string, string | string[] | undefined>> }): Promise<Metadata> {
  const sp = await searchParams;
  const page = Number(sp.page ?? 1);
  return buildMetadata({
    title: `The Journal${page > 1 ? ` — Page ${page}` : ''}`,
    description:
      'Rug care guides, styling ideas and stories from the looms of Jaipur. Learn how hand-knotted rugs are made and how to choose the right one for your room.',
    path: page > 1 ? `/blog?page=${page}` : '/blog',
  });
}

export default async function BlogIndex({
  searchParams,
}: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const tag = typeof sp.tag === 'string' ? sp.tag : undefined;
  const { items, page, pages, total } = await listPosts({ page: Number(sp.page ?? 1), tag });

  const crumbs = [{ name: 'Home', url: '/' }, { name: 'Journal', url: '/blog' }];

  return (
    <div className="container-page pb-20">
      <JsonLd
        data={[
          breadcrumbJsonLd(crumbs),
          {
            '@context': 'https://schema.org',
            '@type': 'Blog',
            name: 'The Bonanza Rugs Journal',
            url: absoluteUrl('/blog'),
            blogPost: items.map((p) => ({
              '@type': 'BlogPosting',
              headline: p.title,
              url: absoluteUrl(`/blog/${p.slug}`),
              datePublished: (p.publishedAt ?? p.createdAt).toISOString(),
            })),
          },
        ]}
      />

      <Breadcrumbs items={crumbs} />
      <header className="border-b border-ink/10 pb-10">
        <h1 className="font-display text-5xl">The Journal</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink/60">
          Care guides, sizing advice and dispatches from our weaving studio — everything we know about
          living with a handmade rug.
        </p>
        {tag && (
          <p className="mt-4 text-sm">
            Filtered by <strong>{tag}</strong> ·{' '}
            <Link href="/blog" className="text-brand-700 underline underline-offset-4">clear</Link>
          </p>
        )}
      </header>

      {items.length === 0 ? (
        <p className="py-24 text-center text-ink/50">No articles published yet.</p>
      ) : (
        <div className="grid gap-x-8 gap-y-14 pt-12 md:grid-cols-2 lg:grid-cols-3">
          {items.map((post) => (
            <article key={post.id}>
              <Link href={`/blog/${post.slug}`} className="group block">
                <div className="relative aspect-[16/10] overflow-hidden bg-sand">
                  {post.coverImage && (
                    <Image
                      src={post.coverImage}
                      alt={post.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  )}
                </div>
                <p className="mt-4 text-[11px] uppercase tracking-[0.16em] text-ink/45">
                  {post.publishedAt ? formatDate(post.publishedAt) : ''} · {readingTime(post.content)} min read
                </p>
                <h2 className="mt-2 font-display text-2xl leading-snug transition-colors group-hover:text-brand-700">
                  {post.title}
                </h2>
                {post.excerpt && <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink/60">{post.excerpt}</p>}
              </Link>
            </article>
          ))}
        </div>
      )}

      <Pagination page={page} pages={pages} basePath="/blog" searchParams={sp} />
      <p className="sr-only">{total} articles published.</p>
    </div>
  );
}
