/**
 * Edge-runtime session verification, used by middleware.
 *
 * Middleware cannot import node:crypto, so this mirrors the HMAC scheme in
 * src/lib/auth.ts using Web Crypto. Verifying here — rather than only in the
 * admin layout — matters: a layout-level redirect() resolves after React has
 * already begun streaming, so an unauthenticated request would still receive
 * the rendered admin HTML. Turning it away in middleware means the admin RSC
 * tree is never rendered at all.
 */

function toBase64Url(bytes: ArrayBuffer) {
  const binary = String.fromCharCode(...new Uint8Array(bytes));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(value: string) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  return atob(padded + '='.repeat((4 - (padded.length % 4)) % 4));
}

/** Length-safe, constant-time-ish string comparison. */
function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function verifySessionTokenEdge(
  token: string | undefined,
  secret: string | undefined
): Promise<{ email: string } | null> {
  if (!token || !secret) return null;

  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const expected = toBase64Url(
    await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload))
  );
  if (!safeEqual(expected, signature)) return null;

  try {
    const data = JSON.parse(fromBase64Url(payload));
    if (!data.exp || data.exp < Date.now()) return null;
    return { email: data.email };
  } catch {
    return null;
  }
}
