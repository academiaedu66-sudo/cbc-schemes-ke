import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { initiateStkPush } from '@/lib/mpesa';
/**
 * POST /api/teacher/assets/purchase
 * Body: { buyerId: string, assetId: string, phoneNumber: string }
 * Creates an order for the asset and initiates M‑Pesa STK push.
 */
export async function POST(req: Request) {
  try {
    const { buyerId, assetId, phoneNumber } = await req.json();
    if (!buyerId || !assetId || !phoneNumber) {
      return NextResponse.json({ success: false, message: 'Missing fields' }, { status: 400 });
    }
    // Get asset price
    const { data: asset, error: assetErr } = await supabaseAdmin
      .from('teacher_assets')
      .select('price, title')
      .eq('id', assetId)
      .maybeSingle();
    if (assetErr) throw assetErr;
    if (!asset) {
      return NextResponse.json({ success: false, message: 'Asset not found' }, { status: 404 });
    }
    // Create order record (pending)
    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .insert({
        customer_id: buyerId,
        resource_id: assetId,
        amount: asset.price,
        status: 'PENDING',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (orderErr) throw orderErr;
    // Initiate STK push
    const stk = await initiateStkPush({
      phoneNumber,
      amount: asset.price,
      accountReference: `ASSET-${order.id}-${Date.now()}`,
      transactionDesc: `Purchase of "${asset.title}" from teacher marketplace`,
    });
    // Optionally store checkout request ID if returned
    // await supabaseAdmin.from('orders').update({ checkout_request_id: stk?.CheckoutRequestID }).eq('id', order.id);
    return NextResponse.json({ success: true, message: 'STK push initiated', orderId: order.id });
  } catch (e: any) {
    console.error('Marketplace purchase error', e);
    return NextResponse.json({ success: false, message: e?.message || 'Server error' }, { status: 500 });
  }
}
