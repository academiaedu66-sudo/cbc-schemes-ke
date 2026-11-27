import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { initiateStkPush } from '@/lib/mpesa';
import { normalizeKenyanPhone } from '@/lib/mpesa';

/**
 * POST /api/vip/subscribe
 * Body: { customerId: string, period: 'term' | 'annual', phoneNumber: string }
 * Returns: { success: boolean, message?: string, data?: any, stkResult?: any }
 */
export async function POST(req: Request) {
  try {
    const { customerId, period, phoneNumber } = await req.json();

    // Validate required fields
    if (!customerId || !period || !phoneNumber) {
      return NextResponse.json({ success: false, message: 'Missing parameters' }, { status: 400 });
    }

    // Validate period
    if (!['term', 'annual'].includes(period)) {
      return NextResponse.json({ success: false, message: 'Invalid period' }, { status: 400 });
    }

    // Normalize and validate phone number
    const normalizedPhone = normalizeKenyanPhone(phoneNumber);
    if (!normalizedPhone) {
      return NextResponse.json({ success: false, message: 'Invalid phone number format' }, { status: 400 });
    }

    // Determine amount and expiry
    const amount = period === 'annual' ? 2000 : 500; // KSh
    const days = period === 'annual' ? 365 : 90; // term length
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);

    // Initiate M‑Pesa STK push
    const stkResult = await initiateStkPush({
      phoneNumber: normalizedPhone,
      amount,
      accountReference: `VIP-${customerId}-${Date.now()}`,
      transactionDesc: `VIP ${period} subscription for customer ${customerId}`,
    });

    // Record subscription pending
    const { data, error } = await supabaseAdmin
      .from('vip_subscriptions')
      .insert({
        customer_id: customerId,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString(),
        // payment_intent_id: stkResult?.CheckoutRequestID ?? null,
      });

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'STK push initiated', data, stkResult });
  } catch (e: any) {
    console.error('VIP subscription error', e);
    return NextResponse.json({ success: false, message: e?.message || 'Server error' }, { status: 500 });
  }
}
