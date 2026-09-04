import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { buildMetadata } from '@/lib/seo';
import { renderMarkdown } from '@/lib/utils';
import { site } from '@/lib/config';

export const revalidate = 3600;

const POLICIES: Record<string, { title: string; description: string; body: string }> = {
  shipping: {
    title: 'Shipping & Delivery',
    description: 'How and when Wovn Rugs ships within India and worldwide, including timelines, duties and tracking.',
    body: `## Dispatch times
Rugs in stock are inspected, rolled and dispatched from our Jaipur studio within **3–5 working days**. Custom and made-to-order rugs are quoted individually — typically 8 to 20 weeks depending on knot density and size.

## Within India
- Free shipping on all orders above ₹15,000.
- A flat ₹499 applies below that.
- Delivery is 4–8 working days by tracked surface courier.

## International
- We ship to over 40 countries via DHL and FedEx, fully tracked and insured.
- Rates are quoted at checkout based on volumetric weight and destination.
- Import duties and taxes are payable by the recipient and are not included in our prices.

## Tracking
You receive a tracking number by email the moment the rug leaves our studio. Large rugs ship rolled in a waterproof sleeve; runners and small sizes ship folded in a fabric bag.`,
  },
  returns: {
    title: 'Returns & Refunds',
    description: 'Wovn Rugs 30-day room trial, return conditions, and how refunds are processed through XPay.',
    body: `## 30-day room trial
Live with your rug for 30 days. If the colour is not right in your light, tell us within 30 days of delivery and we will arrange a return.

## Conditions
- The rug must be in original, unwashed, unaltered condition.
- Original packaging or an equivalent protective wrap is required.
- Custom-woven and made-to-order rugs are non-returnable, as they are made to your specification.

## How to start a return
Email us at ${site.email} with your order number and a photo of the rug in place. We will send a pickup label within two working days.

## Refunds
Refunds are issued to the original payment method through XPay within 7–10 working days of the rug reaching our studio and passing inspection. Return shipping within India is on us; international return shipping is at the customer's cost unless the rug arrived damaged or incorrect.

## Damaged or wrong item
Photograph the rug and packaging within 48 hours of delivery and send it to us. We will replace or refund in full, including all shipping.`,
  },
  privacy: {
    title: 'Privacy Policy',
    description: 'What personal data Wovn Rugs collects, why we collect it, and how it is stored and shared.',
    body: `## What we collect
- **Order data:** name, email, phone, shipping address and order contents.
- **Payment data:** handled entirely by XPay, our payment processor. We store only a transaction reference — never your card number, CVV or bank credentials.
- **Marketing data:** your email address, if you choose to subscribe.
- **Analytics:** anonymised page-visit data used to improve the site.

## Why we collect it
To fulfil and deliver orders, to answer your enquiries, to process refunds, and — only with your consent — to send occasional emails about new collections.

## Who we share it with
Our courier partners (to deliver your rug) and XPay (to process payment). We do not sell, rent or trade personal data to anyone.

## How long we keep it
Order records are retained for seven years to meet Indian tax and accounting requirements. Newsletter subscriptions are kept until you unsubscribe.

## Your rights
Write to ${site.email} to request a copy of your data, correct it, or ask us to delete it.

## Cookies
We use strictly necessary cookies for your cart and admin session, plus optional analytics cookies. You can clear these at any time in your browser settings.`,
  },
  terms: {
    title: 'Terms of Service',
    description: 'The terms under which Wovn Rugs sells and ships handmade rugs.',
    body: `## Ordering
Placing an order is an offer to buy. The contract forms when we confirm dispatch. We may decline an order if a rug has sold out or if pricing was displayed in error.

## Pricing
All prices are in Indian Rupees and inclusive of GST unless stated otherwise. International customers are responsible for their own import duties.

## Handmade variation
Every rug is made by hand. Slight variation in size (up to 2%), colour tone and pile direction is inherent to the craft and is not a defect. Screen rendering of colour also varies — ask us for a physical yarn sample if the exact tone matters.

## Payment
Payments are processed by XPay. By completing checkout you agree to XPay's terms in addition to ours.

## Intellectual property
All designs, photographs and text on this site belong to ${site.name} and may not be reproduced without written permission.

## Governing law
These terms are governed by the laws of India, with exclusive jurisdiction in the courts of Jaipur, Rajasthan.`,
  },
};

export function generateStaticParams() {
  return Object.keys(POLICIES).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const policy = POLICIES[slug];
  if (!policy) return buildMetadata({ title: 'Not found', noIndex: true });
  return buildMetadata({ title: policy.title, description: policy.description, path: `/policies/${slug}` });
}

export default async function PolicyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const policy = POLICIES[slug];
  if (!policy) notFound();

  return (
    <div className="container-page pb-20">
      <Breadcrumbs
        items={[{ name: 'Home', url: '/' }, { name: policy.title, url: `/policies/${slug}` }]}
      />
      <div className="mx-auto max-w-3xl py-8">
        <h1 className="font-display text-4xl">{policy.title}</h1>
        <div className="mt-8 text-[15px]" dangerouslySetInnerHTML={{ __html: renderMarkdown(policy.body) }} />
      </div>
    </div>
  );
}
