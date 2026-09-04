'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCart } from './CartProvider';
import { formatMoney } from '@/lib/utils';

export function CartView() {
  const { lines, subtotal, setQuantity, remove, ready } = useCart();

  if (!ready) return <p className="py-16 text-sm text-ink/50">Loading your cart…</p>;

  if (!lines.length) {
    return (
      <div className="py-20 text-center">
        <p className="font-display text-2xl">Your cart is empty</p>
        <p className="mt-2 text-sm text-ink/60">Every rug is one of a kind — go find yours.</p>
        <Link href="/rugs" className="btn-primary mt-8">Browse rugs</Link>
      </div>
    );
  }

  return (
    <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_380px]">
      <ul className="divide-y divide-ink/10 border-y border-ink/10">
        {lines.map((line) => (
          <li key={line.productId} className="flex gap-5 py-6">
            <Link href={`/rugs/${line.slug}`} className="relative h-32 w-24 shrink-0 overflow-hidden bg-sand">
              {line.image && <Image src={line.image} alt={line.name} fill sizes="96px" className="object-cover" />}
            </Link>

            <div className="flex flex-1 flex-col justify-between">
              <div>
                <Link href={`/rugs/${line.slug}`} className="font-display text-lg hover:text-brand-700">
                  {line.name}
                </Link>
                <p className="mt-1 text-xs text-ink/50">
                  {line.sku}{line.sizeLabel ? ` · ${line.sizeLabel}` : ''}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center border border-ink/15">
                  <button
                    type="button"
                    onClick={() => setQuantity(line.productId, line.quantity - 1)}
                    className="px-2.5 py-1.5 text-ink/60 hover:text-ink"
                    aria-label={`Decrease quantity of ${line.name}`}
                  >−</button>
                  <span className="min-w-8 px-2 text-center text-sm">{line.quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(line.productId, line.quantity + 1)}
                    className="px-2.5 py-1.5 text-ink/60 hover:text-ink"
                    aria-label={`Increase quantity of ${line.name}`}
                  >+</button>
                </div>
                <button
                  type="button"
                  onClick={() => remove(line.productId)}
                  className="text-xs uppercase tracking-wider text-ink/45 underline underline-offset-4 hover:text-red-600"
                >
                  Remove
                </button>
              </div>
            </div>

            <p className="w-28 text-right text-sm font-medium">{formatMoney(line.price * line.quantity)}</p>
          </li>
        ))}
      </ul>

      <aside className="h-fit border border-ink/10 p-7">
        <h2 className="font-display text-xl">Order summary</h2>
        <dl className="mt-6 space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink/60">Subtotal</dt>
            <dd>{formatMoney(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink/60">Shipping</dt>
            <dd className="text-ink/60">Calculated at checkout</dd>
          </div>
        </dl>
        <Link href="/checkout" className="btn-primary mt-7 w-full">Proceed to checkout</Link>
        <Link href="/rugs" className="btn-ghost mt-2 w-full">Continue shopping</Link>
        <p className="mt-5 text-center text-[11px] text-ink/45">Secure payments processed by XPay</p>
      </aside>
    </div>
  );
}
