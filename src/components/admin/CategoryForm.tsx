'use client';

import { useActionState } from 'react';
import { saveCategory, type ActionState } from '@/app/admin/actions';

export function CategoryForm() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(saveCategory, null);
  // See ProductForm: restore typed values after a failed submit.
  const kept = (field: string, fallback = '') => state?.values?.[field] ?? fallback;

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="cat-name" className="label">Name *</label>
        <input id="cat-name" name="name" required className="input" placeholder="Hand-Knotted" defaultValue={kept('name')} />
      </div>
      <div>
        <label htmlFor="cat-slug" className="label">Slug</label>
        <input id="cat-slug" name="slug" className="input font-mono text-xs" placeholder="auto from name" defaultValue={kept('slug')} />
      </div>
      <div>
        <label htmlFor="cat-desc" className="label">Description</label>
        <textarea id="cat-desc" name="description" rows={3} className="input" defaultValue={kept('description')} />
      </div>
      <div>
        <label htmlFor="cat-hero" className="label">Hero image URL</label>
        <input id="cat-hero" name="heroImage" className="input text-xs" placeholder="https://…" defaultValue={kept('heroImage')} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="cat-order" className="label">Sort order</label>
          <input id="cat-order" name="sortOrder" type="number" defaultValue={0} className="input" />
        </div>
        <label className="flex items-end gap-2 pb-2.5 text-sm">
          <input type="checkbox" name="isActive" defaultChecked className="accent-brand-700" />
          Live
        </label>
      </div>
      <div>
        <label htmlFor="cat-metaTitle" className="label">Meta title</label>
        <input id="cat-metaTitle" name="metaTitle" maxLength={70} className="input" defaultValue={kept('metaTitle')} />
      </div>
      <div>
        <label htmlFor="cat-metaDesc" className="label">Meta description</label>
        <textarea id="cat-metaDesc" name="metaDescription" rows={2} maxLength={180} className="input" defaultValue={kept('metaDescription')} />
      </div>

      {state?.error && <p role="alert" className="text-sm text-red-600">{state.error}</p>}
      {state?.success && <p role="status" className="text-sm text-emerald-700">{state.success}</p>}

      <button type="submit" disabled={pending} className="btn-primary w-full py-2.5 text-xs">
        {pending ? 'Saving…' : 'Add collection'}
      </button>
    </form>
  );
}
