import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import {
  sendWhatsAppAdminNotification,
  triggerInstantPayHeroPayout,
} from '@/lib/mpesa';
import { getStoredPaymentConfig } from '@/lib/payment-config';
import { confirmWithdrawalCallback } from '@/lib/wallet';
import { getStoredMonetizationConfig } from '@/lib/monetization';
import { sendMetaConversionsEvent } from '@/lib/facebook-monetization';

export async function POST(req: Request) {
  try {
    const rawText = await req.text();
    const body = JSON.parse(rawText);

    // 1. PayHero Kenya Webhook Support (both top-level & nested response schemas)
    if (
      body?.paymentSuccess !== undefined ||
      body?.response?.ExternalReference ||
      body?.response?.Status
    ) {
      const isNested = Boolean(body?.response);
      const success = isNested
        ? Number(body.response?.ResultCode) === 0 ||
          String(body.response?.Status || '').toUpperCase() === 'SUCCESS'
        : Boolean(body.paymentSuccess);

      const payheroUuid =
        body?.response?.PayheroReference ||
        body?.response?.payhero_reference ||
        body?.reference ||
        '';
      const payheroRef = isNested ? body.response?.CheckoutRequestID : body.reference;
      const externalRef = isNested
        ? body.response?.ExternalReference
        : body.user_reference || body.external_reference;
      const receipt =
        (isNested
          ? body.response?.MpesaReceiptNumber
          : body.providerReference) ||
        payheroRef ||
        payheroUuid ||
        externalRef ||
        'CONFIRMED';
      const amountNum = Number(
        (isNested ? body.response?.Amount : body.amount) || 0
      );
      const payerPhone = String(
        (isNested ? body.response?.Phone : body.phone) || ''
      );

      const candidateIds = [
        payheroUuid ? `PAYHERO_${payheroUuid}` : '',
        payheroRef ? `PAYHERO_${payheroRef}` : '',
        externalRef ? `PAYHERO_${externalRef}` : '',
      ].filter(Boolean);

      // Handle PayHero B2C Wallet Withdrawal Callbacks ("WD-XXXXXX")
      if (externalRef && String(externalRef).startsWith('WD-')) {
        await confirmWithdrawalCallback({
          referenceCode: String(externalRef),
          mpesaReceipt: String(receipt),
          success,
        });
        return NextResponse.json({ received: true });
      }

      if (candidateIds.length > 0 || externalRef) {
        if (success) {
          if (candidateIds.length > 0) {
            await supabaseAdmin
              .from('orders')
              .update({
                status: 'COMPLETED',
                mpesa_receipt_number: String(receipt).slice(0, 40),
                updated_at: new Date().toISOString(),
              })
              .in('checkout_request_id', candidateIds);
          }
          if (externalRef) {
            await supabaseAdmin
              .from('orders')
              .update({
                status: 'COMPLETED',
                mpesa_receipt_number: String(receipt).slice(0, 40),
                updated_at: new Date().toISOString(),
              })
              .eq('mpesa_receipt_number', String(externalRef));
          }

          // If using PayHero Service Wallet with Auto-Withdraw, disburse immediately to 0728595160
          if (amountNum > 0) {
            await triggerInstantPayHeroPayout(amountNum, String(receipt));
          }

          // Report completed M-Pesa Purchase directly to Facebook Monetization / Conversions API
          void getStoredMonetizationConfig()
            .then((monCfg) =>
              sendMetaConversionsEvent({
                pixelId: monCfg.facebookMonetization?.metaPixelId,
                capiAccessToken:
                  monCfg.facebookMonetization?.metaConversionsApiToken,
                eventName: 'Purchase',
                valueKes: amountNum || 50,
                contentName: `M-Pesa Order ${receipt}`,
              })
            )
            .catch(() => {});

          await sendWhatsAppAdminNotification(
            `✅ *M-PESA RECEIVED*\n• Receipt: ${receipt}\n• Amount: KES ${amountNum}\n• Buyer: ${payerPhone}`
          );
        } else {
          if (candidateIds.length > 0) {
            await supabaseAdmin
              .from('orders')
              .update({ status: 'FAILED', updated_at: new Date().toISOString() })
              .in('checkout_request_id', candidateIds);
          }
          if (externalRef) {
            await supabaseAdmin
              .from('orders')
              .update({ status: 'FAILED', updated_at: new Date().toISOString() })
              .eq('mpesa_receipt_number', String(externalRef));
          }
        }
      }

      return NextResponse.json({ received: true });
    }

    // 2. Paystack Webhook Support
    const paystackSig = req.headers.get('x-paystack-signature');
    const stored = await getStoredPaymentConfig();
    const paystackSecret = (
      stored.paystackSecretKey ||
      process.env.PAYSTACK_SECRET_KEY ||
      ''
    ).trim();

    if (paystackSig && paystackSecret) {
      const expected = crypto
        .createHmac('sha512', paystackSecret)
        .update(rawText)
        .digest('hex');

      if (expected !== paystackSig) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }

      const event = body?.event;
      const ref = body?.data?.reference;

      // Handle Paystack Kenya M-Pesa B2C Transfer Callbacks ("wd-xxxxxx")
      if (
        ref &&
        String(ref).toUpperCase().startsWith('WD-') &&
        (event === 'transfer.success' ||
          event === 'transfer.failed' ||
          event === 'transfer.reversed')
      ) {
        await confirmWithdrawalCallback({
          referenceCode: String(ref).toUpperCase(),
          mpesaReceipt: String(
            body?.data?.transfer_code || body?.data?.Titan_code || ref
          ),
          success: event === 'transfer.success',
        });
        return NextResponse.json({ received: true });
      }

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

          await sendWhatsAppAdminNotification(
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

    // 3. IntaSend Webhook Support
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

        await sendWhatsAppAdminNotification(
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

    // 4. Safaricom Daraja STK Callback
    const stkCallback = body?.Body?.stkCallback;
    if (!stkCallback) {
      return NextResponse.json({ message: 'Invalid payload' }, { status: 400 });
    }

    const { CheckoutRequestID, ResultCode, CallbackMetadata } = stkCallback;

    if (Number(ResultCode) === 0) {
      let receiptNumber = '';
      let paidAmount = '';
      let payerPhone = '';

      if (Array.isArray(CallbackMetadata?.Item)) {
        for (const item of CallbackMetadata.Item) {
          if (item?.Name === 'MpesaReceiptNumber' && item.Value !== undefined) {
            receiptNumber = String(item.Value);
          } else if (item?.Name === 'Amount' && item.Value !== undefined) {
            paidAmount = `KES ${item.Value}`;
          } else if (item?.Name === 'PhoneNumber' && item.Value !== undefined) {
            payerPhone = String(item.Value);
          }
        }
      }

      await supabaseAdmin
        .from('orders')
        .update({
          status: 'COMPLETED',
          mpesa_receipt_number: receiptNumber || null,
          updated_at: new Date().toISOString(),
        })
        .eq('checkout_request_id', CheckoutRequestID);

      await sendWhatsAppAdminNotification(
        `✅ *M-PESA STK PAYMENT COMPLETED*\n• Receipt: ${receiptNumber || 'Confirmed'}\n• Amount: ${paidAmount}\n• Buyer: ${payerPhone}`
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
