import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import {
  DARAJA_HEADERS,
  getDarajaSession,
  getEatTimestamp,
  getWhatsAppPhone,
  normalizeKenyanPhone,
  resolveActiveGatewaySummary,
  resolveCallbackUrl,
  resolvePublicOrigin,
  sendWhatsAppAdminNotification,
  toLocalKenyanFormat,
} from '@/lib/mpesa';
import { formatPayHeroAuthHeader, getStoredPaymentConfig } from '@/lib/payment-config';

export async function GET(req: Request) {
  const summary = await resolveActiveGatewaySummary();
  const whatsappPhone = getWhatsAppPhone();
  const callbackUrl = resolveCallbackUrl(req);
  return NextResponse.json({
    provider: summary.provider,
    settlesTo0728595160: summary.settlesTo0728595160,
    liveStkReady: true,
    callbackUrl,
    merchantPhone: summary.recipientMpesa,
    merchantLocalPhone: summary.recipientLocal,
    whatsappPhone,
    whatsappLocalPhone: toLocalKenyanFormat(whatsappPhone),
  });
}

export async function POST(req: Request) {
  try {
    const { phoneNumber, resourceId, testAmount, serviceType } = await req.json();

    if (!phoneNumber || (!resourceId && !testAmount && !serviceType)) {
      return NextResponse.json(
        { error: 'Phone number and selection are required.' },
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

    let resource: { id: string | null; price: number; title: string } = {
      id: null,
      price: Number(testAmount) || 10,
      title: 'CBC Live M-Pesa Test',
    };

    if (serviceType === 'LEARNER_TUITION') {
      resource = {
        id: null,
        price: 1000,
        title: 'Student Holiday / Personal Teacher Booking (KSh 1,000)',
      };
    } else if (serviceType === 'TEACHER_TUITION') {
      resource = {
        id: null,
        price: 500,
        title: 'Teacher Holiday / Personal Tuition Registration (KSh 500)',
      };
    } else if (resourceId) {
      const { data: dbRes, error: resourceError } = await supabaseAdmin
        .from('resources')
        .select('id, price, title')
        .eq('id', resourceId)
        .single();

      if (resourceError || !dbRes) {
        return NextResponse.json(
          { error: 'Selected material was not found. Please refresh the page and try again.' },
          { status: 404 }
        );
      }
      resource = dbRes;
    }

    const actualAmountNum = Math.max(1, Math.round(Number(resource.price) || 1));
    const stored = await getStoredPaymentConfig();
    const summary = await resolveActiveGatewaySummary();
    const provider = summary.provider;
    const merchantPhone = summary.recipientMpesa;
    const callbackUrl = resolveCallbackUrl(req);
    const origin = resolvePublicOrigin(req);

    // =========================================================================
    // PROVIDER 1: PAYHERO KENYA (Instant STK Push -> Pochi / Till / M-Pesa 0728595160)
    // =========================================================================
    if (provider === 'payhero') {
      const rawToken = (stored.payheroAuthToken || process.env.PAYHERO_AUTH_TOKEN || '').trim();
      const channelId = Number(
        (stored.payheroChannelId || process.env.PAYHERO_CHANNEL_ID || '').trim()
      );
      const externalRef = `CBCHUB_${Date.now()}_${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

      const phRes = await fetch('https://backend.payhero.co.ke/api/v2/payments', {
        method: 'POST',
        headers: {
          Authorization: formatPayHeroAuthHeader(rawToken),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: actualAmountNum,
          phone_number: phone,
          channel_id: channelId,
          provider: 'm-pesa',
          external_reference: externalRef,
          customer_name: 'CBC Teacher',
          callback_url: callbackUrl,
        }),
        cache: 'no-store',
      });

      const phData = await phRes.json();
      if (!phRes.ok || phData?.success === false) {
        return NextResponse.json(
          {
            error:
              phData?.error_message ||
              phData?.message ||
              'PayHero M-Pesa STK Push could not be initiated. Verify your Channel ID & Auth Token in /admin.',
          },
          { status: 400 }
        );
      }

      const trackingRef = phData?.reference || externalRef;
      const checkoutRequestId = `PAYHERO_${trackingRef}`;

      await supabaseAdmin.from('orders').insert({
        checkout_request_id: checkoutRequestId,
        phone_number: phone,
        resource_id: resource.id,
        amount: actualAmountNum,
        status: 'PENDING',
      });

      await sendWhatsAppAdminNotification(
        `📲 *STK PUSH SENT TO ${phone} (KES ${actualAmountNum})*\n• Destination: ${summary.recipientLocal}\n• Material: ${resource.title}`
      );

      return NextResponse.json({
        message: 'M-Pesa STK PIN prompt sent to your phone.',
        checkoutRequestId,
        provider,
      });
    }

    // =========================================================================
    // PROVIDER 2: PAYSTACK KENYA (Live STK Push -> Settles to 0728595160)
    // =========================================================================
    if (provider === 'paystack') {
      const paystackKey = (
        stored.paystackSecretKey ||
        process.env.PAYSTACK_SECRET_KEY ||
        ''
      ).trim();
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

      await sendWhatsAppAdminNotification(
        `📲 *STK PUSH INITIATED (KES ${actualAmountNum})*\n• Buyer: ${phone}\n• Material: ${resource.title}\n• Admin: ${origin}/admin`
      );

      return NextResponse.json({
        message: 'M-Pesa STK PIN prompt sent to your phone.',
        checkoutRequestId,
        provider,
      });
    }

    // =========================================================================
    // PROVIDER 3: INTASEND KENYA
    // =========================================================================
    if (provider === 'intasend') {
      const intasendSecret = (
        stored.intasendSecretKey ||
        process.env.INTASEND_SECRET_KEY ||
        ''
      ).trim();
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

      await sendWhatsAppAdminNotification(
        `📲 *STK PUSH INITIATED (KES ${actualAmountNum})*\n• Buyer: ${phone}\n• Material: ${resource.title}\n• Admin: ${origin}/admin`
      );

      return NextResponse.json({
        message: 'M-Pesa STK PIN prompt sent to your phone.',
        checkoutRequestId,
        provider,
      });
    }

    // =========================================================================
    // PROVIDER 4: SAFARICOM DARAJA STK EXPRESS
    // =========================================================================
    const session = await getDarajaSession();
    const { shortCode, partyB, passkey } = session;

    if (/^(254|0)[17]\d{8}$/.test(shortCode) || /^(254|0)[17]\d{8}$/.test(partyB)) {
      return NextResponse.json(
        {
          error: `Safaricom Daraja requires a Business ShortCode/Till (or PayHero Channel ID in /admin) rather than a 10-digit personal number.`,
        },
        { status: 400 }
      );
    }

    const timestamp = getEatTimestamp();
    const password = Buffer.from(`${shortCode}${passkey}${timestamp}`).toString('base64');
    const stkUrl = `${session.baseUrl}/mpesa/stkpush/v1/processrequest`;

    const defaultTxType =
      partyB !== shortCode ? 'CustomerBuyGoodsOnline' : 'CustomerPayBillOnline';
    const transactionType = (process.env.MPESA_TRANSACTION_TYPE || defaultTxType).trim();
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
        Authorization: `Bearer ${session.token}`,
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

    if (!darajaRes.ok || String(responseData.ResponseCode) !== '0') {
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

    await sendWhatsAppAdminNotification(
      `📲 *STK PUSH SENT (KES ${actualAmountNum})*\n• Buyer: ${phone}\n• Material: ${resource.title}\n• Admin: ${origin}/admin`
    );

    return NextResponse.json({
      message: 'M-Pesa STK PIN prompt sent to your phone.',
      checkoutRequestId,
      provider,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unexpected M-Pesa error';
    console.error('STK Push Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
