'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import {
  SESSION_COOKIE, SESSION_MAX_AGE, checkCredentials, createSessionToken, requireSession,
} from '@/lib/auth';
import { slugify } from '@/lib/utils';

export type ActionState = {
  error?: string;
  success?: string;
  /**
   * The submitted values, echoed back on error. React 19 resets an uncontrolled
   * form once its action resolves, so without this a validation error would wipe
   * everything the user typed. Forms feed these back through defaultValue.
   */
  values?: Record<string, string>;
} | null;

/** Plain string entries of a submission, for echoing back on error. */
function formValues(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === 'string' && key !== 'password') out[key] = value;
  }
  return out;
}

/* --------------------------------- auth --------------------------------- */

export async function login(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');
  const next = String(formData.get('next') ?? '/admin');

  if (!checkCredentials(email, password)) {
    return { error: 'Incorrect email or password.', values: { email } };
  }

  const store = await cookies();
  store.set(SESSION_COOKIE, createSessionToken(email), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
  redirect(next.startsWith('/admin') ? next : '/admin');
}

export async function logout() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect('/admin/login');
}

/* ------------------------------- products ------------------------------- */

const productSchema = z.object({
  name: z.string().trim().min(2, 'Name is required'),
  slug: z.string().trim().optional(),
  sku: z.string().trim().min(1, 'SKU is required'),
  shortDesc: z.string().trim().max(400).optional(),
  description: z.string().trim().max(8000).optional(),
  price: z.coerce.number().min(1, 'Price must be greater than zero'),
  compareAt: z.coerce.number().optional(),
  stock: z.coerce.number().int().min(0).default(0),
  categoryId: z.string().optional(),
  material: z.string().trim().optional(),
  technique: z.string().trim().optional(),
  style: z.string().trim().optional(),
  colorFamily: z.string().trim().optional(),
  shape: z.string().trim().optional(),
  sizeLabel: z.string().trim().optional(),
  widthCm: z.coerce.number().int().optional(),
  lengthCm: z.coerce.number().int().optional(),
  pileHeight: z.string().trim().optional(),
  knotsPerSqIn: z.coerce.number().int().optional(),
  metaTitle: z.string().trim().max(70).optional(),
  metaDescription: z.string().trim().max(180).optional(),
  isActive: z.coerce.boolean().default(true),
  isFeatured: z.coerce.boolean().default(false),
});

function blankToUndefined(v: FormDataEntryValue | null) {
  const s = v === null ? '' : String(v).trim();
  return s === '' ? undefined : s;
}

/** Turns the product form into validated data. Prices arrive in rupees, stored in paise. */
async function parseProductForm(formData: FormData) {
  const raw = {
    name: String(formData.get('name') ?? ''),
    slug: blankToUndefined(formData.get('slug')),
    sku: String(formData.get('sku') ?? ''),
    shortDesc: blankToUndefined(formData.get('shortDesc')),
    description: blankToUndefined(formData.get('description')),
    price: formData.get('price'),
    compareAt: blankToUndefined(formData.get('compareAt')),
    stock: formData.get('stock') ?? 0,
    categoryId: blankToUndefined(formData.get('categoryId')),
    material: blankToUndefined(formData.get('material')),
    technique: blankToUndefined(formData.get('technique')),
    style: blankToUndefined(formData.get('style')),
    colorFamily: blankToUndefined(formData.get('colorFamily')),
    shape: blankToUndefined(formData.get('shape')),
    sizeLabel: blankToUndefined(formData.get('sizeLabel')),
    widthCm: blankToUndefined(formData.get('widthCm')),
    lengthCm: blankToUndefined(formData.get('lengthCm')),
    pileHeight: blankToUndefined(formData.get('pileHeight')),
    knotsPerSqIn: blankToUndefined(formData.get('knotsPerSqIn')),
    metaTitle: blankToUndefined(formData.get('metaTitle')),
    metaDescription: blankToUndefined(formData.get('metaDescription')),
    isActive: formData.get('isActive') === 'on',
    isFeatured: formData.get('isFeatured') === 'on',
  };

  const parsed = productSchema.parse(raw);
  const images = formData
    .getAll('images')
    .map((v) => String(v).trim())
    .filter(Boolean);

  return {
    data: {
      name: parsed.name,
      slug: slugify(parsed.slug || parsed.name),
      sku: parsed.sku,
      shortDesc: parsed.shortDesc ?? null,
      description: parsed.description ?? null,
      price: Math.round(parsed.price * 100),
      compareAt: parsed.compareAt ? Math.round(parsed.compareAt * 100) : null,
      stock: parsed.stock,
      categoryId: parsed.categoryId ?? null,
      material: parsed.material ?? null,
      technique: parsed.technique ?? null,
      style: parsed.style ?? null,
      colorFamily: parsed.colorFamily ?? null,
      shape: parsed.shape ?? null,
      sizeLabel: parsed.sizeLabel ?? null,
      widthCm: parsed.widthCm ?? null,
      lengthCm: parsed.lengthCm ?? null,
      pileHeight: parsed.pileHeight ?? null,
      knotsPerSqIn: parsed.knotsPerSqIn ?? null,
      metaTitle: parsed.metaTitle ?? null,
      metaDescription: parsed.metaDescription ?? null,
      isActive: parsed.isActive,
      isFeatured: parsed.isFeatured,
    },
    images,
  };
}

