import { NextRequest, NextResponse } from 'next/server';
import {
  loginExistingCustomer,
  registerOrUpdateCustomer,
  type CustomerRole,
} from '@/lib/customer-accounts';
import {
  getSeoCustomerSensorLedger,
  saveSeoCustomerSensorLedger,
} from '@/lib/seo-visitor-sensor';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = String(body.action || 'signup').toLowerCase();
    const email = String(body.email || '').trim();
    const phone = String(body.phone || '').trim();
    const fullName = String(body.fullName || '').trim();
    const password = String(body.password || '').trim();
    const sourcePath = String(body.sourcePath || '/').trim();
    const rawRole = String(body.role || 'Member');
    const role: CustomerRole =
      rawRole === 'Teacher' || rawRole === 'Parent' || rawRole === 'Learner'
        ? rawRole
        : 'Member';

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address (e.g. name@gmail.com).' },
        { status: 400 }
      );
    }

    if (action === 'login') {
      if (!phone && !password) {
        return NextResponse.json(
          { error: 'Please enter your registered phone number to log in.' },
          { status: 400 }
        );
      }

      const found = await loginExistingCustomer({ email, phone, password });
      if (!found) {
        return NextResponse.json(
          {
            error:
              'Account not found or phone number did not match. Please switch to Sign Up to create your account!',
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        ok: true,
        mode: 'login',
        customer: {
          id: found.id,
          email: found.email,
          phone: found.phone,
          fullName: found.fullName,
          role: found.role,
          createdAt: found.createdAt,
        },
      });
    }

    // Default: Sign Up (Email + Phone Number both required and preserved in backend!)
    const digitsCount = phone.replace(/\D/g, '').length;
    if (digitsCount < 9) {
      return NextResponse.json(
        {
          error:
            'Please enter a valid phone number (e.g. 0712345678 or +254712345678).',
        },
        { status: 400 }
      );
    }

    const saved = await registerOrUpdateCustomer({
      email,
      phone,
      fullName,
      role,
      password,
      sourcePath,
    });

    // Notify live admin sensor ("New customer is here PROFESSOR") as well
    void (async () => {
      try {
        const ledger = await getSeoCustomerSensorLedger(true);
        ledger.totalCustomersDetected = (ledger.totalCustomersDetected || 0) + 1;
        ledger.recentCustomers.unshift({
          id: `signup_${Date.now()}`,
          timestamp: new Date().toISOString(),
          sourceLabel: 'Frontend Member Sign-Up',
          keywordCluster: `${saved.role} Account Registered`,
          searchQuery: `${saved.email} • ${saved.phone}`,
          landingPath: sourcePath,
          deviceSummary: (req.headers.get('user-agent') || 'Web').slice(0, 60),
        });
        await saveSeoCustomerSensorLedger(ledger);
      } catch {}
    })();

    return NextResponse.json({
      ok: true,
      mode: 'signup',
      customer: {
        id: saved.id,
        email: saved.email,
        phone: saved.phone,
        fullName: saved.fullName,
        role: saved.role,
        createdAt: saved.createdAt,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Could not complete sign up';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
