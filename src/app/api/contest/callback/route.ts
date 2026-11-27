// src/app/api/contest/callback/route.ts
import { NextResponse } from 'next/server';
import {
  findContestParticipantByCheckoutOrRef,
  updateContestParticipant,
} from '@/lib/contest-store';
import { triggerAutomaticBackup } from '@/lib/security';

/**
 * M-Pesa / PayHero callback for contest payments.
 * Supports Daraja STK callback, PayHero nested/flat webhook, and direct JSON.
 */
export async function POST(req: Request) {
  try {
    const payload = await req.json();

    const stkCallback = payload?.Body?.stkCallback;
    const isPayHeroNested = Boolean(payload?.response);
    const checkoutId =
      stkCallback?.CheckoutRequestID ||
      (isPayHeroNested ? payload.response?.CheckoutRequestID : null) ||
      payload.CheckoutRequestID ||
      (payload.reference ? `PAYHERO_${payload.reference}` : null);

    const externalRef =
      (isPayHeroNested ? payload.response?.ExternalReference : null) ||
      payload.external_reference ||
      payload.user_reference ||
      null;

    const resultCode =
      stkCallback?.ResultCode ??
      (isPayHeroNested
        ? Number(
            payload.response?.ResultCode ??
              (String(payload.response?.Status || '').toUpperCase() === 'SUCCESS' ? 0 : 1)
          )
        : payload.ResultCode ?? (payload.paymentSuccess === true ? 0 : 1));

    if (!checkoutId && !externalRef) {
      return NextResponse.json({ success: false, message: 'Missing CheckoutRequestID' }, { status: 400 });
    }

    const participant = await findContestParticipantByCheckoutOrRef(checkoutId, externalRef);
    if (!participant) {
      return NextResponse.json({ success: false, message: 'Participant not found' }, { status: 404 });
    }

    if (Number(resultCode) === 0) {
      await updateContestParticipant(participant.id, {
        status: 'confirmed',
        payment_confirmed_at: new Date().toISOString(),
      });
      void triggerAutomaticBackup(`Contest payment confirmed: ${participant.id}`);
    } else {
      await updateContestParticipant(participant.id, { status: 'failed' });
    }

    return NextResponse.json({ success: true, message: 'Callback processed' });
  } catch (e: unknown) {
    console.error('Contest callback error', e);
    const msg = e instanceof Error ? e.message : 'Server error';
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
