import Image from 'next/image';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { buildMetadata } from '@/lib/seo';
import { site } from '@/lib/config';

export const metadata = buildMetadata({
  title: 'Our Story — Rug Weaving in Jaipur',
  description:
    'Bonanza Rugs works with 200+ weaving families across Rajasthan to make hand-knotted wool and silk carpets. Read about our looms, our dyes and our fair-wage commitment.',
  path: '/about',
});

export default function AboutPage() {
  return (
    <div className="container-page pb-20">
      <Breadcrumbs items={[{ name: 'Home', url: '/' }, { name: 'About', url: '/about' }]} />

      <header className="mx-auto max-w-3xl py-10 text-center">
        <p className="eyebrow">Since 1998</p>
        <h1 className="mt-4 font-display text-5xl leading-tight">A loom, a family, a floor that lasts</h1>
        <p className="mt-6 text-base leading-relaxed text-ink/65">
          {site.name} began in a two-loom shed in Sitapura, Jaipur. Today we work with more than 200
          weaving families across Rajasthan and Uttar Pradesh, making rugs the way they have been made
          in this region for four centuries — slowly, by hand, and to be kept.
        </p>
      </header>

      <div className="relative aspect-[21/9] w-full overflow-hidden bg-sand">
        <Image
          src="https://images.unsplash.com/photo-1584285405429-136bf988919c?w=2000&q=80"
          alt="Wool yarn skeins drying in the sun outside a Jaipur weaving workshop"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </div>

      <div className="mx-auto mt-16 grid max-w-4xl gap-14 sm:grid-cols-3">
        {[
          ['200+', 'Weaving families we buy from directly, with no middlemen'],
          ['40+', 'Countries we have shipped a finished rug to'],
          ['9 months', 'Average time to complete an 8×10 hand-knotted carpet'],
        ].map(([stat, label]) => (
          <div key={stat} className="text-center">
            <p className="font-display text-4xl text-brand-700">{stat}</p>
            <p className="mt-2 text-sm leading-relaxed text-ink/60">{label}</p>
          </div>
        ))}
      </div>

      <section className="mx-auto mt-20 max-w-3xl space-y-8 text-[15px] leading-relaxed text-ink/75">
        <div>
          <h2 className="mb-3 font-display text-2xl text-ink">How we work</h2>
          <p>
            Every design starts as a hand-painted graph — a grid where each square is one knot. A master
            weaver reads that graph aloud in a sing-song code called <em>talim</em>, and the family at the
            loom ties the wool accordingly. Nothing about this can be rushed. A finely knotted 8×10 rug at
            300 knots per square inch contains close to three and a half million knots.
          </p>
        </div>
        <div>
          <h2 className="mb-3 font-display text-2xl text-ink">Our materials</h2>
          <p>
            We use hand-carded Bikaneri wool for its lanolin content and spring, Chinese and Bengal silk
            for highlights, and viscose only where a client asks for it by name. Dyeing is done in small
            batches with a mix of natural and low-impact synthetic dyes, then sun-cured on the roof.
          </p>
        </div>
        <div>
          <h2 className="mb-3 font-display text-2xl text-ink">Fair looms</h2>
          <p>
            We buy directly from the families who weave for us, pay per-knot rates agreed in advance, and
            keep looms in the villages people already live in rather than moving workers to a factory
            floor. No child labour is used at any stage — our looms are open to inspection.
          </p>
        </div>
      </section>

      <div className="mt-16 text-center">
        <Link href="/rugs" className="btn-primary">Shop the collection</Link>
      </div>
    </div>
  );
}
