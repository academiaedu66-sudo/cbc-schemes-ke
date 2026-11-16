import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthorized } from '@/lib/admin-auth';
import {
  getPurchaseAttemptLedger,
  recordPurchaseAttempt,
} from '@/lib/purchase-attempts';

export async function GET(req: NextRequest) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const ledger = await getPurchaseAttemptLedger(true);
    return NextResponse.json({
      totalAttempts: ledger.totalAttempts,
      latestAttempt: ledger.attempts[0] || null,
      recentAttempts: ledger.attempts.slice(0, 20),
      updatedAt: ledger.updatedAt,
    });
  } catch {
    return NextResponse.json(
      { totalAttempts: 0, latestAttempt: null, recentAttempts: [] },
      { status: 200 }
    );
  }
}

export async function POST(req: NextRequest) {
  void req.headers.get('user-agent');

  try {
    const body = (await req.json().catch(() => ({}))) as {
      channel?: string;
      itemTitle?: string;
      amountKes?: number;
      buyerPhone?: string;
      stage?: 'OPENED_CHECKOUT' | 'SUBMITTED_PAYMENT';
    };

    const event = await recordPurchaseAttempt({
      channel: body.channel || 'Storefront',
      itemTitle: body.itemTitle || 'CBC Material / Service',
      amountKes: body.amountKes,
      buyerPhone: body.buyerPhone,
      stage: body.stage || 'OPENED_CHECKOUT',
    });

    return NextResponse.json({ ok: true, id: event.id });
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
