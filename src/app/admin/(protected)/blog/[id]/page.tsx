import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { PostForm } from '@/components/admin/PostForm';

export const dynamic = 'force-dynamic';

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/blog" className="text-xs text-ink/50 hover:text-ink">← Blog</Link>
          <h1 className="mt-2 font-display text-3xl">{post.title}</h1>
        </div>
        {post.isPublished && (
          <Link href={`/blog/${post.slug}`} target="_blank" className="btn-outline px-4 py-2 text-xs">View ↗</Link>
        )}
      </div>
      <PostForm post={post} />
    </div>
  );
}
