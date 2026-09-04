import type { Metadata } from 'next';
import { CartView } from '@/components/CartView';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Your Cart',
  description: 'Review the rugs in your Wovn Rugs cart and proceed to secure checkout.',
  path: '/cart',
  noIndex: true,
});

export default function CartPage() {
  return (
    <div className="container-page py-14">
      <h1 className="font-display text-4xl">Your cart</h1>
      <CartView />
    </div>
  );
}
