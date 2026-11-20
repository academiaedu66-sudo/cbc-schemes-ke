import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthorized } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase';
import { triggerAutomaticBackup } from '@/lib/security';
import {
  normalizeKenyanPhone,
  resolvePublicOrigin,
  sendWhatsAppAdminNotification,
} from '@/lib/mpesa';
import {
  convertUsdToKes,
  DONATION_METHOD_LABELS,
  DONATION_REMITTANCE_MPESA_E164,
  DONATION_SUPPORT_WHATSAPP_INTL,
  DONATION_SUPPORT_WHATSAPP_LOCAL,
  getDonationsLedger,
  MIN_DONATION_USD,
  saveDonationsLedger,
  SINGLE_STK_MAX_KES,
  type DonationPaymentMethod,
  type LearnerDonationRecord,
} from '@/lib/donations';

const VALID_METHODS: DonationPaymentMethod[] = [
  'DIRECT_STK_BANK',
  'REMITLY',
  'SENDWAVE',
  'WORLDREMIT',
  'PAYPAL',
  'INTERNATIONAL_BANK_TRANSFER',
];

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const ledger = await getDonationsLedger();

  // Sync any pending STK donations against `orders` table automatically
  const pendingIds = ledger.donations
    .flatMap((d) => [d.checkoutRequestId, d.bankSweepCheckoutId])
    .filter((x): x is string => Boolean(x));

  if (pendingIds.length > 0) {
    const { data: paidOrders } = await supabaseAdmin
      .from('orders')
      .select('checkout_request_id, status')
      .in('checkout_request_id', pendingIds)
      .eq('status', 'COMPLETED');

    const completedSet = new Set(
      (paidOrders || []).map((o) => String(o.checkout_request_id))
    );
    let mutated = false;
    for (const d of ledger.donations) {
      if (
        d.status !== 'COMPLETED_IN_BANK' &&
        ((d.checkoutRequestId && completedSet.has(d.checkoutRequestId)) ||
          (d.bankSweepCheckoutId && completedSet.has(d.bankSweepCheckoutId)))
      ) {
        d.status = 'COMPLETED_IN_BANK';
        d.updatedAt = new Date().toISOString();
        mutated = true;
      }
    }
    if (mutated) {
      await saveDonationsLedger(ledger);
    }
  }

  if (searchParams.get('admin') === '1') {
    if (!isAdminAuthorized(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const completed = ledger.donations.filter(
      (d) => d.status === 'COMPLETED_IN_BANK'
    );
    return NextResponse.json({
      ok: true,
      settings: ledger.settings,
      donations: ledger.donations,
      summary: {
        totalRecords: ledger.donations.length,
        completedCount: completed.length,
        completedUsd: completed.reduce((s, d) => s + (d.amountUsd || 0), 0),
        completedKes: completed.reduce((s, d) => s + (d.amountKes || 0), 0),
        pledgedUsd: ledger.donations.reduce((s, d) => s + (d.amountUsd || 0), 0),
      },
    });
  }

  const completedCount = ledger.donations.filter(
    (d) => d.status === 'COMPLETED_IN_BANK'
  ).length;

  return NextResponse.json({
    ok: true,
    usdToKesRate: ledger.settings.usdToKesRate,
    minDonationUsd: MIN_DONATION_USD,
    singleStkMaxKes: SINGLE_STK_MAX_KES,
    remittanceMpesaE164: DONATION_REMITTANCE_MPESA_E164,
    whatsappSupportLocal: DONATION_SUPPORT_WHATSAPP_LOCAL,
    whatsappSupportIntl: DONATION_SUPPORT_WHATSAPP_INTL,
    completedDonationsCount: completedCount,
  });
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  const action = String(body.action || 'create_donation_request');
  const ledger = await getDonationsLedger();
  const origin = resolvePublicOrigin(req);

  // =========================================================================
  // ADMIN ACTIONS: save_settings | update_status | admin_sweep_to_bank
  // =========================================================================
  if (
    action === 'save_settings' ||
    action === 'update_status' ||
    action === 'admin_sweep_to_bank'
  ) {
    if (!isAdminAuthorized(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (action === 'save_settings') {
      const cfg = (body.settings || {}) as Record<string, unknown>;
      if (typeof cfg.usdToKesRate === 'number' && cfg.usdToKesRate >= 50) {
        ledger.settings.usdToKesRate = Math.round(cfg.usdToKesRate);
      }
      if (typeof cfg.paypalHandleOrUrl === 'string') {
        ledger.settings.paypalHandleOrUrl = cfg.paypalHandleOrUrl.trim();
      }
      if (typeof cfg.bankName === 'string' && cfg.bankName.trim()) {
        ledger.settings.bankName = cfg.bankName.trim();
      }
      if (typeof cfg.bankAccountName === 'string' && cfg.bankAccountName.trim()) {
        ledger.settings.bankAccountName = cfg.bankAccountName.trim();
      }
      if (typeof cfg.bankAccountNumber === 'string') {
        ledger.settings.bankAccountNumber = cfg.bankAccountNumber.trim();
      }
      if (typeof cfg.bankSwiftBic === 'string') {
        ledger.settings.bankSwiftBic = cfg.bankSwiftBic.trim();
      }
      if (typeof cfg.bankBranch === 'string') {
        ledger.settings.bankBranch = cfg.bankBranch.trim();
      }
      if (typeof cfg.autoTriggerBankSweepOnRemittanceConfirm === 'boolean') {
        ledger.settings.autoTriggerBankSweepOnRemittanceConfirm =
          cfg.autoTriggerBankSweepOnRemittanceConfirm;
      }

      const saved = await saveDonationsLedger(ledger);
      return NextResponse.json({
        ok: true,
        message: 'Saved International Donation & Remittance-to-Bank settings!',
        settings: saved.settings,
      });
    }

    if (action === 'update_status') {
      const id = String(body.id || '');
      const status = String(body.status || '') as LearnerDonationRecord['status'];
      const rec = ledger.donations.find((d) => d.id === id);
      if (!rec) {
        return NextResponse.json({ error: 'Donation not found' }, { status: 404 });
      }
      rec.status = status;
      rec.updatedAt = new Date().toISOString();
      await saveDonationsLedger(ledger);
      return NextResponse.json({ ok: true, donation: rec });
    }

    if (action === 'admin_sweep_to_bank') {
      const id = String(body.id || '');
      const rec = ledger.donations.find((d) => d.id === id);
      if (!rec) {
        return NextResponse.json({ error: 'Donation not found' }, { status: 404 });
      }

      const stkRes = await fetch(`${origin}/api/mpesa/stkpush`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: DONATION_SUPPORT_WHATSAPP_INTL, // 254728595160 -> sweeps remittance directly into Bank Channel #15443!
          serviceType: 'LEARNER_DONATION',
          donationAmountUsd: rec.amountUsd,
          donationAmountKes: rec.amountKes,
          buyerName: `${rec.donorName} (${rec.method})`,
          bookTitle: `Remittance Bank Sweep ${rec.referenceCode} (${rec.method} $${rec.amountUsd})`,
        }),
      });
      const stkData = await stkRes.json();
      if (!stkRes.ok) {
        return NextResponse.json(
          { error: stkData.error || 'Could not trigger Bank STK Sweep.' },
          { status: 400 }
        );
      }

      rec.bankSweepCheckoutId = String(stkData.checkoutRequestId || '');
      rec.updatedAt = new Date().toISOString();
      await saveDonationsLedger(ledger);

      return NextResponse.json({
        ok: true,
        message: `Bank STK Push (KSh ${Math.min(
          SINGLE_STK_MAX_KES,
          rec.amountKes
        ).toLocaleString()}) sent to 0728595160 — enter PIN to settle ${
          rec.referenceCode
        } directly into the Bank!`,
        checkoutRequestId: rec.bankSweepCheckoutId,
      });
    }
  }

  // =========================================================================
  // PUBLIC DONOR ACTION 1: CREATE DONATION / REQUEST INTERNATIONAL METHOD
  // =========================================================================
  if (action === 'create_donation_request') {
    const rawMethod = String(body.method || 'DIRECT_STK_BANK') as DonationPaymentMethod;
    const method: DonationPaymentMethod = VALID_METHODS.includes(rawMethod)
      ? rawMethod
      : 'DIRECT_STK_BANK';

    const amountUsd = Math.max(
      MIN_DONATION_USD,
      Math.round((Number(body.amountUsd) || MIN_DONATION_USD) * 100) / 100
    );
    const amountKes = convertUsdToKes(amountUsd, ledger.settings.usdToKesRate);

    const donorName =
      String(body.donorName || 'International Supporter').trim().slice(0, 80) ||
      'International Supporter';
    const donorEmail = String(body.donorEmail || '').trim().slice(0, 120);
    const donorPhone = String(body.donorPhone || '').trim().slice(0, 40);
    const donorCountry =
      String(body.donorCountry || 'International').trim().slice(0, 60) ||
      'International';
    const dedicatedNote = String(body.dedicatedNote || '').trim().slice(0, 240);
    const checkoutRequestId = body.checkoutRequestId
      ? String(body.checkoutRequestId)
      : undefined;

    const referenceCode = `DON-${Math.floor(1000 + Math.random() * 9000)}`;
    const nowIso = new Date().toISOString();

    const record: LearnerDonationRecord = {
      id: `don_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      referenceCode,
      donorName,
      donorEmail,
      donorPhone,
      donorCountry,
      amountUsd,
      amountKes,
      method,
      dedicatedNote,
      checkoutRequestId,
      status:
        method === 'DIRECT_STK_BANK' ? 'STK_PENDING' : 'REQUESTED_DETAILS',
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    ledger.donations.unshift(record);
    await saveDonationsLedger(ledger);
    void triggerAutomaticBackup('Learner_Support_Donation_Request');

    const waRequestMessage =
      `Hello CBCMATERIALS.SHOP! 🌍❤️\n` +
      `I am requesting to complete my *Needy Learners Education Donation (${referenceCode})*:\n` +
      `• *Amount:* $${amountUsd.toLocaleString()} USD (KSh ${amountKes.toLocaleString()})\n` +
      `• *Method Requested:* ${DONATION_METHOD_LABELS[method]}\n` +
      `• *Donor:* ${donorName} (${donorCountry})\n` +
      (donorEmail ? `• *Email:* ${donorEmail}\n` : '') +
      (dedicatedNote ? `• *Message:* ${dedicatedNote}\n` : '') +
      `Please confirm/assist with direct bank-routed settlement.`;

    const whatsappRequestUrl = `https://wa.me/${DONATION_SUPPORT_WHATSAPP_INTL}?text=${encodeURIComponent(
      waRequestMessage
    )}`;

    void sendWhatsAppAdminNotification(
      `🌍❤️ *NEW LEARNER SUPPORT DONATION (${referenceCode})*\n` +
        `• *Donor:* ${donorName} (${donorCountry})\n` +
        `• *Amount:* $${amountUsd.toLocaleString()} USD (KES ${amountKes.toLocaleString()})\n` +
        `• *Method:* ${DONATION_METHOD_LABELS[method]}\n` +
        `• *Contact:* ${donorPhone || 'N/A'} ${donorEmail ? `| ${donorEmail}` : ''}`
    ).catch(() => {});

    // Return "Upon Request" approved instructions + Connected STK-to-Bank routing
    return NextResponse.json({
      ok: true,
      donation: record,
      whatsappRequestUrl,
      uponRequestDetails: {
        remittanceMpesaE164: DONATION_REMITTANCE_MPESA_E164,
        remittanceMpesaLocal: DONATION_SUPPORT_WHATSAPP_LOCAL,
        recipientAccountName: ledger.settings.bankAccountName,
        paypalHandleOrUrl: ledger.settings.paypalHandleOrUrl || null,
        bankName: ledger.settings.bankName,
        bankAccountNumber: ledger.settings.bankAccountNumber || null,
        bankSwiftBic: ledger.settings.bankSwiftBic,
        bankBranch: ledger.settings.bankBranch,
      },
    });
  }

  // =========================================================================
  // PUBLIC DONOR ACTION 2: CONNECT REMITTANCE (REMITLY / SENDWAVE / WORLDREMIT / PAYPAL-MPESA)
  // DIRECTLY WITH ONE-WAY BANK STK PUSH!
  // =========================================================================
  if (action === 'confirm_remittance_and_trigger_bank_stk') {
    const referenceCode = String(body.referenceCode || '').trim();
    const remittanceTxCode = String(body.remittanceTxCode || '')
      .trim()
      .slice(0, 80);
    const customStkPhone = String(body.stkPhone || '').trim();

    const rec = ledger.donations.find((d) => d.referenceCode === referenceCode);
    if (!rec) {
      return NextResponse.json(
        { error: 'Donation reference not found. Please start your donation first.' },
        { status: 404 }
      );
    }

    rec.remittanceTxCode = remittanceTxCode || rec.remittanceTxCode;
    rec.status = 'REMITTANCE_SENT_PENDING_BANK_SWEEP';
    rec.updatedAt = new Date().toISOString();

    // Determine which phone receives the Bank-Routed STK Push:
    //  - If donor entered their own Kenyan/Global Safaricom number topped up via Remitly/Sendwave/WorldRemit, push STK to that phone!
    //  - Otherwise, if donor sent Remitly/Sendwave/WorldRemit to +254728595160, automatically fire the Bank Sweep STK Push onto 254728595160 so 100% of funds flow ONE WAY straight into the Bank!
    const normalizedCustom = customStkPhone
      ? normalizeKenyanPhone(customStkPhone)
      : null;
    const targetStkPhone = normalizedCustom || DONATION_SUPPORT_WHATSAPP_INTL;

    let sweepTriggered = false;
    let checkoutRequestId = '';
    let stkMessage = '';

    if (
      normalizedCustom ||
      ledger.settings.autoTriggerBankSweepOnRemittanceConfirm
    ) {
      try {
        const stkRes = await fetch(`${origin}/api/mpesa/stkpush`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phoneNumber: targetStkPhone,
            serviceType: 'LEARNER_DONATION',
            donationAmountUsd: rec.amountUsd,
            donationAmountKes: rec.amountKes,
            buyerName: `${rec.donorName} (${rec.method})`,
            bookTitle: `${rec.method} -> Bank STK Settlement (${rec.referenceCode})`,
          }),
        });
        const stkData = await stkRes.json();
        if (stkRes.ok && stkData.checkoutRequestId) {
          sweepTriggered = true;
          checkoutRequestId = String(stkData.checkoutRequestId);
          rec.bankSweepCheckoutId = checkoutRequestId;
          stkMessage = normalizedCustom
            ? `Connected Bank STK Push (KSh ${Math.min(
                SINGLE_STK_MAX_KES,
                rec.amountKes
              ).toLocaleString()}) sent to ${customStkPhone}! Enter your M-Pesa PIN to settle directly into the Bank.`
            : `Remittance confirmed (${rec.referenceCode}) & Connected One-Way Bank STK Settlement triggered directly to our Bank Channel!`;
        }
      } catch {
        // Recorded in ledger even if STK network momentarily busy
      }
    }

    await saveDonationsLedger(ledger);
    void triggerAutomaticBackup('Remittance_Connected_Bank_Sweep');

    void sendWhatsAppAdminNotification(
      `🏦 *REMITTANCE CONNECTED TO BANK STK (${rec.referenceCode})*\n` +
        `• *Provider:* ${DONATION_METHOD_LABELS[rec.method]}\n` +
        `• *Donor:* ${rec.donorName} (${rec.donorCountry})\n` +
        `• *Amount:* $${rec.amountUsd.toLocaleString()} USD (KES ${rec.amountKes.toLocaleString()})\n` +
        (remittanceTxCode ? `• *Transfer Ref:* ${remittanceTxCode}\n` : '') +
        `• *One-Way Bank STK Sweep:* ${
          sweepTriggered ? 'SENT TO SETTLE TO BANK' : 'QUEUED IN /admin'
        }`
    ).catch(() => {});

    return NextResponse.json({
      ok: true,
      sweepTriggered,
      checkoutRequestId: checkoutRequestId || null,
      message:
        stkMessage ||
        `Thank you! Your ${rec.method} donation (${rec.referenceCode}) has been logged and queued for one-way bank settlement.`,
    });
  }

  return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
}
