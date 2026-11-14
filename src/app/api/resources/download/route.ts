import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import {
  DARAJA_HEADERS,
  getDarajaAccessToken,
  getEatTimestamp,
  isMpesaProduction,
  shouldThrottleQuery,
} from '@/lib/mpesa';

const BUCKET_NAME = 'cbc-materials';

async function verifyPaystackOrder(checkoutRequestId: string): Promise<'COMPLETED' | 'FAILED' | 'PENDING'> {
  if (shouldThrottleQuery(checkoutRequestId, 4500)) {
    return 'PENDING';
  }
  const secret = (process.env.PAYSTACK_SECRET_KEY || '').trim();
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
  const secret = (process.env.INTASEND_SECRET_KEY || '').trim();
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
  // Throttle Daraja stkpushquery to at most once every 12s per order so Safaricom WAF never rate-limits
  if (shouldThrottleQuery(checkoutRequestId, 12000)) {
    return 'PENDING';
  }

  try {
    const token = await getDarajaAccessToken();
    const isProduction = isMpesaProduction();
    const shortCode = (process.env.MPESA_SHORTCODE || '174379').trim();
    const passkey = (
      process.env.MPESA_PASSKEY ||
      'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919'
    ).trim();

    const timestamp = getEatTimestamp();
    const password = Buffer.from(`${shortCode}${passkey}${timestamp}`).toString('base64');
    const queryUrl = isProduction
      ? 'https://api.safaricom.co.ke/mpesa/stkpushquery/v1/query'
      : 'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query';

    const queryRes = await fetch(queryUrl, {
      method: 'POST',
      headers: {
        ...DARAJA_HEADERS,
        Authorization: `Bearer ${token}`,
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

    // 500.001.1001 or ResultCode 4999 = still waiting for user PIN entry on handset
    if (data.errorCode === '500.001.1001' || String(data.ResultCode) === '4999') {
      return 'PENDING';
    }

    if (data.ResultCode !== undefined) {
      if (String(data.ResultCode) === '0') {
        await supabaseAdmin
          .from('orders')
          .update({ status: 'COMPLETED', updated_at: new Date().toISOString() })
          .eq('checkout_request_id', checkoutRequestId);
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

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('status, resource_id, created_at')
      .eq('checkout_request_id', checkoutRequestId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    let currentStatus = order.status as string;
    const idStr = String(checkoutRequestId);

    if (currentStatus === 'PENDING') {
      if (idStr.startsWith('MANUAL_')) {
        // Direct M-Pesa payments to 254728595160 unlock automatically as soon as approved in /admin
      } else if (idStr.startsWith('PAYSTACK_')) {
        currentStatus = await verifyPaystackOrder(idStr);
      } else if (idStr.startsWith('INTASEND_')) {
        currentStatus = await verifyIntaSendOrder(idStr);
      } else {
        // Safaricom Daraja STK Push fallback query after 8s head start
        const ageMs = order.created_at ? Date.now() - new Date(order.created_at).getTime() : 10000;
        if (ageMs >= 8000) {
          currentStatus = await queryDarajaStkStatus(idStr);
        }
      }
    }

    if (currentStatus !== 'COMPLETED') {
      return NextResponse.json({ status: currentStatus, message: 'Processing' }, { status: 200 });
    }

    const { data: resource, error: resourceError } = await supabaseAdmin
      .from('resources')
      .select('*')
      .eq('id', order.resource_id)
      .single();

    if (resourceError || !resource) {
      return NextResponse.json({ error: 'Resource missing' }, { status: 404 });
    }

    // Generate 1-hour signed download URL from private Supabase Storage bucket
    if (resource.file_path && !resource.file_path.startsWith('http')) {
      const { data: signedData, error: signedErr } = await supabaseAdmin.storage
        .from(BUCKET_NAME)
        .createSignedUrl(resource.file_path, 3600, {
          download: true,
        });

      if (!signedErr && signedData?.signedUrl) {
        return NextResponse.json({
          status: 'COMPLETED',
          downloadUrl: signedData.signedUrl,
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
      downloadUrl: fallbackUrl,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unexpected server error';
    console.error('Download route crash:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