function friendlyError(err: unknown) {
  if (err instanceof z.ZodError) return err.errors[0]?.message ?? 'Please check the form.';
  if (typeof err === 'object' && err && 'code' in err && (err as any).code === 'P2002') {
    return 'That SKU or slug is already in use.';
  }
  return err instanceof Error ? err.message : 'Something went wrong.';
}

export async function saveProduct(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireSession();
  const id = String(formData.get('id') ?? '');

  let payload;
  try {
    payload = await parseProductForm(formData);
  } catch (err) {
    return { error: friendlyError(err), values: formValues(formData) };
  }

  try {
    if (id) {
      await prisma.product.update({
        where: { id },
        data: {
          ...payload.data,
          images: {
            deleteMany: {},
            create: payload.images.map((url, i) => ({ url, alt: payload.data.name, sortOrder: i })),
          },
        },
      });
    } else {
      await prisma.product.create({
        data: {
          ...payload.data,
          images: { create: payload.images.map((url, i) => ({ url, alt: payload.data.name, sortOrder: i })) },
        },
      });
    }
  } catch (err) {
    return { error: friendlyError(err), values: formValues(formData) };
  }

  revalidatePath('/admin/products');
  revalidatePath('/rugs');
  revalidatePath(`/rugs/${payload.data.slug}`);
  revalidatePath('/');
  redirect('/admin/products?saved=1');
}

export async function deleteProduct(formData: FormData) {
  await requireSession();
  const id = String(formData.get('id') ?? '');
  if (id) await prisma.product.delete({ where: { id } });
  revalidatePath('/admin/products');
  revalidatePath('/rugs');
}

export async function toggleProductActive(formData: FormData) {
  await requireSession();
  const id = String(formData.get('id') ?? '');
  const product = await prisma.product.findUnique({ where: { id }, select: { isActive: true, slug: true } });
  if (!product) return;
  await prisma.product.update({ where: { id }, data: { isActive: !product.isActive } });
  revalidatePath('/admin/products');
  revalidatePath('/rugs');
  revalidatePath(`/rugs/${product.slug}`);
}

/* -------------------------------- orders -------------------------------- */

const ORDER_STATUSES = ['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED', 'FAILED'] as const;

export async function updateOrder(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireSession();
  const id = String(formData.get('id') ?? '');
  const status = String(formData.get('status') ?? '');
  if (!id || !ORDER_STATUSES.includes(status as (typeof ORDER_STATUSES)[number])) {
    return { error: 'Invalid order status.' };
  }

  await prisma.order.update({
    where: { id },
    data: {
      status,
      trackingNumber: blankToUndefined(formData.get('trackingNumber')) ?? null,
      carrier: blankToUndefined(formData.get('carrier')) ?? null,
      notes: blankToUndefined(formData.get('notes')) ?? null,
      ...(status === 'REFUNDED' ? { paymentStatus: 'REFUNDED' } : {}),
      ...(status === 'PAID' ? { paymentStatus: 'PAID' } : {}),
    },
  });

  revalidatePath('/admin/orders');
  revalidatePath(`/admin/orders/${id}`);
  return { success: 'Order updated.' };
}

/* --------------------------------- blog --------------------------------- */

const postSchema = z.object({
  title: z.string().trim().min(3, 'Title is required'),
  slug: z.string().trim().optional(),
  excerpt: z.string().trim().max(400).optional(),
  content: z.string().trim().min(20, 'Content is too short'),
  coverImage: z.string().trim().optional(),
  author: z.string().trim().default('Wovn Rugs'),
  tags: z.string().trim().optional(),
  metaTitle: z.string().trim().max(70).optional(),
  metaDescription: z.string().trim().max(180).optional(),
  isPublished: z.boolean().default(false),
});

