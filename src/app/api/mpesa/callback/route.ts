import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendWhatsAppAdminNotification } from '@/lib/mpesa';

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

          void sendWhatsAppAdminNotification(
            `✅ *M-PESA PAYMENT COMPLETED*\n• Receipt: ${receipt}\n• Amount: KES ${Math.round(
              (Number(body?.data?.amount) || 0) / 100
            )}\n• Material: ${body?.data?.metadata?.resource_title || 'CBC Material'}`
          );
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
        const receipt = body.mpesa_reference || body.invoice_id;
        await supabaseAdmin
          .from('orders')
          .update({
            status: 'COMPLETED',
            mpesa_receipt_number: receipt,
            updated_at: new Date().toISOString(),
          })
          .eq('checkout_request_id', checkoutId);

        void sendWhatsAppAdminNotification(
          `✅ *M-PESA PAYMENT COMPLETED*\n• Receipt: ${receipt}\n• Amount: KES ${body.value || ''}`
        );
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
      let paidAmount = '';

      if (CallbackMetadata?.Item) {
        const receiptItem = CallbackMetadata.Item.find(
          (i: { Name?: string; Value?: string }) => i.Name === 'MpesaReceiptNumber'
        );
        const amountItem = CallbackMetadata.Item.find(
          (i: { Name?: string; Value?: string }) => i.Name === 'Amount'
        );
        receiptNumber = receiptItem?.Value || '';
        paidAmount = amountItem?.Value ? `KES ${amountItem.Value}` : '';
      }

      await supabaseAdmin
        .from('orders')
        .update({
          status: 'COMPLETED',
          mpesa_receipt_number: receiptNumber,
          updated_at: new Date().toISOString(),
        })
        .eq('checkout_request_id', CheckoutRequestID);

      void sendWhatsAppAdminNotification(
        `✅ *M-PESA STK PAYMENT COMPLETED*\n• Receipt: ${receiptNumber}\n• Amount: ${paidAmount}`
      );
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
