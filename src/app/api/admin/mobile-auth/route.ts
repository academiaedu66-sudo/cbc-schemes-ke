import { NextRequest, NextResponse } from 'next/server';
import {
  DEFAULT_ADMIN_EMAIL,
  getRequestIp,
  verifyAdminEmailAndPassword,
} from '@/lib/admin-auth';
import {
  checkIpLockout,
  getSecurityState,
  recordFailedAuthAttempt,
} from '@/lib/security';

export async function POST(req: NextRequest) {
  const ip = getRequestIp(req);

  try {
    const secState = await getSecurityState();
    const lock = checkIpLockout(secState, ip);
    if (lock.locked) {
      return NextResponse.json(
        {
          error: `Too many failed sign-in attempts from this IP. Locked for ${Math.ceil(
            lock.retryAfterSec / 60
          )} minutes.`,
        },
        { status: 429 }
      );
    }

    const body = (await req.json()) as { email?: string; password?: string };
    const email = (body.email || '').trim();
    const password = (body.password || '').trim();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Please enter both admin email and password.' },
        { status: 400 }
      );
    }

    const valid = verifyAdminEmailAndPassword(email, password);
    if (!valid) {
      const fail = await recordFailedAuthAttempt(
        ip,
        `Failed Mobile Admin login (${email.slice(0, 32)})`
      );
      return NextResponse.json(
        {
          error: fail.locked
            ? 'IP locked for 30 minutes due to repeated failed attempts.'
            : `Invalid admin email or password (${fail.attemptsLeft} attempts left before lockout).`,
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      authenticated: true,
      email: (process.env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL).trim().toLowerCase(),
    });
  } catch {
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
