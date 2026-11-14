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

    // Give webhook 8 seconds head start, then poll Daraja directly every 12s as fallback
    const ageMs = order.created_at ? Date.now() - new Date(order.created_at).getTime() : 10000;
    if (currentStatus === 'PENDING' && ageMs >= 8000) {
      currentStatus = await queryDarajaStkStatus(checkoutRequestId);
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
