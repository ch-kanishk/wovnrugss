# Wovn Rugs — handmade-rug e-commerce store

A production-shaped storefront and admin for a Jaipur rug business, in the mould of
jaipurrugs.com: SEO-first catalogue pages, a merchant admin for listings/orders/blog,
and checkout through the **XPay** gateway.

**Stack:** Next.js 15 (App Router, RSC) · TypeScript · Tailwind CSS · Prisma · PostgreSQL

---

## Quick start

```bash
npm install
cp .env.example .env          # then edit — see Configuration
npm run setup                 # applies migrations, seeds 12 rugs, 4 collections, 4 articles
npm run dev                   # http://localhost:3000
```

You need a PostgreSQL database. For local development, either point `DATABASE_URL`
at a local server or run one in Docker:

```bash
docker run -d --name wovn-pg -e POSTGRES_PASSWORD=devpass -e POSTGRES_USER=wovn \
  -e POSTGRES_DB=wovnrugs -p 55432:5432 postgres:16-alpine
# DATABASE_URL="postgresql://wovn:devpass@localhost:55432/wovnrugs"
# DIRECT_URL="postgresql://wovn:devpass@localhost:55432/wovnrugs"
```

Admin: **http://localhost:3000/admin** — sign in with `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env`.

Out of the box `XPAY_MODE=mock`, so you can place a full test order without any gateway
credentials — checkout redirects to a local stand-in for XPay's hosted page.

---

## Configuration

| Variable | What it does |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical origin. Used for canonicals, OG tags, sitemap and the XPay return/webhook URLs. **Must match the origin you actually serve from.** |
| `DATABASE_URL` | Pooled PostgreSQL connection used by the app. |
| `DIRECT_URL` | Unpooled connection, used only by migrations (a transaction pooler cannot run them). Without a pooler, set it the same as `DATABASE_URL`. |
| `BLOB_READ_WRITE_TOKEN` | Set automatically by a Vercel Blob store. When absent locally, uploads fall back to `public/uploads`. |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | The single admin credential. |
| `AUTH_SECRET` | HMAC key for the admin session cookie. Use 32+ random characters. |
| `XPAY_MODE` | `mock` (no credentials needed), `test`, or `live`. |
| `XPAY_BASE_URL`, `XPAY_MERCHANT_ID`, `XPAY_API_KEY`, `XPAY_SALT`, `XPAY_WEBHOOK_SECRET` | From your XPay merchant dashboard. |
| `FREE_SHIPPING_ABOVE`, `FLAT_SHIPPING_FEE`, `GST_PERCENT` | Store rules, in rupees / percent. |

Money is stored as **integer paise** everywhere. Only `formatMoney()` converts for display.

---

## Payments (XPay)

All gateway code lives in [`src/lib/xpay.ts`](src/lib/xpay.ts). The flow:

1. `POST /api/checkout` re-prices the cart **from the database** (client prices are never trusted),
   writes a `PENDING` order, then calls XPay to create a payment order.
2. The shopper is redirected to XPay's hosted page.
3. XPay returns them to `/api/payments/xpay/callback`. That route does **not** trust the
   browser — it re-queries XPay server-to-server before marking anything paid.
4. XPay also calls `/api/payments/xpay/webhook`, the authoritative signal. Its HMAC-SHA256
   signature is verified against the raw body before any write.

`markOrderPaid()` is idempotent, so the callback and webhook racing each other cannot
decrement stock twice.

**If your XPay account uses different field names,** only `buildOrderPayload()` and
`parseGatewayEvent()` need editing — nothing else touches the gateway.

Point your XPay dashboard webhook at `https://your-domain.com/api/payments/xpay/webhook`.

---

## Brand assets

The master artwork lives at [`assets/logo-source.png`](assets/logo-source.png). Everything
under `public/brand/` is generated from it by `npm run brand`, which traces the PNG to SVG
so the logo stays sharp at any size:

| Asset | Used for |
| --- | --- |
| `brand/lockup-h.svg` (+`-light`) | Site header — the mark and wordmark recomposed side by side, because the stacked wordmark is illegible at header height |
| `brand/lockup.svg` (+`-light`) | Admin sign-in, and anywhere with vertical room |
| `brand/logo.svg` | Footer — full lockup including the tagline |
| `brand/mark.svg` (+`-light`) | Admin bar and other tight spaces |
| `favicon.svg`, `apple-touch-icon.png` | Browser tab and iOS home screen (white mark on brand dark, so it reads on any tab colour) |
| `og-default.png` | Social share card — 1200x630 raster, because Facebook/X/LinkedIn do not render SVG |

Swap `assets/logo-source.png` and re-run `npm run brand` to rebrand the whole site.
The `-light` variants are white artwork for dark backgrounds.

Render the logo through the `<Logo>` component rather than referencing files directly:

```tsx
<Logo variant="lockup-h" height={40} />        // header
<Logo variant="full" height={104} />           // footer
<Logo variant="mark" height={30} tone="light" />  // on a dark background
```

---

## SEO

- Per-page `generateMetadata` with canonical, OpenGraph and Twitter tags
- JSON-LD: `Organization`, `WebSite` + Sitemap search, `Product` (price, availability,
  material, dimensions), `BreadcrumbList`, `BlogPosting`, `Blog`, `CollectionPage`, `FAQPage`
