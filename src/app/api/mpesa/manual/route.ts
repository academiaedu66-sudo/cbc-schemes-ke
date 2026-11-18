import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import {
  extractMpesaReceiptCode,
  getMerchantPhone,
  getWhatsAppPhone,
  normalizeKenyanPhone,
  resolvePublicOrigin,
  sendWhatsAppAdminNotification,
  toLocalKenyanFormat,
} from '@/lib/mpesa';
import { recordPurchaseAttempt } from '@/lib/purchase-attempts';

export async function POST(req: Request) {
  void req.headers.get('user-agent');

  try {
    const { mpesaCode, phoneNumber, resourceId, serviceType, bookTitle } = await req.json();
    const cleanBookTitle = typeof bookTitle === 'string' ? bookTitle.trim().slice(0, 140) : '';

    await recordPurchaseAttempt({
      channel: 'M-Pesa Direct Code',
      itemTitle:
        cleanBookTitle ||
        serviceType ||
        (resourceId ? `Resource #${resourceId}` : 'M-Pesa Submission'),
      buyerPhone: phoneNumber ? String(phoneNumber) : undefined,
      stage: 'SUBMITTED_PAYMENT',
    }).catch(() => {});

    const cleanCode = extractMpesaReceiptCode(mpesaCode || '');

    if (!cleanCode) {
      return NextResponse.json(
        {
          error:
            'Please paste a valid 10-character M-Pesa transaction code (e.g. SJK84M2P9Q) or paste the full M-Pesa confirmation SMS.',
        },
        { status: 400 }
      );
    }

    if (!resourceId && !serviceType) {
      return NextResponse.json({ error: 'Selection is required.' }, { status: 400 });
    }

    const phone =
      normalizeKenyanPhone(phoneNumber || '') ||
      String(phoneNumber || 'DIRECT_MPESA').trim() ||
      'DIRECT_MPESA';

    let resource: { id: string | null; price: number; title: string };

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
    } else if (serviceType === 'SUBJECT_GAMING') {
      resource = {
        id: null,
        price: 10,
        title: 'CBC Subject Gaming 20-Minute Pass (KSh 10)',
      };
    } else if (serviceType === 'GEMINI_WEEKLY') {
      resource = {
        id: null,
        price: 20,
        title: 'Gemini Weekly Q&A Pass — 7 Days (KSh 20 Bob)',
      };
    } else if (serviceType === 'BOOK_GRADE_UP') {
      resource = {
        id: null,
        price: 500,
        title: cleanBookTitle || 'CBC GRADE UP — 50-Page Book + Marking Schemes (KSh 500)',
      };
    } else if (serviceType === 'BOOK_MADE_FAMILIAR') {
      resource = {
        id: null,
        price: 750,
        title:
          cleanBookTitle ||
          'SUPER-LIGHT CBC COMPILATION — 50-Page Point-Form Notes + Q&A (KSh 750)',
      };
    } else if (serviceType === 'BOOK_COMPLETE_BUNDLE') {
      resource = {
        id: null,
        price: 1500,
        title:
          cleanBookTitle ||
          'SMART CBC ALL SUBJECTS — 100-Page Master Book + All Grade Subjects (KSh 1,500)',
      };
    } else {
      const { data: dbRes, error: resErr } = await supabaseAdmin
        .from('resources')
        .select('id, price, title')
        .eq('id', resourceId)
        .single();

      if (resErr || !dbRes) {
        return NextResponse.json({ error: 'Selected material not found.' }, { status: 404 });
      }
      resource = dbRes;
    }

    const amountKes = Math.round(Number(resource.price) || 50);
    const merchantLocal = toLocalKenyanFormat(getMerchantPhone()); // 0728595160
    const whatsappIntl = getWhatsAppPhone(); // 254705759072
    const origin = resolvePublicOrigin(req);

    const notificationText =
      `🔔 *NEW CBC ORDER PAID*\n` +
      `• *M-Pesa Code:* ${cleanCode}\n` +
      `• *Amount Sent (to ${merchantLocal}):* KES ${amountKes}\n` +
      `• *Buyer Phone:* ${phone}\n` +
      `• *Material:* ${resource.title}\n` +
      `• *Approve Unlock:* ${origin}/mobile-admin`;

    const whatsappNotificationUrl = `https://wa.me/${whatsappIntl}?text=${encodeURIComponent(
      notificationText
    )}`;

    // Prevent reusing an already used M-Pesa receipt code across different materials
    const { data: existingReceipt } = await supabaseAdmin
      .from('orders')
      .select('id, status, checkout_request_id, resource_id')
      .eq('mpesa_receipt_number', cleanCode)
      .maybeSingle();

    if (existingReceipt) {
      if (existingReceipt.resource_id === resource.id && existingReceipt.status !== 'FAILED') {
        return NextResponse.json({
          checkoutRequestId: existingReceipt.checkout_request_id,
          receiptCode: cleanCode,
          whatsappNotificationUrl,
          message: 'M-Pesa code recognized — checking verification status...',
        });
      }
      return NextResponse.json(
        { error: 'This M-Pesa transaction code has already been used on another order.' },
        { status: 400 }
      );
    }

    const checkoutRequestId = `MANUAL_${cleanCode}_${Date.now()}`;

    const { error: insertErr } = await supabaseAdmin.from('orders').insert({
      checkout_request_id: checkoutRequestId,
      phone_number: phone,
      resource_id: resource.id,
      amount: amountKes,
      mpesa_receipt_number: cleanCode,
      status: 'PENDING',
    });

    if (insertErr) {
      throw new Error(insertErr.message);
    }

    const autoDelivered = await sendWhatsAppAdminNotification(notificationText);

    return NextResponse.json({
      checkoutRequestId,
      receiptCode: cleanCode,
      whatsappNotificationUrl,
      autoDelivered,
      message: `M-Pesa code ${cleanCode} submitted! Unlocking as soon as payment to ${merchantLocal} is confirmed...`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to submit M-Pesa code';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
