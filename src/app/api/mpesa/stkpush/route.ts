import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import {
  DARAJA_HEADERS,
  getDarajaAccessToken,
  getEatTimestamp,
  isMpesaProduction,
  normalizeKenyanPhone,
  resolveCallbackUrl,
} from '@/lib/mpesa';

export async function POST(req: Request) {
  try {
    const { phoneNumber, resourceId } = await req.json();

    if (!phoneNumber || !resourceId) {
      return NextResponse.json(
        { error: 'Phone number and material selection are required.' },
        { status: 400 }
      );
    }

    const phone = normalizeKenyanPhone(phoneNumber);
    if (!phone) {
      return NextResponse.json(
        { error: 'Enter a valid Safaricom number (e.g. 0712345678 or 0112345678).' },
        { status: 400 }
      );
    }

    // 1. Fetch resource and actual price from Supabase
    const { data: resource, error: resourceError } = await supabaseAdmin
      .from('resources')
      .select('id, price, title')
      .eq('id', resourceId)
      .single();

    if (resourceError || !resource) {
      return NextResponse.json(
        { error: 'Selected material was not found. Please refresh the page and try again.' },
        { status: 404 }
      );
    }

    const isProduction = isMpesaProduction();
    const shortCode = (process.env.MPESA_SHORTCODE || '174379').trim();
    const partyB = (process.env.MPESA_PARTY_B || shortCode).trim();
    const passkey = (
      process.env.MPESA_PASSKEY ||
      'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919'
    ).trim();

    const timestamp = getEatTimestamp();
    const password = Buffer.from(`${shortCode}${passkey}${timestamp}`).toString('base64');
    const token = await getDarajaAccessToken();

    const stkUrl = isProduction
      ? 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
      : 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';

    const callbackUrl = resolveCallbackUrl(req);
    if (!callbackUrl || !callbackUrl.startsWith('https://')) {
      return NextResponse.json(
        { error: 'MPESA_CALLBACK_URL must be a valid https:// URL.' },
        { status: 500 }
      );
    }

    const transactionType = process.env.MPESA_TRANSACTION_TYPE || 'CustomerPayBillOnline';
    const actualAmount = Math.max(1, Math.round(Number(resource.price) || 1)).toString();

    // Keep TransactionDesc strictly alphanumeric (max 12 chars) so Daraja never rejects special chars
    const cleanDesc =
      (resource.title || 'CBCMaterial').replace(/[^a-zA-Z0-9]/g, '').slice(0, 12) || 'CBCMaterial';

    const payload = {
      BusinessShortCode: shortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: transactionType,
      Amount: actualAmount,
      PartyA: phone,
      PartyB: partyB,
      PhoneNumber: phone,
      CallBackURL: callbackUrl,
      AccountReference: 'CBCHUB',
      TransactionDesc: cleanDesc,
    };

    const darajaRes = await fetch(stkUrl, {
      method: 'POST',
      headers: {
        ...DARAJA_HEADERS,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    const resText = await darajaRes.text();
    let responseData: Record<string, string> = {};
    try {
      responseData = JSON.parse(resText);
    } catch {
      if (resText.includes('Incapsula') || resText.includes('<html')) {
        return NextResponse.json(
          { error: 'Safaricom gateway is busy. Please wait 5 seconds and try again.' },
          { status: 503 }
        );
      }
      responseData = { errorMessage: resText.slice(0, 160) };
    }

    if (!darajaRes.ok || responseData.ResponseCode !== '0') {
      return NextResponse.json(
        {
          error:
            responseData.errorMessage ||
            responseData.ResponseDescription ||
            'Safaricom rejected the STK push request.',
        },
        { status: darajaRes.ok ? 400 : darajaRes.status }
      );
    }

    const checkoutRequestId = responseData.CheckoutRequestID;

    // Record pending order in Supabase
    await supabaseAdmin.from('orders').insert({
      checkout_request_id: checkoutRequestId,
      phone_number: phone,
      resource_id: resource.id,
      amount: Number(actualAmount),
      status: 'PENDING',
    });

    return NextResponse.json({
      message: 'STK PIN prompt sent to your phone.',
      checkoutRequestId,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unexpected M-Pesa error';
    console.error('STK Push Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
