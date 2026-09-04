'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { savePost, type ActionState } from '@/app/admin/actions';
import { renderMarkdown, slugify } from '@/lib/utils';

interface Props {
  post?: {
    id: string; title: string; slug: string; excerpt: string | null; content: string;
    coverImage: string | null; author: string; tags: string | null;
    metaTitle: string | null; metaDescription: string | null; isPublished: boolean;
  };
}

export function PostForm({ post }: Props) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(savePost, null);
  const [title, setTitle] = useState(post?.title ?? '');
  const [slug, setSlug] = useState(post?.slug ?? '');
  const [slugTouched, setSlugTouched] = useState(Boolean(post));
  const [content, setContent] = useState(post?.content ?? '');
  const [cover, setCover] = useState(post?.coverImage ?? '');
  const [preview, setPreview] = useState(false);
  const [uploading, setUploading] = useState(false);
  // See ProductForm: React clears uncontrolled fields once the action resolves.
  const kept = (field: string, fallback: string | null | undefined) =>
    state?.values?.[field] ?? (fallback ?? '');

  async function uploadCover(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (res.ok) setCover(data.url);
    } finally {
      setUploading(false);
    }
  }

  return (
    <form action={formAction} className="space-y-8">
      {post && <input type="hidden" name="id" value={post.id} />}
      <input type="hidden" name="coverImage" value={cover} />

      {state?.error && (
        <p role="alert" className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section className="card p-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="label">Title *</label>
                <input
                  id="title" name="title" required value={title}
                  onChange={(e) => { setTitle(e.target.value); if (!slugTouched) setSlug(slugify(e.target.value)); }}
                  className="input text-lg" placeholder="How to choose the right rug size for your living room"
                />
              </div>
              <div>
                <label htmlFor="slug" className="label">URL slug</label>
                <input
                  id="slug" name="slug" value={slug}
                  onChange={(e) => { setSlug(e.target.value); setSlugTouched(true); }}
                  className="input font-mono text-xs"
                />
                <p className="mt-1 text-[11px] text-ink/45">/blog/{slug || 'your-post'}</p>
              </div>
              <div>
                <label htmlFor="excerpt" className="label">Excerpt</label>
                <textarea id="excerpt" name="excerpt" rows={2} maxLength={400} defaultValue={kept('excerpt', post?.excerpt)} className="input"
                  placeholder="Shown on the blog index and used as the meta description fallback." />
              </div>
            </div>
          </section>

          <section className="card p-6">
            <div className="mb-3 flex items-center justify-between">
              <label htmlFor="content" className="label mb-0">Content *</label>
              <button type="button" onClick={() => setPreview((v) => !v)} className="text-xs text-brand-700 underline underline-offset-4">
                {preview ? 'Edit' : 'Preview'}
              </button>
            </div>
            {preview ? (
              <div className="min-h-[400px] border border-ink/10 p-5" dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />
            ) : (
              <textarea
                id="content" name="content" required rows={22} value={content}
                onChange={(e) => setContent(e.target.value)}
                className="input font-mono text-[13px] leading-relaxed"
                placeholder={'## A heading\n\nA paragraph with **bold** and *italic* text.\n\n- A bullet\n- Another bullet\n\n[A link](https://example.com)'}
              />
            )}
            <p className="mt-2 text-[11px] text-ink/45">
              Supports headings (##, ###), **bold**, *italic*, - bullet lists and [links](url).
            </p>
          </section>

          <section className="card p-6">
            <h2 className="mb-1 font-display text-lg">SEO</h2>
            <p className="mb-4 text-xs text-ink/50">Falls back to the title and excerpt if left blank.</p>
            <div className="space-y-4">
              <div>
                <label htmlFor="metaTitle" className="label">Meta title</label>
                <input id="metaTitle" name="metaTitle" maxLength={70} defaultValue={kept('metaTitle', post?.metaTitle)} className="input" />
              </div>
              <div>
                <label htmlFor="metaDescription" className="label">Meta description</label>
                <textarea id="metaDescription" name="metaDescription" rows={3} maxLength={180} defaultValue={kept('metaDescription', post?.metaDescription)} className="input" />
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-6 lg:sticky lg:top-8 lg:h-fit">
          <section className="card p-6">
            <h2 className="mb-4 font-display text-lg">Publish</h2>
            <label className="flex items-center gap-2.5 text-sm">
              <input type="checkbox" name="isPublished" defaultChecked={state?.values ? state.values.isPublished === 'on' : (post?.isPublished ?? false)} className="accent-brand-700" />
              Published (live on the site)
            </label>
            <div className="mt-4">
              <label htmlFor="author" className="label">Author</label>
              <input id="author" name="author" defaultValue={kept('author', post?.author ?? 'Wovn Rugs')} className="input" />
            </div>
            <div className="mt-4">
              <label htmlFor="tags" className="label">Tags (comma separated)</label>
              <input id="tags" name="tags" defaultValue={kept('tags', post?.tags)} className="input" placeholder="rug care, styling" />
            </div>
          </section>

          <section className="card p-6">
            <h2 className="mb-4 font-display text-lg">Cover image</h2>
            {cover && (
              <div className="relative mb-3 aspect-[16/10] overflow-hidden border border-ink/10 bg-sand">
                <Image src={cover} alt="" fill sizes="320px" className="object-cover" />
              </div>
            )}
            <input
              type="file" accept="image/jpeg,image/png,image/webp,image/avif"
              onChange={(e) => uploadCover(e.target.files?.[0])} disabled={uploading}
              className="block w-full text-xs file:mr-3 file:border file:border-ink/15 file:bg-white file:px-3 file:py-1.5 file:text-xs"
            />
            <input value={cover} onChange={(e) => setCover(e.target.value)} placeholder="…or paste a URL" className="input mt-2 text-xs" />
            {cover && (
              <button type="button" onClick={() => setCover('')} className="mt-2 text-xs text-red-600 hover:underline">
                Remove cover
              </button>
            )}
          </section>

          <div className="flex gap-2">
            <button type="submit" disabled={pending} className="btn-primary flex-1 py-2.5 text-xs">
              {pending ? 'Saving…' : post ? 'Save changes' : 'Create post'}
            </button>
            <Link href="/admin/blog" className="btn-outline px-4 py-2.5 text-xs">Cancel</Link>
          </div>
        </div>
      </div>
    </form>
  );
}
