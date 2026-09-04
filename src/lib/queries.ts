import { Prisma } from '@prisma/client';
import { prisma } from './db';

export const PRODUCT_CARD_SELECT = {
  id: true, name: true, slug: true, sku: true, price: true, compareAt: true,
  currency: true, stock: true, material: true, technique: true, style: true,
  colorFamily: true, shape: true, sizeLabel: true, isFeatured: true,
  images: { select: { url: true, alt: true }, orderBy: { sortOrder: 'asc' as const }, take: 2 },
} satisfies Prisma.ProductSelect;

export type ProductCardData = Prisma.ProductGetPayload<{ select: typeof PRODUCT_CARD_SELECT }>;

export interface ProductFilters {
  q?: string;
  category?: string;
  material?: string[];
  technique?: string[];
  style?: string[];
  color?: string[];
  shape?: string[];
  minPrice?: number; // rupees
  maxPrice?: number; // rupees
  sort?: string;
  page?: number;
  perPage?: number;
}

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'name-asc', label: 'Name: A–Z' },
] as const;

function orderBy(sort?: string): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case 'price-asc': return [{ price: 'asc' }];
    case 'price-desc': return [{ price: 'desc' }];
    case 'name-asc': return [{ name: 'asc' }];
    default: return [{ isFeatured: 'desc' }, { createdAt: 'desc' }];
  }
}

export function buildProductWhere(f: ProductFilters): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = { isActive: true };
  const and: Prisma.ProductWhereInput[] = [];

  if (f.q) {
    // mode:'insensitive' is required on PostgreSQL — unlike SQLite, `contains`
    // is case-sensitive there, so "wool" would not match "Wool" without it.
    and.push({
      OR: [
        { name: { contains: f.q, mode: 'insensitive' } },
        { shortDesc: { contains: f.q, mode: 'insensitive' } },
        { description: { contains: f.q, mode: 'insensitive' } },
        { sku: { contains: f.q, mode: 'insensitive' } },
        { material: { contains: f.q, mode: 'insensitive' } },
        { style: { contains: f.q, mode: 'insensitive' } },
      ],
    });
  }
  if (f.category) and.push({ category: { slug: f.category } });
  if (f.material?.length) and.push({ material: { in: f.material } });
  if (f.technique?.length) and.push({ technique: { in: f.technique } });
  if (f.style?.length) and.push({ style: { in: f.style } });
  if (f.color?.length) and.push({ colorFamily: { in: f.color } });
  if (f.shape?.length) and.push({ shape: { in: f.shape } });
  if (f.minPrice !== undefined) and.push({ price: { gte: f.minPrice * 100 } });
  if (f.maxPrice !== undefined) and.push({ price: { lte: f.maxPrice * 100 } });

  if (and.length) where.AND = and;
  return where;
}

export async function listProducts(f: ProductFilters) {
  const perPage = Math.min(Math.max(f.perPage ?? 12, 1), 48);
  const page = Math.max(f.page ?? 1, 1);
  const where = buildProductWhere(f);

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      select: PRODUCT_CARD_SELECT,
      orderBy: orderBy(f.sort),
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.product.count({ where }),
  ]);

  return { items, total, page, perPage, pages: Math.max(1, Math.ceil(total / perPage)) };
}

/** Distinct facet values with counts, computed over active products. */
export async function getFacets() {
  const rows = await prisma.product.findMany({
    where: { isActive: true },
    select: { material: true, technique: true, style: true, colorFamily: true, shape: true, price: true },
  });

  const tally = (key: keyof (typeof rows)[number]) => {
    const map = new Map<string, number>();
    for (const r of rows) {
      const v = r[key];
      if (typeof v === 'string' && v) map.set(v, (map.get(v) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([value, count]) => ({ value, count }));
  };

  const prices = rows.map((r) => r.price).sort((a, b) => a - b);
  return {
    material: tally('material'),
    technique: tally('technique'),
    style: tally('style'),
    color: tally('colorFamily'),
    shape: tally('shape'),
    minPrice: prices.length ? Math.floor(prices[0] / 100) : 0,
    maxPrice: prices.length ? Math.ceil(prices[prices.length - 1] / 100) : 0,
  };
}

export async function getProductBySlug(slug: string) {
  return prisma.product.findFirst({
    where: { slug, isActive: true },
    include: {
      images: { orderBy: { sortOrder: 'asc' } },
      category: { select: { name: true, slug: true } },
    },
  });
}

export async function getRelatedProducts(product: { id: string; categoryId: string | null; style: string | null }) {
  return prisma.product.findMany({
    where: {
      isActive: true,
      id: { not: product.id },
      OR: [
        ...(product.categoryId ? [{ categoryId: product.categoryId }] : []),
        ...(product.style ? [{ style: product.style }] : []),
      ],
    },
    select: PRODUCT_CARD_SELECT,
    take: 4,
    orderBy: { createdAt: 'desc' },
  });
}

export async function listPosts({ page = 1, perPage = 9, tag }: { page?: number; perPage?: number; tag?: string } = {}) {
  const where: Prisma.PostWhereInput = {
    isPublished: true,
    ...(tag ? { tags: { contains: tag, mode: 'insensitive' as const } } : {}),
  };
  const [items, total] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.post.count({ where }),
  ]);
  return { items, total, page, perPage, pages: Math.max(1, Math.ceil(total / perPage)) };
}
