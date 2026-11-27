// src/app/api/contest/callback/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * M‑Pesa callback for contest payments.
 * Expected body contains `CheckoutRequestID` and `ResultCode` (0 = success).
 */
export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const checkoutId = payload.CheckoutRequestID;
    const resultCode = payload.ResultCode;
    if (!checkoutId) return NextResponse.json({ success: false, message: 'Missing CheckoutRequestID' }, { status: 400 });
    // Find participant
    const { data: participant, error } = await supabaseAdmin
      .from('contest_participants')
      .select('id, status')
      .eq('checkout_request_id', checkoutId)
      .single();
    if (error || !participant) {
      return NextResponse.json({ success: false, message: 'Participant not found' }, { status: 404 });
    }
    if (resultCode === 0) {
      // Payment successful – mark confirmed
      await supabaseAdmin
        .from('contest_participants')
        .update({ status: 'confirmed', payment_confirmed_at: new Date().toISOString() })
        .eq('id', participant.id);
    } else {
      // Payment failed – keep pending or mark failed
      await supabaseAdmin
        .from('contest_participants')
        .update({ status: 'failed' })
        .eq('id', participant.id);
    }
    return NextResponse.json({ success: true, message: 'Callback processed' });
  } catch (e: any) {
    console.error('Contest callback error', e);
    return NextResponse.json({ success: false, message: e?.message || 'Server error' }, { status: 500 });
  }
}
