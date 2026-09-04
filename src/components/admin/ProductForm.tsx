'use client';

import { useActionState, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { saveProduct, type ActionState } from '@/app/admin/actions';
import { slugify } from '@/lib/utils';

interface Props {
  product?: {
    id: string; name: string; slug: string; sku: string; shortDesc: string | null; description: string | null;
    price: number; compareAt: number | null; stock: number; categoryId: string | null;
    material: string | null; technique: string | null; style: string | null; colorFamily: string | null;
    shape: string | null; sizeLabel: string | null; widthCm: number | null; lengthCm: number | null;
    pileHeight: string | null; knotsPerSqIn: number | null; metaTitle: string | null; metaDescription: string | null;
    isActive: boolean; isFeatured: boolean; images: { url: string }[];
  };
  categories: { id: string; name: string }[];
}

const TECHNIQUES = ['Hand-Knotted', 'Hand-Tufted', 'Flatweave', 'Hand-Loom', 'Hand-Braided'];
const MATERIALS = ['Wool', 'Wool & Silk', 'Wool & Viscose', 'Pure Silk', 'Jute', 'Cotton'];
const STYLES = ['Traditional', 'Transitional', 'Modern', 'Vintage', 'Abstract', 'Geometric'];
const COLORS = ['Ivory', 'Beige', 'Blue', 'Grey', 'Charcoal', 'Rust', 'Green', 'Gold', 'Multi'];
const SHAPES = ['Rectangle', 'Square', 'Round', 'Runner', 'Oval'];

export function ProductForm({ product, categories }: Props) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(saveProduct, null);
  const [images, setImages] = useState<string[]>(product?.images.map((i) => i.url) ?? []);
  const [name, setName] = useState(product?.name ?? '');
  const [slug, setSlug] = useState(product?.slug ?? '');
  const [slugTouched, setSlugTouched] = useState(Boolean(product));
  const [uploading, setUploading] = useState(false);
  // React resets uncontrolled fields once the action resolves, so a validation
  // error would otherwise wipe the form. `state.values` restores what was typed.
  const kept = (field: string, fallback: string | number | null | undefined) =>
    state?.values?.[field] ?? (fallback ?? '');
  const [uploadError, setUploadError] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');

  async function onUpload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setUploadError('');
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Upload failed.');
        setImages((prev) => [...prev, data.url]);
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  }

  function move(index: number, dir: -1 | 1) {
    setImages((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  return (
    <form action={formAction} className="space-y-8">
      {product && <input type="hidden" name="id" value={product.id} />}
      {images.map((url) => <input key={url} type="hidden" name="images" value={url} />)}

      {state?.error && (
        <p role="alert" className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-8">
          {/* Basics */}
          <section className="card p-6">
            <h2 className="mb-5 font-display text-xl">Basics</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="name" className="label">Product name *</label>
                <input
                  id="name" name="name" required value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!slugTouched) setSlug(slugify(e.target.value));
                  }}
                  className="input" placeholder="Amrapali Hand-Knotted Wool Rug"
                />
              </div>
              <div>
                <label htmlFor="slug" className="label">URL slug</label>
                <input
                  id="slug" name="slug" value={slug}
                  onChange={(e) => { setSlug(e.target.value); setSlugTouched(true); }}
                  className="input font-mono text-xs" placeholder="auto-generated from the name"
                />
                <p className="mt-1 text-[11px] text-ink/45">/rugs/{slug || 'your-product'}</p>
              </div>
              <div>
                <label htmlFor="sku" className="label">SKU *</label>
                <input id="sku" name="sku" required defaultValue={kept('sku', product?.sku)} className="input font-mono text-xs" placeholder="WR-HK-0001" />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="shortDesc" className="label">Short description</label>
                <input id="shortDesc" name="shortDesc" defaultValue={kept('shortDesc', product?.shortDesc)} maxLength={400} className="input"
                  placeholder="One line shown under the title and used as a fallback meta description." />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="description" className="label">Full description</label>
                <textarea id="description" name="description" rows={8} defaultValue={kept('description', product?.description)} className="input"
                  placeholder="Tell the story of the rug — the design origin, the knot count, the room it suits." />
              </div>
            </div>
          </section>

          {/* Attributes */}
          <section className="card p-6">
            <h2 className="mb-1 font-display text-xl">Rug attributes</h2>
            <p className="mb-5 text-xs text-ink/50">These power the shop filters and the Product structured data.</p>
            <div className="grid gap-4 sm:grid-cols-3">
              <Select id="technique" label="Technique" options={TECHNIQUES} defaultValue={String(kept('technique', product?.technique))} />
              <Select id="material" label="Material" options={MATERIALS} defaultValue={String(kept('material', product?.material))} />
              <Select id="style" label="Style" options={STYLES} defaultValue={String(kept('style', product?.style))} />
              <Select id="colorFamily" label="Colour family" options={COLORS} defaultValue={String(kept('colorFamily', product?.colorFamily))} />
              <Select id="shape" label="Shape" options={SHAPES} defaultValue={String(kept('shape', product?.shape))} />
              <div>
                <label htmlFor="sizeLabel" className="label">Size label</label>
                <input id="sizeLabel" name="sizeLabel" defaultValue={kept('sizeLabel', product?.sizeLabel)} className="input" placeholder="8' x 10'" />
              </div>
              <div>
                <label htmlFor="widthCm" className="label">Width (cm)</label>
                <input id="widthCm" name="widthCm" type="number" defaultValue={kept('widthCm', product?.widthCm)} className="input" />
              </div>
              <div>
                <label htmlFor="lengthCm" className="label">Length (cm)</label>
                <input id="lengthCm" name="lengthCm" type="number" defaultValue={kept('lengthCm', product?.lengthCm)} className="input" />
              </div>
              <div>
                <label htmlFor="pileHeight" className="label">Pile height</label>
                <input id="pileHeight" name="pileHeight" defaultValue={kept('pileHeight', product?.pileHeight)} className="input" placeholder="8 mm" />
              </div>
              <div>
                <label htmlFor="knotsPerSqIn" className="label">Knots / sq. inch</label>
                <input id="knotsPerSqIn" name="knotsPerSqIn" type="number" defaultValue={kept('knotsPerSqIn', product?.knotsPerSqIn)} className="input" />
              </div>
            </div>
          </section>

          {/* Images */}
          <section className="card p-6">
            <h2 className="mb-1 font-display text-xl">Images</h2>
            <p className="mb-5 text-xs text-ink/50">The first image is the one shown in listings. Drag order with the arrows.</p>

            {images.length > 0 && (
              <ul className="mb-5 grid grid-cols-3 gap-3 sm:grid-cols-5">
                {images.map((url, i) => (
                  <li key={url + i} className="group relative">
                    <div className="relative aspect-square overflow-hidden border border-ink/10 bg-sand">
                      <Image src={url} alt="" fill sizes="120px" className="object-cover" />
                      {i === 0 && <span className="badge absolute left-1 top-1 bg-ink text-white">Main</span>}
                    </div>
                    <div className="mt-1 flex justify-between text-[11px]">
                      <div className="flex gap-1">
                        <button type="button" onClick={() => move(i, -1)} className="px-1 text-ink/50 hover:text-ink" aria-label="Move left">←</button>
                        <button type="button" onClick={() => move(i, 1)} className="px-1 text-ink/50 hover:text-ink" aria-label="Move right">→</button>
                      </div>
                      <button
                        type="button"
                        onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                        className="text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="space-y-3">
              <div>
                <label htmlFor="upload" className="label">Upload from your computer</label>
                <input
                  id="upload" type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple
                  onChange={(e) => onUpload(e.target.files)} disabled={uploading}
                  className="block w-full text-sm file:mr-3 file:border file:border-ink/15 file:bg-white file:px-4 file:py-2 file:text-xs file:uppercase file:tracking-wider"
                />
                {uploading && <p className="mt-1 text-xs text-ink/50">Uploading…</p>}
                {uploadError && <p className="mt-1 text-xs text-red-600">{uploadError}</p>}
              </div>

              <div>
                <label htmlFor="imageUrl" className="label">…or paste an image URL</label>
                <div className="flex gap-2">
                  <input
                    id="imageUrl" value={newImageUrl} onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="https://…" className="input"
                  />
                  <button
                    type="button"
                    onClick={() => { if (newImageUrl.trim()) { setImages((p) => [...p, newImageUrl.trim()]); setNewImageUrl(''); } }}
                    className="btn-outline whitespace-nowrap px-4 py-2 text-xs"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* SEO */}
          <section className="card p-6">
            <h2 className="mb-1 font-display text-xl">SEO</h2>
            <p className="mb-5 text-xs text-ink/50">Leave blank and we generate these from the product name and attributes.</p>
            <div className="space-y-4">
              <div>
                <label htmlFor="metaTitle" className="label">Meta title (≤ 60 chars ideal)</label>
                <input id="metaTitle" name="metaTitle" maxLength={70} defaultValue={kept('metaTitle', product?.metaTitle)} className="input" />
              </div>
              <div>
                <label htmlFor="metaDescription" className="label">Meta description (≤ 160 chars ideal)</label>
                <textarea id="metaDescription" name="metaDescription" rows={3} maxLength={180} defaultValue={kept('metaDescription', product?.metaDescription)} className="input" />
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6 lg:sticky lg:top-8 lg:h-fit">
          <section className="card p-6">
            <h2 className="mb-5 font-display text-lg">Pricing & stock</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="price" className="label">Price (₹) *</label>
                <input
                  id="price" name="price" type="number" min={1} step="0.01" required
                  defaultValue={kept('price', product ? product.price / 100 : '')} className="input"
                />
              </div>
              <div>
                <label htmlFor="compareAt" className="label">MRP / compare-at (₹)</label>
                <input
                  id="compareAt" name="compareAt" type="number" min={0} step="0.01"
                  defaultValue={kept('compareAt', product?.compareAt ? product.compareAt / 100 : '')} className="input"
                />
              </div>
              <div>
                <label htmlFor="stock" className="label">Stock quantity</label>
                <input id="stock" name="stock" type="number" min={0} defaultValue={kept('stock', product?.stock ?? 1)} className="input" />
              </div>
            </div>
          </section>

          <section className="card p-6">
            <h2 className="mb-5 font-display text-lg">Organisation</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="categoryId" className="label">Collection</label>
                <select id="categoryId" name="categoryId" defaultValue={kept('categoryId', product?.categoryId)} className="input">
                  <option value="">No collection</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-2.5 text-sm">
                <input type="checkbox" name="isActive" defaultChecked={state?.values ? state.values.isActive === 'on' : (product?.isActive ?? true)} className="accent-brand-700" />
                Visible in the shop
              </label>
              <label className="flex items-center gap-2.5 text-sm">
                <input type="checkbox" name="isFeatured" defaultChecked={state?.values ? state.values.isFeatured === 'on' : (product?.isFeatured ?? false)} className="accent-brand-700" />
                Feature on the homepage
              </label>
            </div>
          </section>

          <div className="flex gap-2">
            <button type="submit" disabled={pending} className="btn-primary flex-1 py-2.5 text-xs">
              {pending ? 'Saving…' : product ? 'Save changes' : 'Create product'}
            </button>
            <Link href="/admin/products" className="btn-outline px-4 py-2.5 text-xs">Cancel</Link>
          </div>
        </div>
      </div>
    </form>
  );
}

function Select({
  id, label, options, defaultValue,
}: { id: string; label: string; options: string[]; defaultValue?: string | null }) {
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      <input id={id} name={id} list={`${id}-options`} defaultValue={defaultValue ?? ''} className="input" />
      <datalist id={`${id}-options`}>
        {options.map((o) => <option key={o} value={o} />)}
      </datalist>
    </div>
  );
}
