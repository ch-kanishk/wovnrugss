import Link from 'next/link';

export function Breadcrumbs({ items }: { items: { name: string; url: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="py-4 text-xs text-ink/55">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, i) => (
          <li key={item.url} className="flex items-center gap-1.5">
            {i > 0 && <span aria-hidden="true">/</span>}
            {i === items.length - 1 ? (
              <span aria-current="page" className="text-ink">{item.name}</span>
            ) : (
              <Link href={item.url} className="transition-colors hover:text-brand-700">{item.name}</Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