- `/sitemap.xml` generated from the database, `/robots.txt`, `/feed.xml` (RSS)
- Products, collections and posts are statically generated and revalidated (ISR); editing
  in the admin revalidates the affected paths immediately
- Filtered listings and search results are `noindex` to keep near-duplicate facets out of
  the crawl budget; cart/checkout/order/admin are disallowed in robots.txt
- Semantic headings, real `<nav>`/`<address>`/`<dl>` landmarks, labelled inputs, skip link,
  `next/image` with AVIF/WebP and explicit `sizes`

Meta title/description are editable per product, collection and post; sensible values are
generated when left blank.

---

## Admin

`/admin`, gated by an HMAC-signed cookie.

- **Dashboard** — 30-day revenue and orders, fulfilment queue, low-stock/draft/enquiry alerts
- **Products** — search, low-stock filter, show/hide, delete; a full editor with drag-order
  images (file upload or URL), rug attributes that drive the shop filters *and* the Product
  schema, and per-product SEO fields
- **Orders** — filter by status, full order detail, status/carrier/tracking updates, raw
  gateway response for debugging
- **Blog** — markdown editor with live preview, cover upload, tags, publish/unpublish
- **Collections** and **Enquiries** (contact-form messages and newsletter subscribers)

Uploads are written to `public/uploads`. On a serverless host, replace the body of
`src/app/api/admin/upload/route.ts` with an S3/Cloudinary put — the client only needs `{ url }`.

### Security notes

- The admin session cookie is verified **in middleware** (`src/lib/session-edge.ts`, Web Crypto)
  before any admin route renders. A layout-only check is not sufficient: React begins
  streaming before a layout's `redirect()` resolves, so unauthenticated requests would
  still receive rendered admin HTML.
- Order totals are always recomputed server-side from the database.
- Uploads are restricted by MIME type and size, and stored under a random filename.
- The contact form has a honeypot field.

Single-admin by design. For staff accounts with roles, swap `src/lib/auth.ts` for NextAuth
or Clerk — `requireSession()` is the only thing the actions call.

---

## Deploying to Vercel

**1. Push the repo to GitHub**, then import it at [vercel.com/new](https://vercel.com/new).
Framework preset is detected as Next.js; no build overrides are needed — `npm run build`
already runs `prisma generate && prisma migrate deploy && next build`, so schema changes
apply on every deploy.

**2. Create the database.** In the Vercel project: **Storage → Create → Postgres** (Neon).
That sets `DATABASE_URL` and is enough to deploy — the build defaults `DIRECT_URL` to
`DATABASE_URL` when it is absent.

If your provider gives you a *pooled* connection string (PgBouncer, Neon's `-pooler` host),
also set `DIRECT_URL` to the **unpooled / direct** string. Migrations cannot run through a
transaction pooler, and without it `prisma migrate deploy` will fail on the pooled URL.

**3. Create the image store.** **Storage → Create → Blob**. This sets
`BLOB_READ_WRITE_TOKEN`, which is what routes admin uploads to Blob instead of the
filesystem. Skip it and file uploads return a clear 501 — pasting image URLs still works.

**4. Set the remaining environment variables** (Settings → Environment Variables), for
Production *and* Preview:

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `https://your-domain.com` — no trailing slash |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | your real admin credentials |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `XPAY_MODE` | `live` (or `test` while integrating) |
| `XPAY_BASE_URL`, `XPAY_MERCHANT_ID`, `XPAY_API_KEY`, `XPAY_SALT`, `XPAY_WEBHOOK_SECRET` | from the XPay dashboard |
| `STORE_CURRENCY`, `FREE_SHIPPING_ABOVE`, `FLAT_SHIPPING_FEE`, `GST_PERCENT` | store rules |

`NEXT_PUBLIC_SITE_URL` is baked in at build time and is used for canonicals, OG tags, the
sitemap **and the XPay return/webhook URLs** — if it is wrong, payments come back to the
wrong origin. Change it and redeploy, do not just edit and restart.

**5. Deploy.** The first deploy runs the migration and creates empty tables. To load the
demo catalogue (optional), run the seed locally against the production database:

```bash
DATABASE_URL="<production DIRECT_URL>" npm run db:seed   # deletes existing products/orders/posts
```

**6. Point XPay at the webhook:** `https://your-domain.com/api/payments/xpay/webhook`.

**7. Add your domain** (Settings → Domains) and update `NEXT_PUBLIC_SITE_URL` to match,
then redeploy.

### Vercel-specific notes

- `regions` is set to `bom1` (Mumbai) in `vercel.json` — closest to an India-based store
  and its database. Change it if your customers or database live elsewhere.
- The admin gate runs in Middleware (Edge), so it uses Web Crypto rather than `node:crypto`.
- Payment routes get a 30s `maxDuration`; the upload route 60s.
- Serverless filesystems are read-only apart from `/tmp`, and `/tmp` does not persist
  between invocations — hence Blob for uploads.

Not included, and worth adding next: transactional order emails (the order and enquiry
write points are the hooks), a real search index if the catalogue grows past a few thousand
SKUs, and multi-currency.

---

## Scripts

| Command | |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production build and serve |
| `npm run setup` | Apply migrations + seed |
| `npm run db:migrate` | Create a migration after editing the schema |
| `npm run db:deploy` | Apply pending migrations (what CI/Vercel runs) |
| `npm run db:seed` | Reseed demo catalogue (**deletes existing products, orders and posts**) |
| `npm run db:studio` | Prisma Studio |
