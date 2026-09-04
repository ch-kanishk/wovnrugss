import type { Metadata } from 'next';
import { site } from './config';

export function absoluteUrl(path = '/') {
  return `${site.url}${path.startsWith('/') ? path : `/${path}`}`;
}

interface SeoInput {
  title: string;
  description?: string;
  path?: string;
  image?: string;
  type?: 'website' | 'article' | 'product';
  noIndex?: boolean;
  publishedTime?: string;
  tags?: string[];
}

export function buildMetadata({
  title,
  description = site.description,
  path = '/',
  image = site.defaultOgImage,
  type = 'website',
  noIndex = false,
  publishedTime,
  tags,
}: SeoInput): Metadata {
  const url = absoluteUrl(path);
  const ogImage = image.startsWith('http') ? image : absoluteUrl(image);
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 } },
    openGraph: {
      title,
      description,
      url,
      siteName: site.name,
      type: type === 'product' ? 'website' : type,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
      locale: 'en_IN',
      ...(publishedTime ? { publishedTime } : {}),
      ...(tags ? { tags } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}

/* ----------------------------- JSON-LD blocks ---------------------------- */

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: site.name,
    url: site.url,
    logo: absoluteUrl('/brand/logo.svg'),
    email: site.email,
    telephone: site.phone,
    address: {
      '@type': 'PostalAddress',
      streetAddress: site.address.street,
      addressLocality: site.address.city,
      addressRegion: site.address.region,
      postalCode: site.address.postalCode,
      addressCountry: site.address.country,
    },
    sameAs: Object.values(site.social),
  };
}

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: site.name,
    url: site.url,
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${site.url}/search?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.url),
    })),
  };
}

export function productJsonLd(p: {
  name: string;
  slug: string;
  sku: string;
  description?: string | null;
  price: number;
  currency: string;
  stock: number;
  images: string[];
  material?: string | null;
  colorFamily?: string | null;
  widthCm?: number | null;
  lengthCm?: number | null;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    sku: p.sku,
    description: p.description || undefined,
    image: p.images.map((i) => (i.startsWith('http') ? i : absoluteUrl(i))),
    brand: { '@type': 'Brand', name: site.name },
    material: p.material || undefined,
    color: p.colorFamily || undefined,
    ...(p.widthCm && p.lengthCm
      ? {
          width: { '@type': 'QuantitativeValue', value: p.widthCm, unitCode: 'CMT' },
          depth: { '@type': 'QuantitativeValue', value: p.lengthCm, unitCode: 'CMT' },
        }
      : {}),
    offers: {
      '@type': 'Offer',
      url: absoluteUrl(`/rugs/${p.slug}`),
      priceCurrency: p.currency,
      price: (p.price / 100).toFixed(2),
      itemCondition: 'https://schema.org/NewCondition',
      availability: p.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: { '@type': 'Organization', name: site.name },
    },
  };
}

export function articleJsonLd(p: {
  title: string;
  slug: string;
  excerpt?: string | null;
  coverImage?: string | null;
  author: string;
  publishedAt?: Date | null;
  updatedAt: Date;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: p.title,
    description: p.excerpt || undefined,
    image: p.coverImage ? [p.coverImage.startsWith('http') ? p.coverImage : absoluteUrl(p.coverImage)] : undefined,
    author: { '@type': 'Organization', name: p.author },
    publisher: { '@type': 'Organization', name: site.name, logo: { '@type': 'ImageObject', url: absoluteUrl('/brand/logo.svg') } },
    datePublished: (p.publishedAt || p.updatedAt).toISOString(),
    dateModified: p.updatedAt.toISOString(),
    mainEntityOfPage: absoluteUrl(`/blog/${p.slug}`),
  };
}

export function faqJsonLd(faqs: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}
