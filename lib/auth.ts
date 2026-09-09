import crypto from 'crypto';
import { cookies } from 'next/headers';

export const SESSION_COOKIE = 'sourhub_session';

function getSecret(): string {
  return process.env.SESSION_SECRET || 'dev-secret-change-me';
}

function sign(value: string): string {
  const hmac = crypto.createHmac('sha256', getSecret());
  hmac.update(value);
  return hmac.digest('hex');
}

export function createSessionToken(username: string): string {
  const payload = `${username}.${Date.now()}`;
  const signature = sign(payload);
  return Buffer.from(`${payload}.${signature}`).toString('base64url');
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf-8');
    const parts = decoded.split('.');
    if (parts.length !== 3) return false;
    const [username, timestamp, signature] = parts;
    const expected = sign(`${username}.${timestamp}`);
    if (expected !== signature) return false;

    // Sessions expire after 7 days.
    const age = Date.now() - Number(timestamp);
    if (Number.isNaN(age) || age > 7 * 24 * 60 * 60 * 1000) return false;

    const ownerUser = process.env.OWNER_USERNAME || 'owner';
    return username === ownerUser;
  } catch {
    return false;
  }
}

export async function isAuthenticated(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  return verifySessionToken(token);
}

export function checkCredentials(username: string, password: string): boolean {
  const ownerUser = process.env.OWNER_USERNAME || 'owner';
  const ownerPass = process.env.OWNER_PASSWORD || 'change-this-password';
  return username === ownerUser && password === ownerPass;
}
