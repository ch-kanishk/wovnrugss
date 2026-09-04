import { NextResponse } from 'next/server';
import { priceCart } from '@/lib/pricing';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const priced = await priceCart(body.items ?? []);
    return NextResponse.json({
      subtotal: priced.subtotal,
      shippingFee: priced.shippingFee,
      taxAmount: priced.taxAmount,
      total: priced.total,
      currency: priced.currency,
      lines: priced.lines,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Could not price cart.' },
      { status: 400 }
    );
  }
}
