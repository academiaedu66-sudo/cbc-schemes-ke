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
  saveSecurityState,
} from '@/lib/security';

export async function POST(req: NextRequest) {
  const ip = getRequestIp(req);

  try {
    const body = (await req.json()) as { email?: string; password?: string };
    const email = (body.email || '').trim();
    const password = (body.password || '').trim();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Please enter both admin email and password.' },
        { status: 400 }
      );
    }

    const secState = await getSecurityState();
    const lock = checkIpLockout(secState, ip);
    const valid = verifyAdminEmailAndPassword(email, password);

    // If an IP is locked, keep blocking wrong guesses — but allow the verified owner right in & clear self-lockout!
    if (!valid) {
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

    // Verified owner! Clear any prior CGNAT / self-test IP lockout automatically
    if (secState.ipFailures[ip]) {
      delete secState.ipFailures[ip];
      await saveSecurityState(secState).catch(() => {});
    }

    return NextResponse.json({
      authenticated: true,
      email: email.toLowerCase() || DEFAULT_ADMIN_EMAIL,
    });
  } catch {
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
