import Link from 'next/link';
import { site } from '@/lib/config';
import { NewsletterForm } from './NewsletterForm';
import { Logo } from './Logo';

const COLUMNS = [
  {
    title: 'Shop',
    links: [
      { label: 'All Rugs', href: '/rugs' },
      { label: 'Hand-Knotted', href: '/collections/hand-knotted' },
      { label: 'Hand-Tufted', href: '/collections/hand-tufted' },
      { label: 'Flatweave & Dhurrie', href: '/collections/flatweave' },
      { label: 'Runners', href: '/collections/runners' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'Our Story', href: '/about' },
      { label: 'The Journal', href: '/blog' },
      { label: 'Contact Us', href: '/contact' },
      { label: 'Trade Programme', href: '/contact?topic=trade' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Shipping & Delivery', href: '/policies/shipping' },
      { label: 'Returns & Refunds', href: '/policies/returns' },
      { label: 'Rug Care Guide', href: '/blog' },
      { label: 'Privacy Policy', href: '/policies/privacy' },
      { label: 'Terms of Service', href: '/policies/terms' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-24 border-t border-ink/10 bg-sand">
      <div className="container-page grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Link href="/" aria-label="Bonanza Rugs — home" className="inline-block">
            <Logo variant="full" height={104} className="h-[104px] w-auto" />
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink/65">
            Hand-knotted and hand-tufted rugs made by master weavers in Jaipur, India — one knot at a
            time, for floors that outlive trends.
          </p>
          <div className="mt-6">
            <NewsletterForm />
          </div>
        </div>

        {COLUMNS.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-ink">{col.title}</h2>
            <ul className="space-y-2.5">
              {col.links.map((link) => (
                <li key={link.href + link.label}>
                  <Link href={link.href} className="text-sm text-ink/65 transition-colors hover:text-brand-700">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-t border-ink/10">
        <div className="container-page flex flex-col gap-3 py-6 text-xs text-ink/55 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {site.name}. All rights reserved.</p>
          <p className="flex items-center gap-3">
            <span>Secure payments by XPay</span>
            <span aria-hidden="true">·</span>
            <a href={`mailto:${site.email}`} className="hover:text-brand-700">{site.email}</a>
          </p>
        </div>
      </div>
    </footer>
  );
}
