'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useCart } from './CartProvider';
import { Logo } from './Logo';
import { cn } from '@/lib/utils';

const NAV = [
  { label: 'All Rugs', href: '/rugs' },
  { label: 'Hand-Knotted', href: '/collections/hand-knotted' },
  { label: 'Hand-Tufted', href: '/collections/hand-tufted' },
  { label: 'Flatweave', href: '/collections/flatweave' },
  { label: 'Runners', href: '/collections/runners' },
  { label: 'Journal', href: '/blog' },
  { label: 'About', href: '/about' },
];

export function Header() {
  const pathname = usePathname();
  const { count, ready } = useCart();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className="sticky top-0 z-50 border-b border-ink/10 bg-white/95 backdrop-blur">
      <div className="bg-ink text-white">
        <div className="container-page flex h-9 items-center justify-center text-[11px] uppercase tracking-[0.18em]">
          Free shipping across India on orders above ₹15,000
        </div>
      </div>

      <div className="container-page flex h-20 items-center justify-between gap-6">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="Toggle navigation menu"
          className="-ml-2 p-2 lg:hidden"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <><path d="M3 6h18" /><path d="M3 12h18" /><path d="M3 18h18" /></>}
          </svg>
        </button>

        <Link href="/" aria-label="Wovn Rugs — home" className="shrink-0">
          <Logo variant="lockup-h" height={40} priority className="h-9 w-auto sm:h-10" />
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-7 lg:flex">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'text-[13px] uppercase tracking-[0.1em] transition-colors',
                  active ? 'text-brand-700' : 'text-ink/70 hover:text-ink'
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <form action="/search" role="search" className="hidden items-center md:flex">
            <label htmlFor="site-search" className="sr-only">Search rugs</label>
            <input
              id="site-search"
              name="q"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search rugs…"
              className="w-40 border-b border-ink/20 bg-transparent px-1 py-1.5 text-sm outline-none transition-[width] focus:w-56 focus:border-brand-600"
            />
          </form>

          <Link href="/cart" className="relative p-2" aria-label={`Cart, ${ready ? count : 0} items`}>
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M6 2l1.5 4h13L19 15H8L6 2H3" />
              <circle cx="10" cy="20" r="1.4" /><circle cx="18" cy="20" r="1.4" />
            </svg>
            {ready && count > 0 && (
              <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-700 px-1 text-[10px] font-semibold text-white">
                {count}
              </span>
            )}
          </Link>
        </div>
      </div>

      {open && (
        <nav aria-label="Mobile" className="border-t border-ink/10 bg-white lg:hidden">
          <ul className="container-page py-2">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="block border-b border-ink/5 py-3 text-sm uppercase tracking-wider text-ink/80">
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <form action="/search" role="search" className="py-3">
                <label htmlFor="mobile-search" className="sr-only">Search rugs</label>
                <input id="mobile-search" name="q" placeholder="Search rugs…" className="input" />
              </form>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
