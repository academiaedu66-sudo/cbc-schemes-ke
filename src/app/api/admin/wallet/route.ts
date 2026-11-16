import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthorized } from '@/lib/admin-auth';
import { sendWhatsAppAdminNotification } from '@/lib/mpesa';
import {
  computeWalletOverview,
  createWalletWithdrawal,
  updateWithdrawalStatus,
  type WithdrawalMethod,
  type WithdrawalSource,
} from '@/lib/wallet';

export async function GET(req: NextRequest) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const overview = await computeWalletOverview();
    return NextResponse.json({ overview });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to load wallet';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = (await req.json()) as {
      amountKes?: number;
      source?: WithdrawalSource;
      method?: WithdrawalMethod;
      destination?: string;
    };

    const result = await createWalletWithdrawal({
      amountKes: Number(body.amountKes) || 0,
      source: body.source || 'COMBINED',
      method: body.method || 'MPESA',
      destination: body.destination || '0728595160',
    });

    if (!result.ok || !result.withdrawal) {
      return NextResponse.json(
        { error: result.error || 'Withdrawal failed' },
        { status: 400 }
      );
    }

    const w = result.withdrawal;
    await sendWhatsAppAdminNotification(
      `💸 *CBC WALLET WITHDRAWAL (${w.referenceCode})*\n` +
        `• *Amount:* KES ${w.amountKes.toLocaleString()}\n` +
        `• *Breakdown:* Client Payments KES ${w.fromClientPaymentsKes.toLocaleString()} + Monetization KES ${w.fromMonetizationKes.toLocaleString()}\n` +
        `• *Destination:* ${w.method} (${w.destination})\n` +
        `• *Status:* ${w.status}`
    ).catch(() => false);

    return NextResponse.json({
      success: true,
      withdrawal: result.withdrawal,
      overview: result.overview,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Withdrawal failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = (await req.json()) as {
      id?: string;
      status?: 'COMPLETED' | 'PENDING_SETTLEMENT' | 'CANCELLED';
    };

    if (!body.id || !body.status) {
      return NextResponse.json(
        { error: 'Withdrawal ID and status required' },
        { status: 400 }
      );
    }

    const overview = await updateWithdrawalStatus(body.id, body.status);
    return NextResponse.json({ success: true, overview });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Update failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
