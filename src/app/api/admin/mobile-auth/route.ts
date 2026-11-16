import { NextRequest, NextResponse } from 'next/server';
import {
  DEFAULT_ADMIN_EMAIL,
  verifyAdminEmailAndPassword,
} from '@/lib/admin-auth';

export async function POST(req: NextRequest) {
  void req.headers.get('user-agent');

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

    const valid = verifyAdminEmailAndPassword(email, password);
    if (!valid) {
      return NextResponse.json(
        { error: 'Invalid admin email or password.' },
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
