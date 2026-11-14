import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const rawText = await req.text();
    const body = JSON.parse(rawText);

    // 1. Paystack Webhook Support (when PAYSTACK_SECRET_KEY is configured)
    const paystackSig = req.headers.get('x-paystack-signature');
    if (paystackSig && process.env.PAYSTACK_SECRET_KEY) {
      const expected = crypto
        .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY.trim())
        .update(rawText)
        .digest('hex');

      if (expected !== paystackSig) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }

      const event = body?.event;
      const ref = body?.data?.reference;
      if (ref) {
        const checkoutId = `PAYSTACK_${ref}`;
        if (event === 'charge.success') {
          const receipt =
            body?.data?.receipt_number ||
            body?.data?.authorization?.signature ||
            ref;
          await supabaseAdmin
            .from('orders')
            .update({
              status: 'COMPLETED',
              mpesa_receipt_number: String(receipt).slice(0, 40),
              updated_at: new Date().toISOString(),
            })
            .eq('checkout_request_id', checkoutId);
        } else if (event === 'charge.failed') {
          await supabaseAdmin
            .from('orders')
            .update({ status: 'FAILED', updated_at: new Date().toISOString() })
            .eq('checkout_request_id', checkoutId);
        }
      }
      return NextResponse.json({ received: true });
    }

    // 2. IntaSend Webhook Support
    if (body?.invoice_id && body?.state) {
      const checkoutId = `INTASEND_${body.invoice_id}`;
      if (body.state === 'COMPLETE') {
        await supabaseAdmin
          .from('orders')
          .update({
            status: 'COMPLETED',
            mpesa_receipt_number: body.mpesa_reference || body.invoice_id,
            updated_at: new Date().toISOString(),
          })
          .eq('checkout_request_id', checkoutId);
      } else if (body.state === 'FAILED') {
        await supabaseAdmin
          .from('orders')
          .update({ status: 'FAILED', updated_at: new Date().toISOString() })
          .eq('checkout_request_id', checkoutId);
      }
      return NextResponse.json({ received: true });
    }

    // 3. Safaricom Daraja STK Callback
    const stkCallback = body?.Body?.stkCallback;
    if (!stkCallback) {
      return NextResponse.json({ message: 'Invalid payload' }, { status: 400 });
    }

    const { CheckoutRequestID, ResultCode, CallbackMetadata } = stkCallback;

    if (ResultCode === 0) {
      let receiptNumber = '';

      if (CallbackMetadata?.Item) {
        const receiptItem = CallbackMetadata.Item.find(
          (i: { Name?: string; Value?: string }) => i.Name === 'MpesaReceiptNumber'
        );
        receiptNumber = receiptItem?.Value || '';
      }

      await supabaseAdmin
        .from('orders')
        .update({
          status: 'COMPLETED',
          mpesa_receipt_number: receiptNumber,
          updated_at: new Date().toISOString(),
        })
        .eq('checkout_request_id', CheckoutRequestID);
    } else {
      await supabaseAdmin
        .from('orders')
        .update({
          status: 'FAILED',
          updated_at: new Date().toISOString(),
        })
        .eq('checkout_request_id', CheckoutRequestID);
    }

    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Callback error';
    console.error('Callback processing error:', message);
    return NextResponse.json({ ResultCode: 1, ResultDesc: 'Internal Server Error' }, { status: 500 });
  }
}
