import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ContactForm } from '@/components/ContactForm';
import { buildMetadata } from '@/lib/seo';
import { site } from '@/lib/config';

export const metadata = buildMetadata({
  title: 'Contact Us',
  description:
    'Talk to the Wovn Rugs studio in Jaipur about custom sizes, trade pricing, shipping or an existing order.',
  path: '/contact',
});

export default async function ContactPage({
  searchParams,
}: { searchParams: Promise<{ topic?: string }> }) {
  const { topic } = await searchParams;

  return (
    <div className="container-page pb-20">
      <Breadcrumbs items={[{ name: 'Home', url: '/' }, { name: 'Contact', url: '/contact' }]} />

      <div className="grid gap-14 py-10 lg:grid-cols-2">
        <div>
          <h1 className="font-display text-5xl">Talk to the studio</h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-ink/65">
            Custom sizes, colour matching, trade enquiries or a question about an order — write to us and
            a real person in Jaipur will reply within two working days.
          </p>

          <dl className="mt-10 space-y-6 text-sm">
            <div>
              <dt className="label">Email</dt>
              <dd><a href={`mailto:${site.email}`} className="text-brand-700 underline underline-offset-4">{site.email}</a></dd>
            </div>
            <div>
              <dt className="label">Phone</dt>
              <dd>{site.phone}</dd>
            </div>
            <div>
              <dt className="label">Studio</dt>
              <dd className="leading-relaxed text-ink/70">
                {site.address.street}<br />
                {site.address.city}, {site.address.region} {site.address.postalCode}<br />
                India
              </dd>
            </div>
            <div>
              <dt className="label">Studio hours</dt>
              <dd className="text-ink/70">Monday–Saturday, 10:00–18:30 IST</dd>
            </div>
          </dl>
        </div>

        <ContactForm defaultTopic={topic} />
      </div>
    </div>
  );
}
