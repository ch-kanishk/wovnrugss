import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { getSession } from '@/lib/auth';

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const ALLOWED: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/avif': '.avif',
};

/**
 * Image upload for the admin.
 *
 * Storage is chosen at runtime:
 *  - BLOB_READ_WRITE_TOKEN present (Vercel)  -> Vercel Blob
 *  - otherwise (local dev)                   -> public/uploads on disk
 *
 * The local branch cannot be used on Vercel: serverless filesystems are
 * read-only apart from /tmp, and /tmp does not survive between invocations, so
 * anything written there would 404 on the next request.
 */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'File is larger than 8 MB.' }, { status: 413 });

  const ext = ALLOWED[file.type];
  if (!ext) return NextResponse.json({ error: 'Only JPEG, PNG, WebP or AVIF images are allowed.' }, { status: 415 });

  // Random filename — the client-supplied name never reaches the storage path.
  const filename = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import('@vercel/blob');
    const blob = await put(`products/${filename}`, file, {
      access: 'public',
      contentType: file.type,
      addRandomSuffix: false,
    });
    return NextResponse.json({ url: blob.url });
  }

  if (process.env.VERCEL) {
    return NextResponse.json(
      {
        error:
          'Image storage is not configured. Add a Vercel Blob store to this project ' +
          '(Storage → Create → Blob), which sets BLOB_READ_WRITE_TOKEN, then redeploy. ' +
          'You can paste an image URL in the meantime.',
      },
      { status: 501 }
    );
  }

  const dir = path.join(process.cwd(), 'public', 'uploads');
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), Buffer.from(await file.arrayBuffer()));
  return NextResponse.json({ url: `/uploads/${filename}` });
}
