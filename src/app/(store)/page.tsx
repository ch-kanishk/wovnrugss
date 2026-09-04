import Image from 'next/image';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { ProductGrid } from '@/components/ProductGrid';
import { PRODUCT_CARD_SELECT } from '@/lib/queries';
import { JsonLd } from '@/components/JsonLd';
import { faqJsonLd } from '@/lib/seo';
import { formatDate } from '@/lib/utils';

export const revalidate = 300;

const HOME_FAQS = [
  { q: 'What is the difference between hand-knotted and hand-tufted rugs?',
    a: 'A hand-knotted rug is woven knot by knot on a loom and can take six to twelve months to complete, giving it a lifespan of several decades. A hand-tufted rug is punched into a canvas backing with a tufting tool, which is faster to make and more affordable while still handcrafted.' },
  { q: 'Do you ship Wovn Rugs worldwide?',
    a: 'Yes. We ship from Jaipur to over 40 countries with tracked, insured courier partners. Shipping within India is free on orders above ₹15,000.' },
  { q: 'Can I order a custom size or colour?',
    a: 'Every design in our catalogue can be woven to a custom size, colour palette or shape. Share your requirement through our contact form and our studio will respond within two working days with a quote and timeline.' },
  { q: 'How do I care for a wool rug?',
    a: 'Vacuum weekly without a beater bar, rotate the rug every six months for even wear, blot spills immediately with a dry cloth, and have it professionally cleaned every two to three years.' },
];

const CRAFT_STEPS = [
  { n: '01', title: 'Design', body: 'Every rug begins as a hand-painted graph in our Jaipur studio, colour-matched against natural dye swatches.' },
  { n: '02', title: 'Dye', body: 'Wool from Bikaner and silk from Bengal are dyed in small batches, then sun-dried on the roof for depth of tone.' },
  { n: '03', title: 'Weave', body: 'Master weavers tie 120–400 knots per square inch on vertical looms — a 8×10 can take nine months.' },
  { n: '04', title: 'Finish', body: 'The rug is washed, hand-clipped, carved and stretched flat before a final quality inspection.' },
];

