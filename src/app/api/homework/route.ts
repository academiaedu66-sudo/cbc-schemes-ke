import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isAdminAuthorized } from '@/lib/admin-auth';
import {
  extractMpesaReceiptCode,
  getMerchantPhone,
  getWhatsAppPhone,
  normalizeKenyanPhone,
  resolvePublicOrigin,
  sendWhatsAppAdminNotification,
  shouldThrottleQuery,
  toLocalKenyanFormat,
} from '@/lib/mpesa';
import { formatPayHeroAuthHeader, getStoredPaymentConfig } from '@/lib/payment-config';
import { recordMonetizationEvent } from '@/lib/monetization';
import { recordPurchaseAttempt } from '@/lib/purchase-attempts';
import { triggerAutomaticBackup } from '@/lib/security';
import {
  activateWeeklySubscription,
  findActiveWeeklySubscription,
  generateAndStoreHomeworkAnswer,
  getHomeworkLedger,
  WEEKLY_SUBSCRIPTION_KES,
} from '@/lib/homework-qa';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const isAdmin = url.searchParams.get('admin') === '1';
  const token = url.searchParams.get('token') || '';
  const phone = url.searchParams.get('phone') || '';

  if (isAdmin) {
    if (!isAdminAuthorized(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const ledger = await getHomeworkLedger(true);
    return NextResponse.json({
      totalQuestionsAsked: ledger.totalQuestionsAsked,
      activeSubscribersCount: Object.values(ledger.subscriptionsByToken).filter(
        (s) => s.expiresAt > Date.now()
      ).length,
      recentAnswers: Object.values(ledger.answers)
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 25)
        .map((a) => ({
          answerId: a.answerId,
          fullName: a.fullName,
          gradeLabel: a.gradeLabel,
          subject: a.subject,
          question: a.question,
          unlocked: a.unlocked,
          createdAt: a.createdAt,
        })),
    });
  }

  try {
    const ledger = await getHomeworkLedger();
    const active = findActiveWeeklySubscription(ledger, token, phone);
    const merchantIntl = await getMerchantPhone();
    const waIntl = getWhatsAppPhone();

    return NextResponse.json({
      subscribed: Boolean(active),
      subscription: active
        ? {
            token: active.token,
            fullName: active.fullName,
            gradeLabel: active.gradeLabel,
            expiresAt: active.expiresAt,
          }
        : null,
      feeKes: WEEKLY_SUBSCRIPTION_KES,
      merchantLocalPhone: toLocalKenyanFormat(merchantIntl),
      whatsappPhone: waIntl,
    });
  } catch {
    return NextResponse.json({
      subscribed: false,
      feeKes: WEEKLY_SUBSCRIPTION_KES,
      merchantLocalPhone: '0728595160',
      whatsappPhone: '254728595160',
    });
  }
}

