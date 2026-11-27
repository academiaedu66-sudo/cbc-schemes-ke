import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { initiateStkPush } from '@/lib/mpesa';

/**
 * POST /api/vip/subscribe
 * Body: { customerId: string, period: 'term' | 'annual' }
 * Returns: { success: boolean, message?: string }
 */
export async function POST(req: Request) {
  try {
    const { customerId, period } = await req.json();
    if (!customerId || !period) {
      return NextResponse.json({ success: false, message: 'Missing parameters' }, { status: 400 });
    }

    // Determine amount and expiry based on period
    const amount = period === 'annual' ? 2000 : 500; // KSh values – adjust as needed
    const days = period === 'annual' ? 365 : 90; // assume 3‑month term
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);

    // Initiate M‑Pesa STK push – use existing utility
    const stkResult = await initiateStkPush({
      phoneNumber: '', // client should send phone after this endpoint returns a payment intent URL
      amount,
      reference: `VIP-${customerId}-${Date.now()}`,
      description: `VIP ${period} subscription for customer ${customerId}`,
    });

    // Record subscription pending (status will be updated on callback)
    const { data, error } = await supabaseAdmin
      .from('vip_subscriptions')
      .insert({
        customer_id: customerId,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString(),
        // Store payment intent ID if available from stkResult
        // (Assuming stkResult contains a transaction reference)
        // payment_intent_id: stkResult?.CheckoutRequestID ?? null,
      });
    if (error) throw error;

    return NextResponse.json({ success: true, message: 'STK push initiated', data });
  } catch (e: any) {
    console.error('VIP subscription error', e);
    return NextResponse.json({ success: false, message: e?.message || 'Server error' }, { status: 500 });
  }
}
