import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

async function getAccessToken() {
  const consumerKey = (process.env.MPESA_CONSUMER_KEY || '').trim();
  const consumerSecret = (process.env.MPESA_CONSUMER_SECRET || '').trim();
  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

  const tokenUrl =
    process.env.MPESA_ENVIRONMENT === 'production'
      ? 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
      : 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';

  const res = await fetch(tokenUrl, {
    method: 'GET',
    headers: {
      Authorization: `Basic ${auth}`,
      Accept: 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Token request failed: ${errorText}`);
  }

  const data = await res.json();
  return data.access_token;
}

export async function POST(req: Request) {
  try {
    const { phoneNumber, resourceId } = await req.json();

    if (!phoneNumber || !resourceId) {
      return NextResponse.json({ error: 'Phone number and resource are required' }, { status: 400 });
    }

    // 1. Fetch resource and actual price from Supabase
    const { data: resource, error: resourceError } = await supabaseAdmin
      .from('resources')
      .select('id, price, title')
      .eq('id', resourceId)
      .single();

    if (resourceError || !resource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    // 2. Format phone to 254XXXXXXXXX
    let phone = phoneNumber.toString().trim().replace(/[^0-9]/g, '');
    if (phone.startsWith('0')) {
      phone = '254' + phone.substring(1);
    } else if (!phone.startsWith('254') && phone.length === 9) {
      phone = '254' + phone;
    }

    // Production or Sandbox Credentials from environment
    const isProduction = process.env.MPESA_ENVIRONMENT === 'production';
    const shortCode = (process.env.MPESA_SHORTCODE || '174379').trim();
    const passkey = (process.env.MPESA_PASSKEY || 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919').trim();

    // 3. Format timestamp YYYYMMDDHHmmss in East Africa Time (EAT - UTC+3)
    const now = new Date();
    const kenyaOffset = 3 * 60;
    const localOffset = now.getTimezoneOffset();
    const eatDate = new Date(now.getTime() + (kenyaOffset + localOffset) * 60000);

    const year = eatDate.getFullYear();
    const month = String(eatDate.getMonth() + 1).padStart(2, '0');
    const day = String(eatDate.getDate()).padStart(2, '0');
    const hours = String(eatDate.getHours()).padStart(2, '0');
    const minutes = String(eatDate.getMinutes()).padStart(2, '0');
    const seconds = String(eatDate.getSeconds()).padStart(2, '0');
    const timestamp = `${year}${month}${day}${hours}${minutes}${seconds}`;

    const password = Buffer.from(`${shortCode}${passkey}${timestamp}`).toString('base64');
    const token = await getAccessToken();

    const stkUrl = isProduction
      ? 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
      : 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';

    // Must be your public deployed domain URL in production
    const callbackUrl = (process.env.MPESA_CALLBACK_URL || '').trim();

    // If using Till Number (Buy Goods), TransactionType is CustomerBuyGoodsOnline
    // If using Paybill, TransactionType is CustomerPayBillOnline
    const transactionType = process.env.MPESA_TRANSACTION_TYPE || 'CustomerPayBillOnline';

    const actualAmount = Math.round(Number(resource.price) || 1).toString();

    const payload = {
      BusinessShortCode: shortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: transactionType,
      Amount: actualAmount,
      PartyA: phone,
      PartyB: shortCode,
      PhoneNumber: phone,
      CallBackURL: callbackUrl,
      AccountReference: 'CBCHUB',
      TransactionDesc: resource.title ? resource.title.substring(0, 12) : 'CBCMaterial',
    };

    const darajaRes = await fetch(stkUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const resText = await darajaRes.text();
    let responseData: any = {};
    try {
      responseData = JSON.parse(resText);
    } catch {
      responseData = { message: resText };
    }

    if (!darajaRes.ok) {
      return NextResponse.json(
        { error: responseData.errorMessage || responseData.ResponseDescription || 'STK Push failed' },
        { status: darajaRes.status }
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
  } catch (err: any) {
    console.error('STK Push Error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}