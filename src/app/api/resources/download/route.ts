import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import {
  DARAJA_HEADERS,
  getDarajaSession,
  getEatTimestamp,
  sendWhatsAppAdminNotification,
  shouldThrottleQuery,
  triggerInstantPayHeroPayout,
} from '@/lib/mpesa';
import { formatPayHeroAuthHeader, getStoredPaymentConfig } from '@/lib/payment-config';
import {
  extractMpesaNameFromPayload,
  recordBuyerMpesaName,
  resolveBuyerMpesaName,
} from '@/lib/buyer-identity';

const BUCKET_NAME = 'cbc-materials';

async function verifyPayHeroOrder(
  checkoutRequestId: string,
  orderAmount: number
): Promise<'COMPLETED' | 'FAILED' | 'PENDING'> {
  if (shouldThrottleQuery(checkoutRequestId, 900)) {
    return 'PENDING';
  }
  const stored = await getStoredPaymentConfig();
  const rawToken = (stored.payheroAuthToken || process.env.PAYHERO_AUTH_TOKEN || '').trim();
  if (!rawToken) return 'PENDING';

  const reference = checkoutRequestId.replace(/^PAYHERO_/, '');
  try {
    const res = await fetch(
      `https://backend.payhero.co.ke/api/v2/transaction-status?reference=${encodeURIComponent(
        reference
      )}`,
      {
        headers: { Authorization: formatPayHeroAuthHeader(rawToken) },
        cache: 'no-store',
      }
    );
    const json = await res.json();
    const st = String(json?.status || '').toUpperCase();

    if (st === 'SUCCESS' || st === 'COMPLETED') {
      const receipt = json?.provider_reference || json?.third_party_reference || reference;
      const phName = extractMpesaNameFromPayload(json);
      if (phName) {
        await recordBuyerMpesaName({
          checkoutRequestId,
          phone: String(json?.phone_number || ''),
          buyerName: phName,
        });
      }
      await supabaseAdmin
        .from('orders')
        .update({
          status: 'COMPLETED',
          mpesa_receipt_number: String(receipt).slice(0, 40),
          updated_at: new Date().toISOString(),
        })
        .eq('checkout_request_id', checkoutRequestId);

      if (orderAmount > 0) {
        await triggerInstantPayHeroPayout({ amount: orderAmount, receipt: String(receipt) });
      }

      void sendWhatsAppAdminNotification(
        `✅ *M-PESA RECEIVED IN 0728595160*\n• Receipt: ${receipt}\n• Amount: KES ${orderAmount}`
      );
      return 'COMPLETED';
    }

    if (st === 'FAILED' || st === 'CANCELLED' || st === 'CANCELED') {
      await supabaseAdmin
        .from('orders')
        .update({ status: 'FAILED', updated_at: new Date().toISOString() })
        .eq('checkout_request_id', checkoutRequestId);
      return 'FAILED';
    }

    return 'PENDING';
  } catch {
    return 'PENDING';
  }
}

async function verifyPaystackOrder(checkoutRequestId: string): Promise<'COMPLETED' | 'FAILED' | 'PENDING'> {
  if (shouldThrottleQuery(checkoutRequestId, 4500)) {
    return 'PENDING';
  }
  const stored = await getStoredPaymentConfig();
  const secret = (stored.paystackSecretKey || process.env.PAYSTACK_SECRET_KEY || '').trim();
  if (!secret) return 'PENDING';

  const reference = checkoutRequestId.replace(/^PAYSTACK_/, '');
  try {
    const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${secret}` },
      cache: 'no-store',
    });
    const json = await res.json();
    const txStatus = json?.data?.status;
    if (txStatus === 'success') {
      const receipt = json?.data?.receipt_number || reference;
      await supabaseAdmin
        .from('orders')
        .update({
          status: 'COMPLETED',
          mpesa_receipt_number: String(receipt).slice(0, 40),
          updated_at: new Date().toISOString(),
        })
        .eq('checkout_request_id', checkoutRequestId);
      return 'COMPLETED';
    }
    if (txStatus === 'failed' || txStatus === 'abandoned') {
      await supabaseAdmin
        .from('orders')
        .update({ status: 'FAILED', updated_at: new Date().toISOString() })
        .eq('checkout_request_id', checkoutRequestId);
      return 'FAILED';
    }
    return 'PENDING';
  } catch {
    return 'PENDING';
  }
}

async function verifyIntaSendOrder(checkoutRequestId: string): Promise<'COMPLETED' | 'FAILED' | 'PENDING'> {
  if (shouldThrottleQuery(checkoutRequestId, 5000)) {
    return 'PENDING';
  }
  const stored = await getStoredPaymentConfig();
  const secret = (stored.intasendSecretKey || process.env.INTASEND_SECRET_KEY || '').trim();
  if (!secret) return 'PENDING';

  const invoiceId = checkoutRequestId.replace(/^INTASEND_/, '');
  const base = secret.includes('_test_')
    ? 'https://sandbox.intasend.com'
    : 'https://payment.intasend.com';

  try {
    const res = await fetch(`${base}/api/v1/payment/status/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ invoice_id: invoiceId }),
      cache: 'no-store',
    });
    const json = await res.json();
    const state = json?.invoice?.state;
    if (state === 'COMPLETE') {
      await supabaseAdmin
        .from('orders')
        .update({
          status: 'COMPLETED',
          mpesa_receipt_number: json?.invoice?.mpesa_reference || invoiceId,
          updated_at: new Date().toISOString(),
        })
        .eq('checkout_request_id', checkoutRequestId);
      return 'COMPLETED';
    }
    if (state === 'FAILED' || state === 'CANCELED') {
      await supabaseAdmin
        .from('orders')
        .update({ status: 'FAILED', updated_at: new Date().toISOString() })
        .eq('checkout_request_id', checkoutRequestId);
      return 'FAILED';
    }
    return 'PENDING';
  } catch {
    return 'PENDING';
  }
}

