import { prisma } from './db';
import { store } from './config';

export interface RequestedLine { productId: string; quantity: number }

export interface PricedLine {
  productId: string;
  name: string;
  sku: string;
  sizeLabel: string | null;
  image: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface PricedCart {
  lines: PricedLine[];
  subtotal: number;
  shippingFee: number;
  taxAmount: number;
  total: number;
  currency: string;
}

/**
 * Re-prices a cart from the database. The client's prices are never trusted —
 * this is the only place an order total is computed.
 */
export async function priceCart(requested: RequestedLine[]): Promise<PricedCart> {
  const clean = requested
    .filter((l) => l && typeof l.productId === 'string' && Number.isFinite(l.quantity))
    .map((l) => ({ productId: l.productId, quantity: Math.max(1, Math.min(99, Math.floor(l.quantity))) }));

  if (!clean.length) throw new Error('Your cart is empty.');

  const products = await prisma.product.findMany({
    where: { id: { in: clean.map((l) => l.productId) }, isActive: true },
    include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 } },
  });

  const lines: PricedLine[] = [];
  for (const item of clean) {
    const product = products.find((p) => p.id === item.productId);
    if (!product) throw new Error('One of the rugs in your cart is no longer available.');
    if (product.stock < item.quantity) {
      throw new Error(`Only ${product.stock} left of “${product.name}”. Please adjust the quantity.`);
    }
    lines.push({
      productId: product.id,
      name: product.name,
      sku: product.sku,
      sizeLabel: product.sizeLabel,
      image: product.images[0]?.url ?? null,
      unitPrice: product.price,
      quantity: item.quantity,
      lineTotal: product.price * item.quantity,
    });
  }

  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  const shippingFee = subtotal >= store.freeShippingAbove ? 0 : store.flatShippingFee;
  // Catalogue prices are GST-inclusive, so tax is shown as the extracted component.
  const taxAmount = Math.round(subtotal - subtotal / (1 + store.gstPercent / 100));
  const total = subtotal + shippingFee;

  return { lines, subtotal, shippingFee, taxAmount, total, currency: store.currency };
}
