import type { MetadataRoute } from 'next';
import { site } from '@/lib/config';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Thin, private or duplicate surfaces are kept out of the crawl budget.
        disallow: ['/admin', '/admin/', '/api/', '/cart', '/checkout', '/order/', '/search'],
      },
    ],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
