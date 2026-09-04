'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useCart } from './CartProvider';
import { formatMoney } from '@/lib/utils';

interface Quote {
  subtotal: number; shippingFee: number; taxAmount: number; total: number; currency: string;
}

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Delhi','Goa','Gujarat','Haryana',
  'Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya',
  'Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura',
  'Uttar Pradesh','Uttarakhand','West Bengal','Other / Outside India',
];

export function CheckoutForm() {
  const { lines, ready, clear } = useCart();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Server re-prices the cart — the displayed total always comes from the API.
  useEffect(() => {
    if (!ready || !lines.length) { setQuote(null); return; }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/cart/quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })) }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) { setError(data.error || 'Could not price your cart.'); return; }
        setError('');
        setQuote(data);
      } catch {
        if (!cancelled) setError('Could not reach the server. Please retry.');
      }
    })();
    return () => { cancelled = true; };
  }, [lines, ready]);

  if (!ready) return <p className="py-16 text-sm text-ink/50">Loading…</p>;

  if (!lines.length) {
    return (
      <div className="py-20 text-center">
        <p className="font-display text-2xl">Nothing to check out</p>
        <Link href="/rugs" className="btn-primary mt-6">Browse rugs</Link>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    const fd = new FormData(e.currentTarget);
    const payload = {
      customer: Object.fromEntries(fd.entries()),
      items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
    };

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Checkout failed.');
      // Cart is cleared only after the order row exists; the order page can restore context.
      clear();
      window.location.href = data.paymentUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed.');
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-10 grid gap-12 lg:grid-cols-[1fr_380px]">
      <div className="space-y-10">
        <fieldset>
          <legend className="mb-5 font-display text-xl">Contact</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="firstName" className="label">First name</label>
              <input id="firstName" name="firstName" required autoComplete="given-name" className="input" />
            </div>
            <div>
              <label htmlFor="lastName" className="label">Last name</label>
              <input id="lastName" name="lastName" required autoComplete="family-name" className="input" />
            </div>
            <div>
              <label htmlFor="email" className="label">Email</label>
              <input id="email" name="email" type="email" required autoComplete="email" className="input" />
            </div>
            <div>
              <label htmlFor="phone" className="label">Phone</label>
              <input id="phone" name="phone" type="tel" required autoComplete="tel" pattern="[0-9+\s\-]{8,15}" className="input" />
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-5 font-display text-xl">Shipping address</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="address1" className="label">Address line 1</label>
              <input id="address1" name="address1" required autoComplete="address-line1" className="input" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="address2" className="label">Address line 2 (optional)</label>
              <input id="address2" name="address2" autoComplete="address-line2" className="input" />
            </div>
            <div>
              <label htmlFor="city" className="label">City</label>
              <input id="city" name="city" required autoComplete="address-level2" className="input" />
            </div>
            <div>
              <label htmlFor="state" className="label">State</label>
              <select id="state" name="state" required autoComplete="address-level1" className="input" defaultValue="">
                <option value="" disabled>Select a state</option>
                {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="postcode" className="label">PIN / Postal code</label>
              <input id="postcode" name="postcode" required autoComplete="postal-code" className="input" />
            </div>
            <div>
              <label htmlFor="country" className="label">Country</label>
              <input id="country" name="country" defaultValue="India" required autoComplete="country-name" className="input" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="notes" className="label">Delivery notes (optional)</label>
              <textarea id="notes" name="notes" rows={3} className="input" />
            </div>
          </div>
        </fieldset>
      </div>

      <aside className="h-fit border border-ink/10 p-7 lg:sticky lg:top-32">
        <h2 className="font-display text-xl">Order summary</h2>

        <ul className="mt-6 space-y-4 border-b border-ink/10 pb-6">
          {lines.map((l) => (
            <li key={l.productId} className="flex gap-3">
              <div className="relative h-16 w-12 shrink-0 overflow-hidden bg-sand">
                {l.image && <Image src={l.image} alt="" fill sizes="48px" className="object-cover" />}
              </div>
              <div className="flex-1 text-sm">
                <p className="line-clamp-1">{l.name}</p>
                <p className="text-xs text-ink/50">Qty {l.quantity}{l.sizeLabel ? ` · ${l.sizeLabel}` : ''}</p>
              </div>
              <p className="text-sm">{formatMoney(l.price * l.quantity)}</p>
            </li>
          ))}
        </ul>

        <dl className="mt-6 space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink/60">Subtotal</dt>
            <dd>{quote ? formatMoney(quote.subtotal, quote.currency) : '—'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink/60">Shipping</dt>
            <dd>{quote ? (quote.shippingFee === 0 ? 'Free' : formatMoney(quote.shippingFee, quote.currency)) : '—'}</dd>
          </div>
          <div className="flex justify-between text-xs text-ink/45">
            <dt>Includes GST</dt>
            <dd>{quote ? formatMoney(quote.taxAmount, quote.currency) : '—'}</dd>
          </div>
          <div className="flex justify-between border-t border-ink/10 pt-3 text-base font-medium">
            <dt>Total</dt>
            <dd>{quote ? formatMoney(quote.total, quote.currency) : '—'}</dd>
          </div>
        </dl>

        {error && <p role="alert" className="mt-4 text-sm text-red-600">{error}</p>}

        <button type="submit" disabled={submitting || !quote} className="btn-primary mt-6 w-full">
          {submitting ? 'Redirecting to XPay…' : 'Pay securely with XPay'}
        </button>
        <p className="mt-4 text-center text-[11px] leading-relaxed text-ink/45">
          You will be redirected to XPay&rsquo;s secure page to complete payment. We never see or store your card details.
        </p>
      </aside>
    </form>
  );
}
