'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { CartLine, cartCount, cartSubtotal, readCart, writeCart } from '@/lib/cart';

interface CartContextValue {
  lines: CartLine[];
  count: number;
  subtotal: number;
  ready: boolean;
  add: (line: CartLine) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setLines(readCart());
    setReady(true);
    const sync = () => setLines(readCart());
    window.addEventListener('bonanzarugs:cart', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('bonanzarugs:cart', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const persist = useCallback((next: CartLine[]) => {
    setLines(next);
    writeCart(next);
  }, []);

  const add = useCallback(
    (line: CartLine) => {
      const current = readCart();
      const existing = current.find((l) => l.productId === line.productId);
      const next = existing
        ? current.map((l) =>
            l.productId === line.productId ? { ...l, quantity: l.quantity + line.quantity } : l
          )
        : [...current, line];
      persist(next);
    },
    [persist]
  );

  const setQuantity = useCallback(
    (productId: string, quantity: number) => {
      const next = readCart()
        .map((l) => (l.productId === productId ? { ...l, quantity } : l))
        .filter((l) => l.quantity > 0);
      persist(next);
    },
    [persist]
  );

  const remove = useCallback(
    (productId: string) => persist(readCart().filter((l) => l.productId !== productId)),
    [persist]
  );

  const clear = useCallback(() => persist([]), [persist]);

  const value = useMemo(
    () => ({ lines, count: cartCount(lines), subtotal: cartSubtotal(lines), ready, add, setQuantity, remove, clear }),
    [lines, ready, add, setQuantity, remove, clear]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}
