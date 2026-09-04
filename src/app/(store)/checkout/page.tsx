import type { Metadata } from 'next';
import { CheckoutForm } from '@/components/CheckoutForm';
import { buildMetadata } from '@/lib/seo';
import { store } from '@/lib/config';

export const metadata: Metadata = buildMetadata({
  title: 'Secure Checkout',
  description: 'Complete your Wovn Rugs order with secure payment via XPay.',
  path: '/checkout',
  noIndex: true,
});

export default function CheckoutPage() {
  return (
    <div className="container-page py-14">
      <h1 className="font-display text-4xl">Checkout</h1>
      <p className="mt-2 text-sm text-ink/60">
        Free shipping above ₹{(store.freeShippingAbove / 100).toLocaleString('en-IN')}. Payments secured by XPay.
      </p>
      <CheckoutForm />
    </div>
  );
}
