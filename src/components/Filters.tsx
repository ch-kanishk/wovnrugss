'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState } from 'react';
import { SORT_OPTIONS } from '@/lib/queries';
import { cn } from '@/lib/utils';

interface Facet { value: string; count: number }
export interface FacetData {
  material: Facet[]; technique: Facet[]; style: Facet[]; color: Facet[]; shape: Facet[];
  minPrice: number; maxPrice: number;
}

const GROUPS: { key: keyof FacetData; label: string }[] = [
  { key: 'technique', label: 'Technique' },
  { key: 'material', label: 'Material' },
  { key: 'style', label: 'Style' },
  { key: 'color', label: 'Colour' },
  { key: 'shape', label: 'Shape' },
];

export function Filters({ facets, basePath }: { facets: FacetData; basePath: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const [openMobile, setOpenMobile] = useState(false);

  const selected = useCallback((key: string) => params.getAll(key), [params]);

  const toggle = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      const current = next.getAll(key);
      next.delete(key);
      const updated = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
      updated.forEach((v) => next.append(key, v));
      next.delete('page');
      router.push(`${basePath}?${next.toString()}`, { scroll: false });
    },
    [params, router, basePath]
  );

  const setParam = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (value) next.set(key, value);
      else next.delete(key);
      next.delete('page');
      router.push(`${basePath}?${next.toString()}`, { scroll: false });
    },
    [params, router, basePath]
  );

  const activeCount = GROUPS.reduce((n, g) => n + selected(g.key).length, 0) +
    (params.get('minPrice') ? 1 : 0) + (params.get('maxPrice') ? 1 : 0);

  const panel = (
    <div className="space-y-8">
      {activeCount > 0 && (
        <button type="button" onClick={() => router.push(basePath)} className="text-xs uppercase tracking-wider text-brand-700 underline underline-offset-4">
          Clear all filters ({activeCount})
        </button>
      )}

      {GROUPS.map((group) => {
        const options = facets[group.key] as Facet[];
        if (!options?.length) return null;
        const chosen = selected(group.key);
        return (
          <fieldset key={group.key}>
            <legend className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-ink">{group.label}</legend>
            <ul className="space-y-2">
              {options.map((opt) => (
                <li key={opt.value}>
                  <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink/75 hover:text-ink">
                    <input
                      type="checkbox"
                      checked={chosen.includes(opt.value)}
                      onChange={() => toggle(group.key, opt.value)}
                      className="h-4 w-4 rounded-none border-ink/30 text-ink accent-brand-700"
                    />
                    <span className="flex-1">{opt.value}</span>
                    <span className="text-xs text-ink/40">{opt.count}</span>
                  </label>
                </li>
              ))}
            </ul>
          </fieldset>
        );
      })}

      <fieldset>
        <legend className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-ink">Price (₹)</legend>
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="minPrice">Minimum price</label>
          <input
            id="minPrice" type="number" inputMode="numeric" placeholder={String(facets.minPrice)}
            defaultValue={params.get('minPrice') ?? ''}
            onBlur={(e) => setParam('minPrice', e.target.value)}
            className="input py-1.5 text-xs"
          />
          <span className="text-ink/40">–</span>
          <label className="sr-only" htmlFor="maxPrice">Maximum price</label>
          <input
            id="maxPrice" type="number" inputMode="numeric" placeholder={String(facets.maxPrice)}
            defaultValue={params.get('maxPrice') ?? ''}
            onBlur={(e) => setParam('maxPrice', e.target.value)}
            className="input py-1.5 text-xs"
          />
        </div>
      </fieldset>
    </div>
  );

  return (
    <>
      {/* Mobile toolbar */}
      <div className="mb-6 flex items-center justify-between gap-3 lg:hidden">
        <button type="button" onClick={() => setOpenMobile((v) => !v)} className="btn-outline px-4 py-2 text-xs">
          Filters{activeCount ? ` (${activeCount})` : ''}
        </button>
        <SortSelect value={params.get('sort') ?? 'newest'} onChange={(v) => setParam('sort', v)} />
      </div>
      <div className={cn('mb-8 lg:hidden', openMobile ? 'block' : 'hidden')}>{panel}</div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:block">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-ink">Refine</h2>
        </div>
        {panel}
      </aside>
    </>
  );
}

export function SortSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="sort" className="text-xs uppercase tracking-wider text-ink/50">Sort</label>
      <select id="sort" value={value} onChange={(e) => onChange(e.target.value)} className="input w-auto py-1.5 text-xs">
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

export function SortBar({ total, basePath }: { total: number; basePath: string }) {
  const router = useRouter();
  const params = useSearchParams();
  return (
    <div className="mb-8 hidden items-center justify-between border-b border-ink/10 pb-4 lg:flex">
      <p className="text-sm text-ink/60">{total} {total === 1 ? 'rug' : 'rugs'}</p>
      <SortSelect
        value={params.get('sort') ?? 'newest'}
        onChange={(v) => {
          const next = new URLSearchParams(params.toString());
          next.set('sort', v);
          next.delete('page');
          router.push(`${basePath}?${next.toString()}`, { scroll: false });
        }}
      />
    </div>
  );
}
