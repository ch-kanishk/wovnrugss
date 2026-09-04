import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/db';
import { formatDate } from '@/lib/utils';
import { deletePost, togglePostPublished } from '@/app/admin/actions';
import { ConfirmSubmit } from '@/components/admin/ConfirmSubmit';

export const dynamic = 'force-dynamic';

export default async function AdminBlog() {
  const posts = await prisma.post.findMany({ orderBy: { updatedAt: 'desc' } });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl">Blog</h1>
          <p className="mt-1 text-sm text-ink/55">{posts.length} article{posts.length === 1 ? '' : 's'}</p>
        </div>
        <Link href="/admin/blog/new" className="btn-primary px-5 py-2.5 text-xs">+ Write a post</Link>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-ink/10 text-left text-xs uppercase tracking-wider text-ink/50">
            <tr>
              <th className="px-4 py-3 font-medium">Article</th>
              <th className="px-4 py-3 font-medium">Tags</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Published</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/8">
            {posts.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-16 text-center text-ink/50">No posts yet — write your first one.</td></tr>
            )}
            {posts.map((post) => (
              <tr key={post.id} className="hover:bg-sand">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-16 shrink-0 overflow-hidden bg-sand">
                      {post.coverImage && <Image src={post.coverImage} alt="" fill sizes="64px" className="object-cover" />}
                    </div>
                    <div>
                      <Link href={`/admin/blog/${post.id}`} className="font-medium hover:text-brand-700">{post.title}</Link>
                      <p className="font-mono text-[11px] text-ink/40">/blog/{post.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-ink/55">{post.tags ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className={`badge ${post.isPublished ? 'bg-emerald-100 text-emerald-800' : 'bg-ink/10 text-ink/55'}`}>
                    {post.isPublished ? 'Published' : 'Draft'}
                  </span>
                </td>
                <td className="px-4 py-3 text-ink/55">{post.publishedAt ? formatDate(post.publishedAt) : '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-3 text-xs">
                    {post.isPublished && (
                      <Link href={`/blog/${post.slug}`} target="_blank" className="text-ink/50 hover:text-ink">View</Link>
                    )}
                    <Link href={`/admin/blog/${post.id}`} className="text-brand-700 hover:underline">Edit</Link>
                    <form action={togglePostPublished}>
                      <input type="hidden" name="id" value={post.id} />
                      <button type="submit" className="text-ink/50 hover:text-ink">
                        {post.isPublished ? 'Unpublish' : 'Publish'}
                      </button>
                    </form>
                    <form action={deletePost}>
                      <input type="hidden" name="id" value={post.id} />
                      <ConfirmSubmit label="Delete" message={`Delete “${post.title}” permanently?`} />
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
