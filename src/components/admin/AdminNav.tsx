'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const LINKS = [
  { href: '/admin', label: 'Dashboard', exact: true },
  { href: '/admin/products', label: 'Products' },
  { href: '/admin/orders', label: 'Orders' },
  { href: '/admin/blog', label: 'Blog' },
  { href: '/admin/categories', label: 'Collections' },
  { href: '/admin/enquiries', label: 'Enquiries' },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin sections" className="hidden items-center gap-1 md:flex">
      {LINKS.map((link) => {
        const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'rounded-sm px-3 py-1.5 text-sm transition-colors',
              active ? 'bg-ink text-white' : 'text-ink/65 hover:bg-ink/5 hover:text-ink'
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
