import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { initiateStkPush } from '@/lib/mpesa';

/**
 * POST /api/order-bump
 * Body: { orderId: string, bumpType: string, amountKes: number }
 * Records an optional order bump and returns success.
 */
export async function POST(req: Request) {
  try {
    const { orderId, bumpType, amountKes } = await req.json();
    if (!orderId || !bumpType || !amountKes) {
      return NextResponse.json({ success: false, message: 'Missing parameters' }, { status: 400 });
    }
    const { error } = await supabaseAdmin
      .from('order_bumps')
      .insert({ order_id: orderId, bump_type: bumpType, amount: amountKes });
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('Order bump error', e);
    return NextResponse.json({ success: false, message: e?.message || 'Server error' }, { status: 500 });
  }
}
