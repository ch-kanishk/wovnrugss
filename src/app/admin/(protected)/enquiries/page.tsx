import { prisma } from '@/lib/db';
import { formatDate } from '@/lib/utils';
import { deleteEnquiry, markEnquiryRead } from '@/app/admin/actions';
import { ConfirmSubmit } from '@/components/admin/ConfirmSubmit';

export const dynamic = 'force-dynamic';

export default async function AdminEnquiries() {
  const [enquiries, subscribers] = await Promise.all([
    prisma.enquiry.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }),
    prisma.subscriber.findMany({ orderBy: { createdAt: 'desc' }, take: 200 }),
  ]);

  return (
    <div className="space-y-8">
      <h1 className="font-display text-3xl">Enquiries</h1>

      <section className="space-y-4">
        {enquiries.length === 0 && (
          <p className="card px-6 py-16 text-center text-sm text-ink/50">No enquiries yet.</p>
        )}
        {enquiries.map((e) => (
          <article key={e.id} className={`card p-6 ${e.isRead ? '' : 'border-brand-300 bg-brand-50/40'}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium">
                  {e.name}
                  {!e.isRead && <span className="badge ml-2 bg-brand-200 text-brand-900">New</span>}
                </p>
                <p className="text-xs text-ink/55">
                  <a href={`mailto:${e.email}`} className="hover:text-brand-700">{e.email}</a>
                  {e.phone ? ` · ${e.phone}` : ''}
                  {e.subject ? ` · ${e.subject}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-ink/45">{formatDate(e.createdAt)}</span>
                {!e.isRead && (
                  <form action={markEnquiryRead}>
                    <input type="hidden" name="id" value={e.id} />
                    <button type="submit" className="text-brand-700 hover:underline">Mark read</button>
                  </form>
                )}
                <form action={deleteEnquiry}>
                  <input type="hidden" name="id" value={e.id} />
                  <ConfirmSubmit label="Delete" message="Delete this enquiry?" />
                </form>
              </div>
            </div>
            <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-ink/75">{e.message}</p>
          </article>
        ))}
      </section>

      <section className="card p-6">
        <h2 className="font-display text-xl">Newsletter subscribers</h2>
        <p className="mt-1 text-sm text-ink/55">{subscribers.length} on the list</p>
        {subscribers.length > 0 && (
          <ul className="mt-4 grid gap-1 text-xs text-ink/65 sm:grid-cols-3">
            {subscribers.map((s) => <li key={s.id}>{s.email}</li>)}
          </ul>
        )}
      </section>
    </div>
  );
}
