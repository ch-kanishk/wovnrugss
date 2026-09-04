import Link from 'next/link';
import { cn } from '@/lib/utils';

export function Pagination({
  page, pages, basePath, searchParams,
}: {
  page: number; pages: number; basePath: string; searchParams: Record<string, string | string[] | undefined>;
}) {
  if (pages <= 1) return null;

  const href = (p: number) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(searchParams)) {
      if (k === 'page' || v === undefined) continue;
      if (Array.isArray(v)) v.forEach((val) => params.append(k, val));
      else params.set(k, v);
    }
    if (p > 1) params.set('page', String(p));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const numbers = Array.from({ length: pages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === pages || Math.abs(p - page) <= 1
  );

  return (
    <nav aria-label="Pagination" className="mt-16 flex items-center justify-center gap-2">
      {page > 1 && (
        <Link href={href(page - 1)} rel="prev" className="btn-outline px-4 py-2 text-xs">Previous</Link>
      )}
      {numbers.map((p, i) => (
        <span key={p} className="flex items-center gap-2">
          {i > 0 && numbers[i - 1] !== p - 1 && <span className="text-ink/30">…</span>}
          <Link
            href={href(p)}
            aria-current={p === page ? 'page' : undefined}
            className={cn(
              'flex h-9 w-9 items-center justify-center border text-xs transition-colors',
              p === page ? 'border-ink bg-ink text-white' : 'border-ink/15 text-ink/70 hover:border-ink'
            )}
          >
            {p}
          </Link>
        </span>
      ))}
      {page < pages && (
        <Link href={href(page + 1)} rel="next" className="btn-outline px-4 py-2 text-xs">Next</Link>
      )}
    </nav>
  );
}
