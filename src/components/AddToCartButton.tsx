'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCart } from './CartProvider';
import type { CartLine } from '@/lib/cart';

export function AddToCartButton({ line, stock }: { line: CartLine; stock: number }) {
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  if (stock <= 0) {
    return (
      <div className="space-y-3">
        <button type="button" disabled className="btn-primary w-full">Sold out</button>
        <Link href="/contact?topic=custom" className="btn-outline w-full">Enquire about a custom weave</Link>
      </div>
    );
  }

  function onAdd() {
    add({ ...line, quantity: qty });
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <label htmlFor="qty" className="label mb-0">Qty</label>
        <div className="flex items-center border border-ink/15">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="px-3 py-2 text-ink/60 hover:text-ink"
            aria-label="Decrease quantity"
          >−</button>
          <input
            id="qty"
            type="number"
            min={1}
            max={stock}
            value={qty}
            onChange={(e) => setQty(Math.min(stock, Math.max(1, Number(e.target.value) || 1)))}
            className="w-12 border-x border-ink/15 py-2 text-center text-sm outline-none"
          />
          <button
            type="button"
            onClick={() => setQty((q) => Math.min(stock, q + 1))}
            className="px-3 py-2 text-ink/60 hover:text-ink"
            aria-label="Increase quantity"
          >+</button>
        </div>
        <span className="text-xs text-ink/50">{stock} in stock</span>
      </div>

      <button type="button" onClick={onAdd} className="btn-primary w-full">
        {added ? 'Added to cart ✓' : 'Add to cart'}
      </button>
      <Link href="/cart" className="btn-outline w-full">View cart & checkout</Link>
    </div>
  );
}