export default async function HomePage() {
  const [featured, newest, categories, posts] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true, isFeatured: true },
      select: PRODUCT_CARD_SELECT,
      take: 8,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.product.findMany({
      where: { isActive: true },
      select: PRODUCT_CARD_SELECT,
      take: 4,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.category.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' }, take: 4 }),
    prisma.post.findMany({ where: { isPublished: true }, orderBy: { publishedAt: 'desc' }, take: 3 }),
  ]);

  const heroProducts = featured.length ? featured : newest;

  return (
    <>
      <JsonLd data={faqJsonLd(HOME_FAQS)} />

      {/* Hero */}
      <section className="relative">
        <div className="relative h-[68vh] min-h-[460px] w-full overflow-hidden bg-sand">
          <Image
            src="https://images.unsplash.com/photo-1600166898405-da9535204843?w=2000&q=80"
            alt="A hand-knotted wool rug layered under a mid-century armchair in a sunlit room"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/25 to-transparent" />
          <div className="container-page relative flex h-full items-center">
            <div className="max-w-xl text-white">
              <p className="eyebrow text-brand-200">Woven in Jaipur since 1998</p>
              <h1 className="mt-4 font-display text-5xl leading-[1.05] sm:text-6xl">
                Rugs made one knot at a time
              </h1>
              <p className="mt-5 max-w-md text-base leading-relaxed text-white/85">
                Hand-knotted wool and silk carpets from the looms of Rajasthan — designed in-house,
                woven by artisan families, shipped worldwide.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/rugs" className="btn bg-white text-ink hover:bg-brand-100">Shop all rugs</Link>
                <Link href="/about" className="btn border border-white/60 text-white hover:bg-white hover:text-ink">
                  Our craft
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* USP strip */}
      <section aria-label="Why shop with us" className="border-b border-ink/10 bg-sand">
        <div className="container-page grid grid-cols-2 gap-6 py-8 text-center lg:grid-cols-4">
          {[
            ['Handmade', 'Every piece woven by hand, never machine-made'],
            ['Free India shipping', 'On all orders above ₹15,000'],
            ['30-day returns', 'Room-tested, or send it back'],
            ['Custom weaves', 'Any size, colour or shape'],
          ].map(([title, body]) => (
            <div key={title}>
              <p className="text-sm font-medium uppercase tracking-[0.12em] text-ink">{title}</p>
              <p className="mt-1 text-xs text-ink/55">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Collections */}
      {categories.length > 0 && (
        <section className="container-page py-20">
          <header className="mb-10 text-center">
            <p className="eyebrow">Shop by technique</p>
            <h2 className="mt-3 font-display text-4xl">Our collections</h2>
          </header>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((cat) => (
              <Link key={cat.id} href={`/collections/${cat.slug}`} className="group relative block aspect-[3/4] overflow-hidden bg-sand">
                {cat.heroImage && (
                  <Image
                    src={cat.heroImage}
                    alt={cat.name}
                    fill
                    sizes="(max-width: 640px) 100vw, 25vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                  <h3 className="font-display text-2xl">{cat.name}</h3>
                  <p className="mt-1 text-xs uppercase tracking-[0.16em] text-white/75">Explore →</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured products */}
      {heroProducts.length > 0 && (
        <section className="container-page pb-20">
          <header className="mb-10 flex items-end justify-between">
            <div>
              <p className="eyebrow">Curated this season</p>
              <h2 className="mt-3 font-display text-4xl">Pieces we love</h2>
            </div>
            <Link href="/rugs" className="hidden text-sm uppercase tracking-[0.12em] text-brand-700 underline underline-offset-8 sm:block">
              View all
            </Link>
          </header>
          <ProductGrid products={heroProducts} />
        </section>
      )}

      {/* Craft story */}
      <section className="bg-ink py-24 text-white">
        <div className="container-page grid gap-14 lg:grid-cols-2 lg:items-center">
          <div className="relative aspect-[4/3] overflow-hidden">
            <Image
              src="https://images.unsplash.com/photo-1615873968403-89e068629265?w=1400&q=80"
              alt="A weaver tying knots on a vertical loom in a Jaipur workshop"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
          <div>
            <p className="eyebrow text-brand-300">The making of a Wovn rug</p>
            <h2 className="mt-4 font-display text-4xl leading-tight">Four hands, nine months, one carpet</h2>
            <div className="mt-10 grid gap-8 sm:grid-cols-2">
              {CRAFT_STEPS.map((step) => (
                <div key={step.n}>
                  <p className="font-display text-3xl text-brand-400">{step.n}</p>
                  <h3 className="mt-2 text-sm font-medium uppercase tracking-[0.14em]">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/65">{step.body}</p>
                </div>
              ))}
            </div>
            <Link href="/about" className="btn mt-10 border border-white/50 text-white hover:bg-white hover:text-ink">
              Read our story
            </Link>
          </div>
        </div>
      </section>

      {/* Journal */}
      {posts.length > 0 && (
        <section className="container-page py-20">
          <header className="mb-10 text-center">
            <p className="eyebrow">The journal</p>
            <h2 className="mt-3 font-display text-4xl">Styling notes & care guides</h2>
          </header>
          <div className="grid gap-8 md:grid-cols-3">
            {posts.map((post) => (
              <article key={post.id}>
                <Link href={`/blog/${post.slug}`} className="group block">
                  <div className="relative aspect-[16/10] overflow-hidden bg-sand">
                    {post.coverImage && (
                      <Image
                        src={post.coverImage}
                        alt={post.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    )}
                  </div>
                  <p className="mt-4 text-[11px] uppercase tracking-[0.16em] text-ink/45">
                    {post.publishedAt ? formatDate(post.publishedAt) : ''}
                  </p>
                  <h3 className="mt-2 font-display text-xl leading-snug transition-colors group-hover:text-brand-700">
                    {post.title}
                  </h3>
                  {post.excerpt && <p className="mt-2 line-clamp-2 text-sm text-ink/60">{post.excerpt}</p>}
                </Link>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* FAQ — mirrors the FAQPage JSON-LD above for rich results */}
      <section className="border-t border-ink/10 bg-sand py-20">
        <div className="container-page max-w-3xl">
          <h2 className="mb-10 text-center font-display text-4xl">Frequently asked</h2>
          <dl className="divide-y divide-ink/10">
            {HOME_FAQS.map((faq) => (
              <div key={faq.q} className="py-6">
                <dt className="font-display text-lg text-ink">{faq.q}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-ink/65">{faq.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </>
  );
}