export async function POST(req: NextRequest) {
  void req.headers.get('user-agent');

  try {
    const body = (await req.json()) as {
      action?: 'ask' | 'submit_payment' | 'check_unlock';
      fullName?: string;
      gradeLabel?: string;
      subject?: string;
      question?: string;
      subscriptionToken?: string;
      phone?: string;
      answerId?: string;
      mpesaCode?: string;
      checkoutRequestId?: string;
    };

    const action = body.action || 'ask';

    // 1. GENERATE DETAILED ANSWER (VISIBLE HALFWAY UNLESS SUBSCRIBED)
    if (action === 'ask') {
      const fullName = (body.fullName || '').trim();
      const gradeLabel = (body.gradeLabel || '').trim();
      const subject = (body.subject || 'General CBC').trim();
      const question = (body.question || '').trim();

      if (!fullName || fullName.length < 2) {
        return NextResponse.json(
          { error: 'Please enter your Full Name first.' },
          { status: 400 }
        );
      }
      if (!gradeLabel) {
        return NextResponse.json(
          { error: 'Please select your Grade level.' },
          { status: 400 }
        );
      }
      if (!question || question.length < 3) {
        return NextResponse.json(
          { error: 'Please type your question so Gemini can answer it.' },
          { status: 400 }
        );
      }

      // Monetize every question interaction automatically!
      await recordMonetizationEvent({
        eventType: 'interaction',
        placement: 'gemini_qa_hub',
        interactionType: 'gemini_qa_question_asked',
      }).catch(() => {});

      const result = await generateAndStoreHomeworkAnswer({
        fullName,
        gradeLabel,
        subject,
        question,
        subscriptionToken: body.subscriptionToken,
        phone: body.phone,
      });

      void triggerAutomaticBackup(`Gemini Q&A generated for ${fullName} (${gradeLabel})`);

      return NextResponse.json({
        success: true,
        feeKes: WEEKLY_SUBSCRIPTION_KES,
        ...result,
      });
    }

    // 2. SUBMIT KSh 20 WEEKLY SUBSCRIPTION PAYMENT AFTER ANSWER IS GENERATED
    if (action === 'submit_payment') {
      const cleanCode = extractMpesaReceiptCode(body.mpesaCode || '');
      if (!cleanCode) {
        return NextResponse.json(
          {
            error:
              'Please paste a valid 10-character M-Pesa transaction code (e.g. SJK84M2P9Q) or full M-Pesa SMS after sending KSh 20 to 0728595160.',
          },
          { status: 400 }
        );
      }

      const fullName = (body.fullName || 'CBC Learner').trim();
      const gradeLabel = (body.gradeLabel || 'CBC').trim();
      const normalizedPhone =
        normalizeKenyanPhone(body.phone || '') ||
        (body.phone || '').trim() ||
        'DIRECT_MPESA';

      const checkoutRequestId = `GEMINI_WK_${cleanCode}`;
      const orderTitle = `Gemini Weekly Q&A Pass (7 Days) - ${fullName} (${gradeLabel})`;

      // Prevent duplicate receipt reuse across completed orders
      const { data: existingOrder } = await supabaseAdmin
        .from('orders')
        .select('*')
        .eq('checkout_request_id', checkoutRequestId)
        .maybeSingle();

      if (!existingOrder) {
        const { error: insertErr } = await supabaseAdmin.from('orders').insert({
          checkout_request_id: checkoutRequestId,
          phone_number: normalizedPhone,
          resource_id: null,
          amount: WEEKLY_SUBSCRIPTION_KES,
          mpesa_receipt_number: cleanCode,
          status: 'PENDING',
        });

        if (insertErr) {
          return NextResponse.json(
            { error: 'Could not submit M-Pesa code. Please try again.' },
            { status: 500 }
          );
        }
      }

      // Ring "Hello senior counsel Pinchez. Please check money." in Mobile Admin App!
      await Promise.all([
        recordPurchaseAttempt({
          channel: 'Ask Gemini (KSh 20 Weekly)',
          itemTitle: orderTitle,
          amountKes: WEEKLY_SUBSCRIPTION_KES,
          buyerPhone: normalizedPhone,
          stage: 'SUBMITTED_PAYMENT',
        }),
        recordMonetizationEvent({
          eventType: 'click',
          placement: 'gemini_qa_hub',
          interactionType: 'gemini_qa_unlock_click',
        }),
      ]).catch(() => {});

      const origin = resolvePublicOrigin(req);
      await sendWhatsAppAdminNotification(
        `🤖 *NEW KSh 20 GEMINI WEEKLY Q&A SUBSCRIPTION*\n` +
          `• *Learner:* ${fullName} (${gradeLabel})\n` +
          `• *M-Pesa Code:* ${cleanCode}\n` +
          `• *Amount:* KSh ${WEEKLY_SUBSCRIPTION_KES}\n` +
          `• *Phone:* ${normalizedPhone}\n` +
          `• *Approve in Mobile App:* ${origin}/mobile-admin`
      ).catch(() => false);

      return NextResponse.json({
        success: true,
        checkoutRequestId,
        receiptCode: cleanCode,
        status: existingOrder?.status || 'PENDING',
      });
    }

    // 3. POLL ORDER STATUS -> UNHIDE FULL ANSWER & MINT 7-DAY TOKEN WHEN APPROVED
    if (action === 'check_unlock') {
      const reqId = (body.checkoutRequestId || '').trim();
      if (!reqId) {
        return NextResponse.json({ status: 'IDLE' });
      }

      const { data: order } = await supabaseAdmin
        .from('orders')
        .select('*')
        .eq('checkout_request_id', reqId)
        .maybeSingle();

      if (!order) {
        return NextResponse.json({ status: 'PENDING' });
      }

      let orderStatus = order.status as string;
      let orderReceipt = order.mpesa_receipt_number as string | null;

      // Live PayHero status verification if webhook hasn't updated the row yet
      if (
        orderStatus === 'PENDING' &&
        reqId.startsWith('PAYHERO_') &&
        !shouldThrottleQuery(reqId, 900)
      ) {
        try {
          const stored = await getStoredPaymentConfig();
          const rawToken = (
            stored.payheroAuthToken ||
            process.env.PAYHERO_AUTH_TOKEN ||
            ''
          ).trim();
          if (rawToken) {
            const reference = reqId.replace(/^PAYHERO_/, '');
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
                phJson?.provider_reference ||
                  phJson?.third_party_reference ||
                  reference
              ).slice(0, 40);
              await supabaseAdmin
                .from('orders')
                .update({
                  status: 'COMPLETED',
                  mpesa_receipt_number: receipt,
                  updated_at: new Date().toISOString(),
                })
                .eq('checkout_request_id', reqId);
              orderStatus = 'COMPLETED';
              orderReceipt = receipt;
            } else if (st === 'FAILED' || st === 'CANCELLED' || st === 'CANCELED') {
              await supabaseAdmin
                .from('orders')
                .update({ status: 'FAILED', updated_at: new Date().toISOString() })
                .eq('checkout_request_id', reqId);
              orderStatus = 'FAILED';
            }
          }
        } catch {}
      }

      if (orderStatus === 'FAILED') {
        return NextResponse.json({
          status: 'FAILED',
          error:
            'M-Pesa payment was cancelled or could not be verified. Please retry STK Push or paste a valid M-Pesa code.',
        });
      }

      if (orderStatus === 'COMPLETED') {
        const { subscription, unlockedAnswer } = await activateWeeklySubscription({
          fullName: body.fullName || 'CBC Learner',
          gradeLabel: body.gradeLabel || 'CBC',
          phone: body.phone || order.phone_number || '',
          mpesaReceipt: orderReceipt || reqId,
          checkoutRequestId: reqId,
          answerId: body.answerId,
        });

        await recordMonetizationEvent({
          eventType: 'interaction',
          placement: 'gemini_qa_hub',
          interactionType: 'gemini_qa_unlocked_full',
        }).catch(() => {});

        void triggerAutomaticBackup(
          `Gemini Weekly Pass unlocked for ${subscription.fullName}`
        );

        const ledger = await getHomeworkLedger();
        const ans =
          unlockedAnswer ||
          (body.answerId ? ledger.answers[body.answerId] : undefined);

        return NextResponse.json({
          status: 'COMPLETED',
          subscriptionToken: subscription.token,
          expiresAt: subscription.expiresAt,
          fullAnswer: ans?.fullAnswer || null,
        });
      }

      return NextResponse.json({ status: 'PENDING' });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Request failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
