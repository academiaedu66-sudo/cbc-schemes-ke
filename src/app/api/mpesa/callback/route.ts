import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const stkCallback = body?.Body?.stkCallback;

    if (!stkCallback) {
      return NextResponse.json({ message: 'Invalid payload' }, { status: 400 });
    }

    const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = stkCallback;

    if (ResultCode === 0) {
      let receiptNumber = '';

      if (CallbackMetadata?.Item) {
        const receiptItem = CallbackMetadata.Item.find((i: any) => i.Name === 'MpesaReceiptNumber');
        receiptNumber = receiptItem?.Value || '';
      }

      // Update order to COMPLETED with receipt number
      await supabaseAdmin
        .from('orders')
        .update({
          status: 'COMPLETED',
          mpesa_receipt_number: receiptNumber,
          updated_at: new Date().toISOString(),
        })
        .eq('checkout_request_id', CheckoutRequestID);
    } else {
      // Payment Failed, Cancelled, or Timed out
      await supabaseAdmin
        .from('orders')
        .update({
          status: 'FAILED',
          updated_at: new Date().toISOString(),
        })
        .eq('checkout_request_id', CheckoutRequestID);
    }

    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (error: any) {
    console.error('Callback processing error:', error.message);
    return NextResponse.json({ ResultCode: 1, ResultDesc: 'Internal Server Error' }, { status: 500 });
  }
}