import crypto from 'crypto';
import type { NextRequest } from 'next/server';

const FALLBACK_SALT = 'ff7c9774d785b41eadbca0c8e6928bdf';
const FALLBACK_SCRYPT_HEX =
  'cb0ce2c8673d756e0f4fdc2dadf90661655fa0f7d4211662013aa7661126a1f1';

export const DEFAULT_ADMIN_EMAIL = 'academia.edu66@gmail.com';
export const SECONDARY_SECURITY_EMAIL = 'academia.edu55@gmail.com';

function isAllowedAdminEmail(rawEmail: string): boolean {
  const clean = (rawEmail || '').trim().toLowerCase();
  if (!clean) return false;
  const primary = (process.env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL)
    .trim()
    .toLowerCase();
  return clean === primary || clean === SECONDARY_SECURITY_EMAIL;
}

export function verifyAdminPasswordString(rawPassword: string): boolean {
  const provided = (rawPassword || '').trim();
  if (!provided) return false;

  const envPw = (process.env.ADMIN_PASSWORD || '').trim();
  if (envPw) {
    const a = Buffer.from(provided);
    const b = Buffer.from(envPw);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  }

  try {
    const derived = crypto.scryptSync(provided, FALLBACK_SALT, 32);
    const expected = Buffer.from(FALLBACK_SCRYPT_HEX, 'hex');
    return (
      derived.length === expected.length &&
      crypto.timingSafeEqual(derived, expected)
    );
  } catch {
    return false;
  }
}

export function verifyAdminEmailAndPassword(
  rawEmail: string,
  rawPassword: string
): boolean {
  if (!isAllowedAdminEmail(rawEmail)) return false;
  return verifyAdminPasswordString(rawPassword);
}

export function getRequestIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}

export function isAdminAuthorized(req: NextRequest): boolean {
  const providedPw = (req.headers.get('x-admin-password') || '').trim();
  if (!verifyAdminPasswordString(providedPw)) return false;

  // If request comes from the Mobile App (sends x-admin-email), strictly verify email too
  const providedEmail = req.headers.get('x-admin-email');
  if (providedEmail !== null && !isAllowedAdminEmail(providedEmail)) {
    return false;
  }

  return true;
}
