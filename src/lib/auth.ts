/**
 * Minimal stateless admin session: an HMAC-signed cookie. No external auth
 * dependency, no session table. Swap for NextAuth/Clerk if you need multiple
 * staff accounts with roles.
 */
import crypto from 'crypto';
import { cookies } from 'next/headers';

const COOKIE = 'wr_admin';
const MAX_AGE = 60 * 60 * 12; // 12 hours

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) throw new Error('AUTH_SECRET is missing or too short (min 16 chars).');
  return s;
}

function sign(value: string) {
  return crypto.createHmac('sha256', secret()).update(value).digest('base64url');
}

export function createSessionToken(email: string) {
  const payload = Buffer.from(JSON.stringify({ email, exp: Date.now() + MAX_AGE * 1000 })).toString(
    'base64url'
  );
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token?: string): { email: string } | null {
  if (!token) return null;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return null;
  const expected = sign(payload);
  const a = Buffer.from(expected);
  const b = Buffer.from(sig);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (!data.exp || data.exp < Date.now()) return null;
    return { email: data.email };
  } catch {
    return null;
  }
}

export function checkCredentials(email: string, password: string) {
  const adminEmail = process.env.ADMIN_EMAIL || '';
  const adminPassword = process.env.ADMIN_PASSWORD || '';
  if (!adminEmail || !adminPassword) return false;
  const emailOk =
    email.trim().toLowerCase() === adminEmail.trim().toLowerCase();
  const pwBuf = Buffer.from(password);
  const expBuf = Buffer.from(adminPassword);
  const pwOk = pwBuf.length === expBuf.length && crypto.timingSafeEqual(pwBuf, expBuf);
  return emailOk && pwOk;
}

export async function getSession() {
  const store = await cookies();
  return verifySessionToken(store.get(COOKIE)?.value);
}

export async function requireSession() {
  const session = await getSession();
  if (!session) throw new Error('UNAUTHORIZED');
  return session;
}

export const SESSION_COOKIE = COOKIE;
export const SESSION_MAX_AGE = MAX_AGE;
