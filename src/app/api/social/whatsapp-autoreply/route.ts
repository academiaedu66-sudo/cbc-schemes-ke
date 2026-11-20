import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthorized } from '@/lib/admin-auth';
import {
  AUTOREPLY_CAMPAIGNS,
  AUTOREPLY_WHATSAPP_E164,
  AUTOREPLY_WHATSAPP_INTL,
  AUTOREPLY_WHATSAPP_LOCAL,
  buildWhatsAppAutoReplyMessage,
  getWhatsAppAutoReplyLedger,
  handleIncomingWhatsAppCustomerMessage,
  saveWhatsAppAutoReplyLedger,
  SITE_ORIGIN,
} from '@/lib/whatsapp-autoreply';

/**
 * GET /api/social/whatsapp-autoreply
 * 1. Meta Official WhatsApp Cloud API Webhook Verification (`hub.mode=subscribe&hub.challenge=...`)
 * 2. Local Linked-Device Daemon Auto-Reply Config Check (`?daemonKey=...`)
 * 3. Admin Dashboard State & Analytics (`x-admin-password`)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  // 1. Meta WhatsApp Cloud API Webhook Challenge Verification
  const hubMode = searchParams.get('hub.mode');
  const hubChallenge = searchParams.get('hub.challenge');
  const hubVerifyToken = searchParams.get('hub.verify_token');
  if (hubMode === 'subscribe' && hubChallenge) {
    const ledger = await getWhatsAppAutoReplyLedger();
    if (!hubVerifyToken || hubVerifyToken === ledger.verifyToken) {
      return new NextResponse(hubChallenge, {
        status: 200,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }
    return NextResponse.json({ error: 'Invalid verify token' }, { status: 403 });
  }

  // 2. Public quick-info check (`?info=links`)
  if (searchParams.get('info') === 'links') {
    const ledger = await getWhatsAppAutoReplyLedger();
    const preview = buildWhatsAppAutoReplyMessage({
      incomingMessage: 'Hello CBCMATERIALS.SHOP! Please send me the website link.',
      ledger,
    });
    return NextResponse.json({
      ok: true,
      enabled: ledger.enabled,
      whatsappE164: AUTOREPLY_WHATSAPP_E164,
      whatsappLocal: AUTOREPLY_WHATSAPP_LOCAL,
      masterRedirectUrl: `${SITE_ORIGIN}/go`,
      paidAdEntryUrl: `${SITE_ORIGIN}/whatsapp-ad`,
      paidAdDirectWaUrl: AUTOREPLY_CAMPAIGNS[0].paidAdWaLink,
      webhookUrl: `${SITE_ORIGIN}/api/social/whatsapp-autoreply`,
      previewReplyText: preview.replyText,
    });
  }

  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const ledger = await getWhatsAppAutoReplyLedger();
  const sampleReply = buildWhatsAppAutoReplyMessage({
    incomingMessage:
      'Hello CBCMATERIALS.SHOP! I saw your advert — please send me the website link.',
    ledger,
  });

  return NextResponse.json({
    ok: true,
    enabled: ledger.enabled,
    fixedWhatsAppE164: AUTOREPLY_WHATSAPP_E164,
    fixedWhatsAppIntl: AUTOREPLY_WHATSAPP_INTL,
    fixedWhatsAppLocal: AUTOREPLY_WHATSAPP_LOCAL,
    cooldownMinutes: ledger.cooldownMinutes,
    verifyToken: ledger.verifyToken,
    customGreetingHeader: ledger.customGreetingHeader,
    customClosingNote: ledger.customClosingNote,
    includeQuickCategoryLinks: ledger.includeQuickCategoryLinks,
    hasMetaCloudApi: Boolean(ledger.metaAccessToken && ledger.metaPhoneNumberId),
    metaPhoneNumberId: ledger.metaPhoneNumberId || '',
    customReplyWebhookUrl: ledger.customReplyWebhookUrl || '',
    webhookUrl: `${SITE_ORIGIN}/api/social/whatsapp-autoreply`,
    masterRedirectUrl: `${SITE_ORIGIN}/go`,
    paidAdEntryUrl: `${SITE_ORIGIN}/whatsapp-ad`,
    sampleReplyText: sampleReply.replyText,
    campaigns: AUTOREPLY_CAMPAIGNS,
    stats: {
      totalIncomingMessages: ledger.totalIncomingMessages || 0,
      totalAutoRepliesSent: ledger.totalAutoRepliesSent || 0,
      totalWebsiteRedirectClicks: ledger.totalWebsiteRedirectClicks || 0,
      totalPaidAdEntryClicks: ledger.totalPaidAdEntryClicks || 0,
      clicksByCampaign: ledger.clicksByCampaign || {},
    },
    recentLeads: ledger.recentLeads || [],
  });
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * POST /api/social/whatsapp-autoreply
 * Handles:
 *  A) Admin Configuration Save & Live Auto-Reply Simulator (`x-admin-password`)
 *  B) Linked-Device Baileys Daemon (`scripts/whatsapp-0728595160-status-daemon.mjs` -> `action === 'daemon_incoming'`)
 *  C) Meta Official WhatsApp Cloud API / Click-to-WhatsApp Paid Ads Webhook (`object === 'whatsapp_business_account'`)
 *  D) Whapi.Cloud Incoming Message Webhook (`messages[]`)
 *  E) Green-API Incoming Message Webhook (`typeWebhook === 'incomingMessageReceived'`)
 *  F) Evolution API Incoming Message Webhook (`event === 'messages.upsert'`)
 *  G) WhatsAuto & AutoResponder for WA Free Android Apps on +254728595160 (`{ app, sender, message }` / `{ query: { sender, message } }`)
 *  H) Twilio WhatsApp Webhook (`application/x-www-form-urlencoded` with `From` & `Body`)
 */
