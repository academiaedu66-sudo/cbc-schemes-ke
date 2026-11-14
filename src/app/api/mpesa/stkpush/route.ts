import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import {
  DARAJA_HEADERS,
  getActivePaymentProvider,
  getDarajaAccessToken,
  getEatTimestamp,
  getMerchantPhone,
  getWhatsAppPhone,
  isMpesaProduction,
  normalizeKenyanPhone,
  resolveCallbackUrl,
  resolvePublicOrigin,
  sendWhatsAppAdminNotification,
  toLocalKenyanFormat,
} from '@/lib/mpesa';

export async function GET() {
  const provider = getActivePaymentProvider();
  const merchantPhone = getMerchantPhone(); // 254728595160 (M-Pesa collection)
  const whatsappPhone = getWhatsAppPhone(); // 254705759072 (WhatsApp inbox)
  return NextResponse.json({
    provider,
    liveStkReady: provider !== 'daraja_sandbox',
    merchantPhone,
    merchantLocalPhone: toLocalKenyanFormat(merchantPhone),
    whatsappPhone,
    whatsappLocalPhone: toLocalKenyanFormat(whatsappPhone),
  });
}

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

    const actualAmountNum = Math.max(1, Math.round(Number(resource.price) || 1));
    const provider = getActivePaymentProvider();
    const merchantPhone = getMerchantPhone();
    const origin = resolvePublicOrigin(req);

    // =========================================================================
    // PROVIDER 1: PAYSTACK KENYA (Live STK Push -> Settles directly to 254728595160)
    // =========================================================================
    if (provider === 'paystack') {
      const paystackKey = (process.env.PAYSTACK_SECRET_KEY || '').trim();
      const reference = `CBCHUB_${Date.now()}_${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

      const psRes = await fetch('https://api.paystack.co/charge', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${paystackKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: `${phone}@cbchub.co.ke`,
          amount: actualAmountNum * 100,
          currency: 'KES',
          reference,
          mobile_money: {
            phone: `+${phone}`,
            provider: 'mpesa',
          },
          metadata: {
            resource_id: resource.id,
            resource_title: resource.title,
            payout_mpesa: merchantPhone,
          },
        }),
        cache: 'no-store',
      });

      const psData = await psRes.json();
      if (!psRes.ok || !psData?.status) {
        return NextResponse.json(
          { error: psData?.message || 'Paystack M-Pesa STK charge could not be initiated.' },
          { status: 400 }
        );
      }

      const checkoutRequestId = `PAYSTACK_${psData.data?.reference || reference}`;
      await supabaseAdmin.from('orders').insert({
        checkout_request_id: checkoutRequestId,
        phone_number: phone,
        resource_id: resource.id,
        amount: actualAmountNum,
        status: 'PENDING',
      });

      void sendWhatsAppAdminNotification(
        `📲 *STK PUSH INITIATED (KES ${actualAmountNum})*\n• Buyer: ${phone}\n• Material: ${resource.title}\n• Admin: ${origin}/admin`
      );

      return NextResponse.json({
        message: 'M-Pesa STK PIN prompt sent to your phone.',
        checkoutRequestId,
        provider,
        isSandbox: false,
      });
    }

    // =========================================================================
    // PROVIDER 2: INTASEND KENYA (Live STK Push -> Withdraws directly to 254728595160)
    // =========================================================================
    if (provider === 'intasend') {
      const intasendSecret = (process.env.INTASEND_SECRET_KEY || '').trim();
      const isTest = intasendSecret.includes('_test_');
      const intasendBase = isTest
        ? 'https://sandbox.intasend.com'
        : 'https://payment.intasend.com';

      const isRes = await fetch(`${intasendBase}/api/v1/payment/mpesa-stk-push/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${intasendSecret}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: actualAmountNum,
          phone_number: phone,
          api_ref: `CBCHUB_${Date.now()}`,
          narrative: (resource.title || 'CBC Material').slice(0, 35),
        }),
        cache: 'no-store',
      });

      const isData = await isRes.json();
      const invoiceId = isData?.invoice?.invoice_id || isData?.id;
      if (!isRes.ok || !invoiceId) {
        return NextResponse.json(
          { error: isData?.errors?.[0]?.detail || 'IntaSend M-Pesa STK push failed.' },
          { status: 400 }
        );
      }

      const checkoutRequestId = `INTASEND_${invoiceId}`;
      await supabaseAdmin.from('orders').insert({
        checkout_request_id: checkoutRequestId,
        phone_number: phone,
        resource_id: resource.id,
        amount: actualAmountNum,
        status: 'PENDING',
      });

      void sendWhatsAppAdminNotification(
        `📲 *STK PUSH INITIATED (KES ${actualAmountNum})*\n• Buyer: ${phone}\n• Material: ${resource.title}\n• Admin: ${origin}/admin`
      );

      return NextResponse.json({
        message: 'M-Pesa STK PIN prompt sent to your phone.',
        checkoutRequestId,
        provider,
        isSandbox: isTest,
      });
    }

    // =========================================================================
    // PROVIDER 3: SAFARICOM DARAJA (Live Till/Paybill or Sandbox)
    // =========================================================================
    const isProduction = isMpesaProduction();
    const shortCode = (process.env.MPESA_SHORTCODE || '174379').trim();
    const partyB = (process.env.MPESA_PARTY_B || shortCode).trim();

    if (/^(254|0)[17]\d{8}$/.test(shortCode) || /^(254|0)[17]\d{8}$/.test(partyB)) {
      return NextResponse.json(
        {
          error: `Safaricom Daraja STK Push does not allow a personal mobile number (${partyB}) as ShortCode/PartyB. Use the "Direct M-Pesa to ${toLocalKenyanFormat(merchantPhone)}" tab or configure PAYSTACK_SECRET_KEY / a Buy Goods Till.`,
        },
        { status: 400 }
      );
    }

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
    const actualAmount = actualAmountNum.toString();

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

    await supabaseAdmin.from('orders').insert({
      checkout_request_id: checkoutRequestId,
      phone_number: phone,
      resource_id: resource.id,
      amount: actualAmountNum,
      status: 'PENDING',
    });

    return NextResponse.json({
      message: 'STK PIN prompt sent to your phone.',
      checkoutRequestId,
      provider,
      isSandbox: !isProduction,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unexpected M-Pesa error';
    console.error('STK Push Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
