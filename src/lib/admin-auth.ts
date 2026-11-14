import crypto from 'crypto';
import type { NextRequest } from 'next/server';

const FALLBACK_SALT = 'ff7c9774d785b41eadbca0c8e6928bdf';
const FALLBACK_SCRYPT_HEX =
  'cb0ce2c8673d756e0f4fdc2dadf90661655fa0f7d4211662013aa7661126a1f1';

export function isAdminAuthorized(req: NextRequest): boolean {
  const provided = (req.headers.get('x-admin-password') || '').trim();
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
    return derived.length === expected.length && crypto.timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}
