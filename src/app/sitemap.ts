import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/db';
import { site } from '@/lib/config';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories, posts] = await Promise.all([
    prisma.product.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
    prisma.category.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
    prisma.post.findMany({ where: { isPublished: true }, select: { slug: true, updatedAt: true } }),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${site.url}/`, changeFrequency: 'daily', priority: 1 },
    { url: `${site.url}/rugs`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${site.url}/blog`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${site.url}/about`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${site.url}/contact`, changeFrequency: 'monthly', priority: 0.5 },
    ...['shipping', 'returns', 'privacy', 'terms'].map((slug) => ({
      url: `${site.url}/policies/${slug}`,
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    })),
  ];

  return [
    ...staticRoutes,
    ...categories.map((c) => ({
      url: `${site.url}/collections/${c.slug}`,
      lastModified: c.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...products.map((p) => ({
      url: `${site.url}/rugs/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...posts.map((p) => ({
      url: `${site.url}/blog/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
  ];
}