async function queryDarajaStkStatus(checkoutRequestId: string): Promise<'COMPLETED' | 'FAILED' | 'PENDING'> {
  if (shouldThrottleQuery(checkoutRequestId, 6000)) {
    return 'PENDING';
  }

  try {
    const session = await getDarajaSession();
    const { shortCode, passkey } = session;

    const timestamp = getEatTimestamp();
    const password = Buffer.from(`${shortCode}${passkey}${timestamp}`).toString('base64');
    const queryUrl = `${session.baseUrl}/mpesa/stkpushquery/v1/query`;

    const queryRes = await fetch(queryUrl, {
      method: 'POST',
      headers: {
        ...DARAJA_HEADERS,
        Authorization: `Bearer ${session.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        BusinessShortCode: shortCode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId,
      }),
      cache: 'no-store',
    });

    const text = await queryRes.text();
    let data: Record<string, unknown> = {};
    try {
      data = JSON.parse(text);
    } catch {
      return 'PENDING';
    }

    const errCode = String(data.errorCode || '');
    const resCodeStr = data.ResultCode !== undefined ? String(data.ResultCode) : '';
    if (
      errCode === '500.001.1001' ||
      errCode === '500.002.1001' ||
      resCodeStr === '4999'
    ) {
      return 'PENDING';
    }

    if (data.ResultCode !== undefined) {
      if (resCodeStr === '0') {
        await supabaseAdmin
          .from('orders')
          .update({ status: 'COMPLETED', updated_at: new Date().toISOString() })
          .eq('checkout_request_id', checkoutRequestId);

        void sendWhatsAppAdminNotification(
          `✅ *M-PESA STK PAYMENT VERIFIED*\n• Order: ${checkoutRequestId}`
        );
        return 'COMPLETED';
      } else {
        await supabaseAdmin
          .from('orders')
          .update({ status: 'FAILED', updated_at: new Date().toISOString() })
          .eq('checkout_request_id', checkoutRequestId);
        return 'FAILED';
      }
    }

    return 'PENDING';
  } catch {
    return 'PENDING';
  }
}

export async function POST(req: Request) {
  try {
    const { checkoutRequestId } = await req.json();

    if (!checkoutRequestId) {
      return NextResponse.json({ error: 'checkoutRequestId is required' }, { status: 400 });
    }

    const idStr = String(checkoutRequestId);
    const { data: initialOrder } = await supabaseAdmin
      .from('orders')
      .select('status, resource_id, amount, phone_number, created_at')
      .eq('checkout_request_id', idStr)
      .maybeSingle();

    let order = initialOrder;

    // Self-heal if a PayHero STK order completed before DB row visibility
    if (!order && idStr.startsWith('PAYHERO_')) {
      const stored = await getStoredPaymentConfig();
      const rawToken = (stored.payheroAuthToken || process.env.PAYHERO_AUTH_TOKEN || '').trim();
      if (rawToken) {
        try {
          const reference = idStr.replace(/^PAYHERO_/, '');
          const phRes = await fetch(
            `https://backend.payhero.co.ke/api/v2/transaction-status?reference=${encodeURIComponent(
              reference
            )}`,
            {
              headers: { Authorization: formatPayHeroAuthHeader(rawToken) },
              cache: 'no-store',
            }
          );
          const phJson = await phRes.json();
          const st = String(phJson?.status || '').toUpperCase();
          if (st === 'SUCCESS' || st === 'COMPLETED') {
            const receipt = String(
              phJson?.provider_reference || phJson?.third_party_reference || reference
            ).slice(0, 40);
            const amt = Number(phJson?.amount) || 10;
            const phPhone = String(phJson?.phone_number || '254700000000');
            await supabaseAdmin.from('orders').upsert(
              {
                checkout_request_id: idStr,
                phone_number: phPhone,
                resource_id: null,
                amount: amt,
                mpesa_receipt_number: receipt,
                status: 'COMPLETED',
              },
              { onConflict: 'checkout_request_id' }
            );
            order = {
              status: 'COMPLETED',
              resource_id: null,
              amount: amt,
              phone_number: phPhone,
              created_at: new Date().toISOString(),
            };
          } else {
            return NextResponse.json({ status: 'PENDING', message: 'Processing' }, { status: 200 });
          }
        } catch {
          return NextResponse.json({ status: 'PENDING', message: 'Processing' }, { status: 200 });
        }
      }
    }

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    let currentStatus = order.status as string;

    if (currentStatus === 'PENDING') {
      if (idStr.startsWith('MANUAL_')) {
        // Direct M-Pesa receipt codes unlock as soon as approved in /admin
      } else if (idStr.startsWith('PAYHERO_')) {
        currentStatus = await verifyPayHeroOrder(idStr, Number(order.amount) || 0);
      } else if (idStr.startsWith('PAYSTACK_')) {
        currentStatus = await verifyPaystackOrder(idStr);
      } else if (idStr.startsWith('INTASEND_')) {
        currentStatus = await verifyIntaSendOrder(idStr);
      } else {
        const ageMs = order.created_at ? Date.now() - new Date(order.created_at).getTime() : 10000;
        if (ageMs >= 5000) {
          currentStatus = await queryDarajaStkStatus(idStr);
        }
      }
    }

    if (currentStatus !== 'COMPLETED') {
      return NextResponse.json({ status: currentStatus, message: 'Processing' }, { status: 200 });
    }

    const buyerName = await resolveBuyerMpesaName({
      checkoutRequestId: idStr,
      phone: order.phone_number,
    });

    if (!order.resource_id) {
      return NextResponse.json({
        status: 'COMPLETED',
        downloadUrl: '#',
        buyerName: buyerName || null,
      });
    }

    const { data: resource, error: resourceError } = await supabaseAdmin
      .from('resources')
      .select('*')
      .eq('id', order.resource_id)
      .single();

    if (resourceError || !resource) {
      return NextResponse.json({ error: 'Resource missing' }, { status: 404 });
    }

    const isStoredDocx =
      Boolean(resource.file_path?.toLowerCase().endsWith('.docx')) ||
      String(resource.format || '').toUpperCase() === 'DOCX';
    const companionBase = `/api/resources/companion-download?checkoutRequestId=${encodeURIComponent(
      idStr
    )}`;

    if (resource.file_path && !resource.file_path.startsWith('http')) {
      const { data: signedData, error: signedErr } = await supabaseAdmin.storage
        .from(BUCKET_NAME)
        .createSignedUrl(resource.file_path, 3600, {
          download: true,
        });

      if (!signedErr && signedData?.signedUrl) {
        return NextResponse.json({
          status: 'COMPLETED',
          buyerName: buyerName || null,
          downloadUrl: signedData.signedUrl,
          docxDownloadUrl: isStoredDocx ? signedData.signedUrl : `${companionBase}&format=docx`,
          pdfDownloadUrl: !isStoredDocx ? signedData.signedUrl : `${companionBase}&format=pdf`,
        });
      }
      console.error('Signed URL error:', signedErr?.message);
    }

    const fallbackUrl =
      resource.file_url ||
      resource.download_url ||
      (resource.file_path?.startsWith('http') ? resource.file_path : null);

    if (!fallbackUrl) {
      return NextResponse.json(
        { error: 'Document file is not yet attached in storage. Please contact support on WhatsApp.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: 'COMPLETED',
      buyerName: buyerName || null,
      downloadUrl: fallbackUrl,
      docxDownloadUrl: isStoredDocx ? fallbackUrl : `${companionBase}&format=docx`,
      pdfDownloadUrl: !isStoredDocx ? fallbackUrl : `${companionBase}&format=pdf`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unexpected server error';
    console.error('Download route crash:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
