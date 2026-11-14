import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { extractMpesaReceiptCode, normalizeKenyanPhone } from '@/lib/mpesa';

export async function POST(req: Request) {
  try {
    const { mpesaCode, phoneNumber, resourceId } = await req.json();

    const cleanCode = extractMpesaReceiptCode(mpesaCode || '');

    if (!cleanCode) {
      return NextResponse.json(
        {
          error:
            'Please paste a valid 10-character M-Pesa transaction code (e.g. SJK84M2P9Q) or paste the full M-Pesa confirmation SMS.',
        },
        { status: 400 }
      );
    }

    if (!resourceId) {
      return NextResponse.json({ error: 'Resource selection is required.' }, { status: 400 });
    }

    const phone =
      normalizeKenyanPhone(phoneNumber || '') ||
      String(phoneNumber || 'DIRECT_MPESA').trim() ||
      'DIRECT_MPESA';

    // Verify resource exists
    const { data: resource, error: resErr } = await supabaseAdmin
      .from('resources')
      .select('id, price, title')
      .eq('id', resourceId)
      .single();

    if (resErr || !resource) {
      return NextResponse.json({ error: 'Selected material not found.' }, { status: 404 });
    }

    // Prevent reusing an already used M-Pesa receipt code across different materials
    const { data: existingReceipt } = await supabaseAdmin
      .from('orders')
      .select('id, status, checkout_request_id, resource_id')
      .eq('mpesa_receipt_number', cleanCode)
      .maybeSingle();

    if (existingReceipt) {
      if (existingReceipt.resource_id === resource.id && existingReceipt.status !== 'FAILED') {
        return NextResponse.json({
          checkoutRequestId: existingReceipt.checkout_request_id,
          receiptCode: cleanCode,
          message: 'M-Pesa code recognized — checking verification status...',
        });
      }
      return NextResponse.json(
        { error: 'This M-Pesa transaction code has already been used on another order.' },
        { status: 400 }
      );
    }

    const checkoutRequestId = `MANUAL_${cleanCode}_${Date.now()}`;

    const { error: insertErr } = await supabaseAdmin.from('orders').insert({
      checkout_request_id: checkoutRequestId,
      phone_number: phone,
      resource_id: resource.id,
      amount: Math.round(Number(resource.price) || 50),
      mpesa_receipt_number: cleanCode,
      status: 'PENDING',
    });

    if (insertErr) {
      throw new Error(insertErr.message);
    }

    return NextResponse.json({
      checkoutRequestId,
      receiptCode: cleanCode,
      message: `M-Pesa code ${cleanCode} received! Unlocking as soon as payment to 0728595160 is confirmed...`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to submit M-Pesa code';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
