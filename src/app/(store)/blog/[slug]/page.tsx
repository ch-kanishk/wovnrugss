import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { JsonLd } from '@/components/JsonLd';
import { articleJsonLd, breadcrumbJsonLd, buildMetadata } from '@/lib/seo';
import { formatDate, readingTime, renderMarkdown } from '@/lib/utils';

export const revalidate = 300;

export async function generateStaticParams() {
  const posts = await prisma.post.findMany({ where: { isPublished: true }, select: { slug: true }, take: 100 });
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.post.findFirst({ where: { slug, isPublished: true } });
  if (!post) return buildMetadata({ title: 'Article not found', noIndex: true });
  return buildMetadata({
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.excerpt || undefined,
    path: `/blog/${post.slug}`,
    image: post.coverImage || undefined,
    type: 'article',
    publishedTime: (post.publishedAt ?? post.createdAt).toISOString(),
    tags: post.tags?.split(',').map((t) => t.trim()).filter(Boolean),
  });
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await prisma.post.findFirst({ where: { slug, isPublished: true } });
  if (!post) notFound();

  const related = await prisma.post.findMany({
    where: { isPublished: true, id: { not: post.id } },
    orderBy: { publishedAt: 'desc' },
    take: 3,
  });

  const tags = post.tags?.split(',').map((t) => t.trim()).filter(Boolean) ?? [];
  const crumbs = [
    { name: 'Home', url: '/' },
    { name: 'Journal', url: '/blog' },
    { name: post.title, url: `/blog/${post.slug}` },
  ];

  return (
    <article className="container-page pb-20">
      <JsonLd
        data={[
          breadcrumbJsonLd(crumbs),
          articleJsonLd({
            title: post.title,
            slug: post.slug,
            excerpt: post.excerpt,
            coverImage: post.coverImage,
            author: post.author,
            publishedAt: post.publishedAt,
            updatedAt: post.updatedAt,
          }),
        ]}
      />

      <Breadcrumbs items={crumbs} />

      <header className="mx-auto max-w-3xl pt-4 text-center">
        <p className="text-[11px] uppercase tracking-[0.18em] text-ink/45">
          {post.publishedAt ? formatDate(post.publishedAt) : ''} · {readingTime(post.content)} min read
        </p>
        <h1 className="mt-4 font-display text-4xl leading-tight sm:text-5xl">{post.title}</h1>
        {post.excerpt && <p className="mt-5 text-base leading-relaxed text-ink/65">{post.excerpt}</p>}
      </header>

      {post.coverImage && (
        <div className="relative mt-10 aspect-[16/9] w-full overflow-hidden bg-sand">
          <Image src={post.coverImage} alt={post.title} fill priority sizes="100vw" className="object-cover" />
        </div>
      )}

      <div
        className="prose-bonanza mx-auto mt-12 max-w-3xl text-[15px]"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }}
      />

      {tags.length > 0 && (
        <ul className="mx-auto mt-12 flex max-w-3xl flex-wrap gap-2">
          {tags.map((tag) => (
            <li key={tag}>
              <Link href={`/blog?tag=${encodeURIComponent(tag)}`} className="badge border border-ink/15 text-ink/60 hover:border-ink">
                {tag}
              </Link>
            </li>
          ))}
        </ul>
      )}

      {related.length > 0 && (
        <section className="mt-20 border-t border-ink/10 pt-14">
          <h2 className="mb-10 font-display text-3xl">Keep reading</h2>
          <div className="grid gap-8 md:grid-cols-3">
            {related.map((r) => (
              <Link key={r.id} href={`/blog/${r.slug}`} className="group block">
                <div className="relative aspect-[16/10] overflow-hidden bg-sand">
                  {r.coverImage && (
                    <Image src={r.coverImage} alt={r.title} fill sizes="33vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
                  )}
                </div>
                <h3 className="mt-4 font-display text-lg transition-colors group-hover:text-brand-700">{r.title}</h3>
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
