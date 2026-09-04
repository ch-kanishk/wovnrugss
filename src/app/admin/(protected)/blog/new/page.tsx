import Link from 'next/link';
import { PostForm } from '@/components/admin/PostForm';

export default function NewPostPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/blog" className="text-xs text-ink/50 hover:text-ink">← Blog</Link>
        <h1 className="mt-2 font-display text-3xl">Write a post</h1>
      </div>
      <PostForm />
    </div>
  );
}