export async function POST(req: NextRequest) {
  const contentType = (req.headers.get('content-type') || '').toLowerCase();

  // Handle Form-Encoded Webhooks (Twilio WhatsApp & WhatsAuto Form POST)
  if (contentType.includes('application/x-www-form-urlencoded')) {
    const formText = await req.text();
    const form = new URLSearchParams(formText);

    // Twilio WhatsApp format: From=whatsapp:+2547...&Body=...
    const twilioFrom = form.get('From') || '';
    const twilioBody = form.get('Body') || '';
    if (twilioFrom && twilioBody) {
      const result = await handleIncomingWhatsAppCustomerMessage({
        senderPhone: twilioFrom,
        senderName: form.get('ProfileName') || '',
        incomingMessage: twilioBody,
        sourceProvider: 'Twilio WhatsApp',
        skipOutboundApiSend: true,
      });

      const twiml = result.replied
        ? `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(
            result.replyText
          )}</Message></Response>`
        : `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`;

      return new NextResponse(twiml, {
        status: 200,
        headers: { 'Content-Type': 'text/xml; charset=utf-8' },
      });
    }

    // WhatsAuto Android App Form POST format: sender=...&message=...&app=WhatsApp
    const waSender = form.get('sender') || form.get('phone') || '';
    const waMessage = form.get('message') || '';
    if (waSender || waMessage) {
      // Ignore group messages if group_name is populated
      if (form.get('group_name')) {
        return NextResponse.json({ reply: '' });
      }
      const result = await handleIncomingWhatsAppCustomerMessage({
        senderPhone: waSender || 'WhatsAuto_Customer',
        senderName: waSender,
        incomingMessage: waMessage,
        sourceProvider: 'WhatsAuto App',
        skipOutboundApiSend: true,
      });
      return NextResponse.json({
        reply: result.replied ? result.replyText : '',
      });
    }
  }

  // Parse JSON payload for all other providers + Admin actions
  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  // A) Admin Actions (`save_config`, `simulate_reply`, `send_live_test`)
  const action = String(body.action || '');
  if (
    action === 'save_config' ||
    action === 'simulate_reply' ||
    action === 'send_live_test'
  ) {
    if (!isAdminAuthorized(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ledger = await getWhatsAppAutoReplyLedger();

    if (action === 'save_config') {
      const cfg = (body.config || {}) as Record<string, unknown>;
      if (typeof cfg.enabled === 'boolean') ledger.enabled = cfg.enabled;
      if (typeof cfg.cooldownMinutes === 'number') {
        ledger.cooldownMinutes = Math.max(
          0,
          Math.min(1440, Math.round(cfg.cooldownMinutes))
        );
      }
      if (typeof cfg.customGreetingHeader === 'string' && cfg.customGreetingHeader.trim()) {
        ledger.customGreetingHeader = cfg.customGreetingHeader.trim();
      }
      if (typeof cfg.customClosingNote === 'string' && cfg.customClosingNote.trim()) {
        ledger.customClosingNote = cfg.customClosingNote.trim();
      }
      if (typeof cfg.includeQuickCategoryLinks === 'boolean') {
        ledger.includeQuickCategoryLinks = cfg.includeQuickCategoryLinks;
      }
      if (typeof cfg.verifyToken === 'string' && cfg.verifyToken.trim()) {
        ledger.verifyToken = cfg.verifyToken.trim();
      }
      if (typeof cfg.metaAccessToken === 'string' && cfg.metaAccessToken.trim()) {
        ledger.metaAccessToken = cfg.metaAccessToken.trim();
      }
      if (typeof cfg.metaPhoneNumberId === 'string') {
        ledger.metaPhoneNumberId = cfg.metaPhoneNumberId.trim();
      }
      if (typeof cfg.customReplyWebhookUrl === 'string') {
        ledger.customReplyWebhookUrl = cfg.customReplyWebhookUrl.trim();
      }

      const saved = await saveWhatsAppAutoReplyLedger(ledger);
      const sample = buildWhatsAppAutoReplyMessage({
        incomingMessage:
          'Hello CBCMATERIALS.SHOP! I saw your advert — please send me the website link.',
        ledger: saved,
      });

      return NextResponse.json({
        ok: true,
        message: `Saved WhatsApp Auto-Responder settings for ${AUTOREPLY_WHATSAPP_E164}!`,
        enabled: saved.enabled,
        sampleReplyText: sample.replyText,
      });
    }

    if (action === 'simulate_reply') {
      const testMsg = String(
        body.incomingMessage ||
          'Hi, I saw your Paid Ad for Grade 8 KJSEA exams. How do I download?'
      );
      const testName = String(body.senderName || 'Parent Mary');
      const built = buildWhatsAppAutoReplyMessage({
        incomingMessage: testMsg,
        senderName: testName,
        ledger,
      });
      return NextResponse.json({
        ok: true,
        detectedCampaign: built.campaign,
        primaryRedirectUrl: built.primaryRedirectUrl,
        replyText: built.replyText,
      });
    }

    if (action === 'send_live_test') {
      const targetPhone = String(body.targetPhone || '').trim();
      const testMsg = String(
        body.incomingMessage ||
          'Hello CBCMATERIALS.SHOP! Testing Paid-Ads WhatsApp Auto-Reply.'
      );
      const res = await handleIncomingWhatsAppCustomerMessage({
        senderPhone: targetPhone,
        senderName: 'Test Customer',
        incomingMessage: testMsg,
        sourceProvider: 'Admin Live Test',
        forceReply: true,
      });
      return NextResponse.json({
        ok: true,
        ...res,
      });
    }
  }

  // B) Linked-Device Baileys Daemon (`scripts/whatsapp-0728595160-status-daemon.mjs`)
  if (action === 'daemon_incoming') {
    const daemonKey = String(body.daemonKey || '').trim();
    const adminPw = (process.env.ADMIN_PASSWORD || '').trim();
    if (!daemonKey || !adminPw || daemonKey !== adminPw) {
      return NextResponse.json({ error: 'Unauthorized daemon' }, { status: 401 });
    }
    const result = await handleIncomingWhatsAppCustomerMessage({
      senderPhone: String(body.senderPhone || ''),
      senderName: String(body.senderName || ''),
      incomingMessage: String(body.incomingMessage || ''),
      referralHeadline: String(body.referralHeadline || ''),
      isPaidAdReferral: Boolean(body.isPaidAdReferral),
      sourceProvider: 'Linked-Device Baileys (+254728595160)',
      skipOutboundApiSend: true,
    });
    return NextResponse.json({ ok: true, ...result });
  }

  // C) Meta Official WhatsApp Cloud API Webhook (Click-to-WhatsApp Paid Ads + Direct Messages)
  if (body.object === 'whatsapp_business_account' && Array.isArray(body.entry)) {
    const results = [];
    for (const entry of body.entry as Array<Record<string, unknown>>) {
      const changes = Array.isArray(entry.changes)
        ? (entry.changes as Array<Record<string, unknown>>)
        : [];
      for (const change of changes) {
        const value = (change.value || {}) as Record<string, unknown>;
        const contacts = Array.isArray(value.contacts)
          ? (value.contacts as Array<Record<string, unknown>>)
          : [];
        const contactName = String(
          ((contacts[0]?.profile as Record<string, unknown> | undefined)?.name as string) ||
            ''
        );
        const messages = Array.isArray(value.messages)
          ? (value.messages as Array<Record<string, unknown>>)
          : [];

        for (const msg of messages) {
          const from = String(msg.from || '');
          const textObj = (msg.text || {}) as Record<string, unknown>;
          const buttonObj = (msg.button || {}) as Record<string, unknown>;
          const referralObj = (msg.referral || null) as Record<
            string,
            unknown
          > | null;
          const incomingText = String(
            textObj.body || buttonObj.text || referralObj?.headline || 'Hello'
          );

          const res = await handleIncomingWhatsAppCustomerMessage({
            senderPhone: from,
            senderName: contactName,
            incomingMessage: incomingText,
            referralHeadline: String(referralObj?.headline || ''),
            isPaidAdReferral: Boolean(referralObj),
            sourceProvider: 'Meta WhatsApp Cloud API',
          });
          results.push(res);
        }
      }
    }
    return NextResponse.json({ ok: true, processed: results.length });
  }

  // D) Whapi.Cloud Incoming Message Webhook (`messages[]`)
  if (Array.isArray(body.messages)) {
    let repliedCount = 0;
    for (const rawMsg of body.messages as Array<Record<string, unknown>>) {
      if (rawMsg.from_me) continue;
      const chatId = String(rawMsg.chat_id || rawMsg.from || '');
      if (chatId.includes('@g.us') || chatId.includes('status@broadcast')) {
        continue;
      }
      const textBody = String(
        ((rawMsg.text as Record<string, unknown> | undefined)?.body as string) ||
          rawMsg.body ||
          'Hello'
      );
      const res = await handleIncomingWhatsAppCustomerMessage({
        senderPhone: String(rawMsg.from || chatId),
        senderName: String(rawMsg.from_name || ''),
        incomingMessage: textBody,
        sourceProvider: 'Whapi.Cloud Webhook',
      });
      if (res.replied) repliedCount++;
    }
    return NextResponse.json({ ok: true, repliedCount });
  }

  // E) Green-API Incoming Message Webhook
  if (body.typeWebhook === 'incomingMessageReceived') {
    const senderData = (body.senderData || {}) as Record<string, unknown>;
    const chatId = String(senderData.chatId || '');
    if (chatId.includes('@g.us') || chatId.includes('status@broadcast')) {
      return NextResponse.json({ ok: true, ignored: 'group_or_status' });
    }
    const messageData = (body.messageData || {}) as Record<string, unknown>;
    const textMsg =
      ((messageData.textMessageData as Record<string, unknown> | undefined)
        ?.textMessage as string) ||
      ((
        messageData.extendedTextMessageData as Record<string, unknown> | undefined
      )?.text as string) ||
      'Hello';

    const res = await handleIncomingWhatsAppCustomerMessage({
      senderPhone: String(senderData.sender || chatId),
      senderName: String(senderData.senderName || ''),
      incomingMessage: textMsg,
      sourceProvider: 'Green-API Webhook',
    });
    return NextResponse.json({ ok: true, replied: res.replied });
  }

  // F) Evolution API Incoming Message Webhook (`event === 'messages.upsert'`)
  if (body.event === 'messages.upsert' && body.data) {
    const data = body.data as Record<string, unknown>;
    const key = (data.key || {}) as Record<string, unknown>;
    const remoteJid = String(key.remoteJid || '');
    if (
      key.fromMe ||
      remoteJid.includes('@g.us') ||
      remoteJid.includes('status@broadcast')
    ) {
      return NextResponse.json({ ok: true, ignored: true });
    }
    const msgContent = (data.message || {}) as Record<string, unknown>;
    const incomingText = String(
      msgContent.conversation ||
        ((msgContent.extendedTextMessage as Record<string, unknown> | undefined)
          ?.text as string) ||
        'Hello'
    );
    const res = await handleIncomingWhatsAppCustomerMessage({
      senderPhone: remoteJid,
      senderName: String(data.pushName || ''),
      incomingMessage: incomingText,
      sourceProvider: 'Evolution API Webhook',
    });
    return NextResponse.json({ ok: true, replied: res.replied });
  }

  // G) AutoResponder for WA & WhatsAuto JSON Custom Server Format
  if (body.query && typeof body.query === 'object') {
    const q = body.query as Record<string, unknown>;
    if (q.isGroup) {
      return NextResponse.json({ replies: [] });
    }
    const sender = String(q.sender || 'AutoResponder_Customer');
    const msg = String(q.message || 'Hello');
    const res = await handleIncomingWhatsAppCustomerMessage({
      senderPhone: sender,
      senderName: sender,
      incomingMessage: msg,
      sourceProvider: 'AutoResponder for WA',
      skipOutboundApiSend: true,
    });
    return NextResponse.json({
      replies: res.replied ? [{ message: res.replyText }] : [],
    });
  }

  if (typeof body.sender === 'string' && typeof body.message === 'string') {
    if (body.group_name) {
      return NextResponse.json({ reply: '' });
    }
    const res = await handleIncomingWhatsAppCustomerMessage({
      senderPhone: body.sender,
      senderName: body.sender,
      incomingMessage: body.message,
      sourceProvider: 'WhatsAuto Webhook',
      skipOutboundApiSend: true,
    });
    return NextResponse.json({
      reply: res.replied ? res.replyText : '',
      replies: res.replied ? [{ message: res.replyText }] : [],
    });
  }

  return NextResponse.json({ ok: true, status: 'webhook_ready_254728595160' });
}
