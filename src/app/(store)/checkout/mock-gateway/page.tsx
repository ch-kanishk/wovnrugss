import Link from 'next/link';
import { formatMoney } from '@/lib/utils';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({ title: 'Test payment', path: '/checkout/mock-gateway', noIndex: true });

/**
 * Stand-in for XPay's hosted page, used only when XPAY_MODE=mock so the whole
 * checkout can be exercised locally without credentials.
 */
export default async function MockGatewayPage({
  searchParams,
}: { searchParams: Promise<{ order?: string; amount?: string }> }) {
  const { order = '', amount = '0' } = await searchParams;

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-16">
      <div className="w-full max-w-md border border-ink/15 p-8 text-center">
        <p className="eyebrow">XPay · Sandbox</p>
        <h1 className="mt-3 font-display text-3xl">Simulated payment page</h1>
        <p className="mt-4 text-sm text-ink/60">
          Your app is running with <code className="rounded bg-sand px-1.5 py-0.5">XPAY_MODE=mock</code>. Set real
          XPay credentials in <code className="rounded bg-sand px-1.5 py-0.5">.env</code> to use the live gateway.
        </p>

        <dl className="mt-8 space-y-2 border-y border-ink/10 py-6 text-sm">
          <div className="flex justify-between"><dt className="text-ink/55">Order</dt><dd>{order}</dd></div>
          <div className="flex justify-between"><dt className="text-ink/55">Amount</dt><dd>{formatMoney(Number(amount) || 0)}</dd></div>
        </dl>

        <div className="mt-8 space-y-3">
          <Link
            href={`/api/payments/xpay/callback?merchant_order_id=${encodeURIComponent(order)}&status=paid`}
            className="btn-primary w-full"
          >
            Simulate successful payment
          </Link>
          <Link href="/checkout?error=cancelled" className="btn-outline w-full">Cancel and go back</Link>
        </div>
      </div>
    </div>
  );
}