export async function savePost(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireSession();
  const id = String(formData.get('id') ?? '');

  let parsed;
  try {
    parsed = postSchema.parse({
      title: String(formData.get('title') ?? ''),
      slug: blankToUndefined(formData.get('slug')),
      excerpt: blankToUndefined(formData.get('excerpt')),
      content: String(formData.get('content') ?? ''),
      coverImage: blankToUndefined(formData.get('coverImage')),
      author: blankToUndefined(formData.get('author')) ?? 'Wovn Rugs',
      tags: blankToUndefined(formData.get('tags')),
      metaTitle: blankToUndefined(formData.get('metaTitle')),
      metaDescription: blankToUndefined(formData.get('metaDescription')),
      isPublished: formData.get('isPublished') === 'on',
    });
  } catch (err) {
    return { error: friendlyError(err), values: formValues(formData) };
  }

  const slug = slugify(parsed.slug || parsed.title);
  const data = {
    title: parsed.title,
    slug,
    excerpt: parsed.excerpt ?? null,
    content: parsed.content,
    coverImage: parsed.coverImage ?? null,
    author: parsed.author,
    tags: parsed.tags ?? null,
    metaTitle: parsed.metaTitle ?? null,
    metaDescription: parsed.metaDescription ?? null,
    isPublished: parsed.isPublished,
  };

  try {
    if (id) {
      const existing = await prisma.post.findUnique({ where: { id }, select: { publishedAt: true } });
      await prisma.post.update({
        where: { id },
        data: {
          ...data,
          // Stamp publishedAt the first time a post goes live; never move it after.
          publishedAt: parsed.isPublished ? (existing?.publishedAt ?? new Date()) : null,
        },
      });
    } else {
      await prisma.post.create({
        data: { ...data, publishedAt: parsed.isPublished ? new Date() : null },
      });
    }
  } catch (err) {
    return { error: friendlyError(err), values: formValues(formData) };
  }

  revalidatePath('/admin/blog');
  revalidatePath('/blog');
  revalidatePath(`/blog/${slug}`);
  redirect('/admin/blog?saved=1');
}

export async function deletePost(formData: FormData) {
  await requireSession();
  const id = String(formData.get('id') ?? '');
  if (id) await prisma.post.delete({ where: { id } });
  revalidatePath('/admin/blog');
  revalidatePath('/blog');
}

export async function togglePostPublished(formData: FormData) {
  await requireSession();
  const id = String(formData.get('id') ?? '');
  const post = await prisma.post.findUnique({ where: { id }, select: { isPublished: true, publishedAt: true, slug: true } });
  if (!post) return;
  const next = !post.isPublished;
  await prisma.post.update({
    where: { id },
    data: { isPublished: next, publishedAt: next ? (post.publishedAt ?? new Date()) : null },
  });
  revalidatePath('/admin/blog');
  revalidatePath('/blog');
  revalidatePath(`/blog/${post.slug}`);
}

/* ------------------------------ categories ------------------------------ */

export async function saveCategory(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireSession();
  const id = String(formData.get('id') ?? '');
  const name = String(formData.get('name') ?? '').trim();
  if (name.length < 2) return { error: 'Name is required.', values: formValues(formData) };

  const data = {
    name,
    slug: slugify(blankToUndefined(formData.get('slug')) || name),
    description: blankToUndefined(formData.get('description')) ?? null,
    heroImage: blankToUndefined(formData.get('heroImage')) ?? null,
    metaTitle: blankToUndefined(formData.get('metaTitle')) ?? null,
    metaDescription: blankToUndefined(formData.get('metaDescription')) ?? null,
    sortOrder: Number(formData.get('sortOrder') ?? 0) || 0,
    isActive: formData.get('isActive') === 'on',
  };

  try {
    if (id) await prisma.category.update({ where: { id }, data });
    else await prisma.category.create({ data });
  } catch (err) {
    return { error: friendlyError(err), values: formValues(formData) };
  }

  revalidatePath('/admin/categories');
  revalidatePath('/');
  revalidatePath(`/collections/${data.slug}`);
  return { success: 'Collection saved.' };
}

export async function deleteCategory(formData: FormData) {
  await requireSession();
  const id = String(formData.get('id') ?? '');
  if (id) await prisma.category.delete({ where: { id } });
  revalidatePath('/admin/categories');
  revalidatePath('/');
}

/* ------------------------------- enquiries ------------------------------ */

export async function markEnquiryRead(formData: FormData) {
  await requireSession();
  const id = String(formData.get('id') ?? '');
  if (id) await prisma.enquiry.update({ where: { id }, data: { isRead: true } });
  revalidatePath('/admin/enquiries');
}

export async function deleteEnquiry(formData: FormData) {
  await requireSession();
  const id = String(formData.get('id') ?? '');
  if (id) await prisma.enquiry.delete({ where: { id } });
  revalidatePath('/admin/enquiries');
}
