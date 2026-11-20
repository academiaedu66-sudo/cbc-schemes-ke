import { supabaseAdmin } from '@/lib/supabase';
import { sendWhatsAppAdminNotification } from '@/lib/mpesa';
import { getWhatsAppStatusLedger } from '@/lib/whatsapp-status-autoposter';
import {
  getSeoCustomerSensorLedger,
  saveSeoCustomerSensorLedger,
} from '@/lib/seo-visitor-sensor';

const BUCKET_NAME = 'cbc-materials';
export const WA_AUTOREPLY_LEDGER_PATH = '_system/whatsapp-autoreply-ledger.json';

export const AUTOREPLY_WHATSAPP_E164 = '+254728595160';
export const AUTOREPLY_WHATSAPP_INTL = '254728595160';
export const AUTOREPLY_WHATSAPP_LOCAL = '0728595160';
export const SITE_ORIGIN = 'https://www.cbcmaterials.shop';

export interface AutoReplyCampaignSpec {
  slug: string;
  label: string;
  badge: string;
  shortRedirectUrl: string;
  destinationUrl: string;
  paidAdWaLink: string;
  paidAdEntryUrl: string;
  ogTitle: string;
  ogDescription: string;
  keywords: string[];
}

export const AUTOREPLY_CAMPAIGNS: AutoReplyCampaignSpec[] = [
  {
    slug: 'whatsapp',
    label: 'Main Website Hub (All 6,534+ Materials)',
    badge: 'MAIN WEBSITE REDIRECT',
    shortRedirectUrl: `${SITE_ORIGIN}/go/whatsapp`,
    destinationUrl: `${SITE_ORIGIN}/?utm_source=whatsapp_254728595160&utm_medium=autoreply&utm_campaign=paid_ads`,
    paidAdWaLink: `https://wa.me/${AUTOREPLY_WHATSAPP_INTL}?text=${encodeURIComponent(
      'Hello CBCMATERIALS.SHOP! I saw your advert — please send me the website link to download CBC materials.'
    )}`,
    paidAdEntryUrl: `${SITE_ORIGIN}/whatsapp-ad?ad=whatsapp`,
    ogTitle: 'CBCMATERIALS.SHOP — Official 2026 CBC Schemes, Notes, Exams, Books & Videos',
    ogDescription:
      'Tap here to browse all 6,534+ KICD-aligned CBC materials (PP1–Grade 12) & download instantly in 1 second via M-Pesa!',
    keywords: ['website', 'link', 'shop', 'cbc', 'material', 'menu', 'help', 'start', 'hi', 'hello'],
  },
  {
    slug: 'books',
    label: 'CBC Revision Books (Grade Up, Super-Light & Smart CBC)',
    badge: 'REVISION BOOKS',
    shortRedirectUrl: `${SITE_ORIGIN}/go/books`,
    destinationUrl: `${SITE_ORIGIN}/?book=1&utm_source=whatsapp_254728595160&utm_medium=autoreply&utm_campaign=books_ad`,
    paidAdWaLink: `https://wa.me/${AUTOREPLY_WHATSAPP_INTL}?text=${encodeURIComponent(
      'Hello CBCMATERIALS.SHOP! I saw your Revision Books ad — please send me the link to download CBC Grade Up / Smart CBC books.'
    )}`,
    paidAdEntryUrl: `${SITE_ORIGIN}/whatsapp-ad?ad=books`,
    ogTitle: 'CBCMATERIALS.SHOP — CBC Grade Up, Super-Light & Smart CBC Master Books',
    ogDescription:
      'Download complete point-form CBC Revision Books + 300+ Questions & Marking Schemes (PP1–Grade 12) instantly!',
    keywords: ['book', 'grade up', 'super-light', 'super light', 'smart cbc', 'compilation'],
  },
  {
    slug: 'exams',
    label: 'National KJSEA, KPSEA & KNEC Format Exams + Marking Schemes',
    badge: 'EXAMS & MARKING SCHEMES',
    shortRedirectUrl: `${SITE_ORIGIN}/go/exams`,
    destinationUrl: `${SITE_ORIGIN}/?area=kjsea&utm_source=whatsapp_254728595160&utm_medium=autoreply&utm_campaign=exams_ad`,
    paidAdWaLink: `https://wa.me/${AUTOREPLY_WHATSAPP_INTL}?text=${encodeURIComponent(
      'Hello CBCMATERIALS.SHOP! I saw your KJSEA & CBC Exams ad — please send me the website link to download exams & marking schemes.'
    )}`,
    paidAdEntryUrl: `${SITE_ORIGIN}/whatsapp-ad?ad=exams`,
    ogTitle: 'CBCMATERIALS.SHOP — Kenya National KJSEA, KPSEA & CBC Exams (KSh 50)',
    ogDescription:
      'Download authentic KNEC-format Exams & Official Marking Schemes (PDF + Editable Word) for PP1 to Grade 12!',
    keywords: ['exam', 'test', 'kjsea', 'kpsea', 'knec', 'marking scheme', 'assessment', 'paper'],
  },
  {
    slug: 'schemes',
    label: '2026 Rationalized Schemes of Work, Lesson Plans & Notes',
    badge: 'SCHEMES, PLANS & NOTES',
    shortRedirectUrl: `${SITE_ORIGIN}/go/schemes`,
    destinationUrl: `${SITE_ORIGIN}/?area=schemes&utm_source=whatsapp_254728595160&utm_medium=autoreply&utm_campaign=schemes_ad`,
    paidAdWaLink: `https://wa.me/${AUTOREPLY_WHATSAPP_INTL}?text=${encodeURIComponent(
      'Hello CBCMATERIALS.SHOP! I saw your Schemes of Work & Notes ad — please send me the website link.'
    )}`,
    paidAdEntryUrl: `${SITE_ORIGIN}/whatsapp-ad?ad=schemes`,
    ogTitle: 'CBCMATERIALS.SHOP — 2026 KICD Schemes of Work, Lesson Plans & Notes (From KSh 50)',
    ogDescription:
      'Editable MS Word (.DOCX) + Print-Ready (.PDF) Schemes, Lesson Plans, Notes & Records of Work for Term 1, 2 & 3!',
    keywords: ['scheme', 'lesson plan', 'note', 'record of work', 'curriculum', 'strand', 'teacher'],
  },
  {
    slug: 'videos',
    label: 'Tutor Peter Whiteboard Video Demonstrations ($15 Pass)',
    badge: 'TUTOR PETER VIDEOS ($15)',
    shortRedirectUrl: `${SITE_ORIGIN}/go/videos`,
    destinationUrl: `${SITE_ORIGIN}/videos?utm_source=whatsapp_254728595160&utm_medium=autoreply&utm_campaign=videos_ad`,
    paidAdWaLink: `https://wa.me/${AUTOREPLY_WHATSAPP_INTL}?text=${encodeURIComponent(
      'Hello Tutor Peter! I saw your Video Classes ad — please send me the link to unlock Tutor Peter Whiteboard Videos.'
    )}`,
    paidAdEntryUrl: `${SITE_ORIGIN}/whatsapp-ad?ad=videos`,
    ogTitle: 'CBCMATERIALS.SHOP — Tutor Peter Whiteboard Video Classes ($15 All-Access)',
    ogDescription:
      'Watch step-by-step whiteboard classroom demonstrations by Tutor Peter across all 6,534+ CBC materials!',
    keywords: ['video', 'tutor peter', 'whiteboard', 'class', 'watch', '$15', '1950'],
  },
  {
    slug: 'tuition',
    label: 'Personal & Holiday Tuition (Home & Online Across 47 Counties)',
    badge: 'HOLIDAY TUITION',
    shortRedirectUrl: `${SITE_ORIGIN}/go/tuition`,
    destinationUrl: `${SITE_ORIGIN}/?utm_source=whatsapp_254728595160&utm_medium=autoreply&utm_campaign=tuition_ad#holiday-tuition-hub`,
    paidAdWaLink: `https://wa.me/${AUTOREPLY_WHATSAPP_INTL}?text=${encodeURIComponent(
      'Hello CBCMATERIALS.SHOP! I saw your Holiday Tuition ad — please send me the link to book a CBC tuition teacher.'
    )}`,
    paidAdEntryUrl: `${SITE_ORIGIN}/whatsapp-ad?ad=tuition`,
    ogTitle: 'CBCMATERIALS.SHOP — Verified Home & Online Holiday Tuition (PP1–Grade 12)',
    ogDescription:
      'Book a verified one-on-one CBC Tuition Teacher or register as a tutor across all 47 counties in Kenya!',
    keywords: ['tuition', 'tutor', 'holiday', 'coaching', 'home teacher'],
  },
];

export interface WhatsAppAutoReplyLead {
  id: string;
  repliedAtIso: string;
  senderPhone: string;
  senderName: string;
  incomingMessage: string;
  detectedCampaignSlug: string;
  detectedCampaignLabel: string;
  redirectUrlSent: string;
  deliveryChannels: string[];
  deliveredViaApi: boolean;
  isPaidAdReferral: boolean;
}

export interface WhatsAppAutoReplyLedger {
  enabled: boolean;
  fixedWhatsAppE164: string;
  fixedWhatsAppIntl: string;
  fixedWhatsAppLocal: string;
  cooldownMinutes: number;
  verifyToken: string;
  customGreetingHeader: string;
  customClosingNote: string;
  includeQuickCategoryLinks: boolean;
  metaAccessToken: string;
  metaPhoneNumberId: string;
  customReplyWebhookUrl: string;
  totalIncomingMessages: number;
  totalAutoRepliesSent: number;
  totalWebsiteRedirectClicks: number;
  totalPaidAdEntryClicks: number;
  clicksByCampaign: Record<string, number>;
  recentSenderTimestamps: Record<string, number>;
  recentLeads: WhatsAppAutoReplyLead[];
  updatedAt: string;
}

export const DEFAULT_GREETING_HEADER =
  '👋 Welcome to *CBCMATERIALS.SHOP*! 🇰🇪✨\nThank you for messaging us on WhatsApp!';

export const DEFAULT_CLOSING_NOTE =
  '⚡ *How to Download in 1 Second:* Tap the website link above, pick your Grade & Subject, enter your M-Pesa number, and your PDF + Editable Word files download automatically!';

export function resolveCampaignBySlug(slug?: string | null): AutoReplyCampaignSpec {
  const clean = String(slug || 'whatsapp')
    .trim()
    .toLowerCase();
  return (
    AUTOREPLY_CAMPAIGNS.find((c) => c.slug === clean) || AUTOREPLY_CAMPAIGNS[0]
  );
}

export function detectCampaignFromIncomingMessage(
  messageText: string,
  referralHeadline?: string
): AutoReplyCampaignSpec {
  const combined = `${messageText || ''} ${referralHeadline || ''}`.toLowerCase();
  // Check specific campaigns (index 1..n) before general fallback (index 0)
  for (let i = 1; i < AUTOREPLY_CAMPAIGNS.length; i++) {
    const spec = AUTOREPLY_CAMPAIGNS[i];
    if (spec.keywords.some((kw) => combined.includes(kw))) {
      return spec;
    }
  }
  return AUTOREPLY_CAMPAIGNS[0];
}

export function buildWhatsAppAutoReplyMessage(options: {
  incomingMessage?: string;
  senderName?: string;
  referralHeadline?: string;
  ledger?: Partial<WhatsAppAutoReplyLedger>;
}): {
  replyText: string;
  primaryRedirectUrl: string;
  masterRedirectUrl: string;
  campaign: AutoReplyCampaignSpec;
} {
  const campaign = detectCampaignFromIncomingMessage(
    options.incomingMessage || '',
    options.referralHeadline
  );
  const masterRedirectUrl = `${SITE_ORIGIN}/go`;
  const primaryRedirectUrl =
    campaign.slug === 'whatsapp' ? masterRedirectUrl : campaign.shortRedirectUrl;

  const cleanName = (options.senderName || '')
    .replace(/[^\p{L}\p{N}\s.'-]/gu, '')
    .trim()
    .slice(0, 32);

  const headerBase =
    (options.ledger?.customGreetingHeader || '').trim() || DEFAULT_GREETING_HEADER;
  const personalizedHeader = cleanName
    ? headerBase.replace(
        'Welcome to *CBCMATERIALS.SHOP*!',
        `Hello *${cleanName}*, welcome to *CBCMATERIALS.SHOP*!`
      )
    : headerBase;

  const closingNote =
    (options.ledger?.customClosingNote || '').trim() || DEFAULT_CLOSING_NOTE;
  const includeCategoryLinks = options.ledger?.includeQuickCategoryLinks !== false;

  const lines: string[] = [personalizedHeader, ''];

  if (campaign.slug !== 'whatsapp') {
    lines.push(`🎯 *Direct Link for ${campaign.label}:*`);
    lines.push(primaryRedirectUrl);
    lines.push('');
    lines.push(`🌐 *Main Website (All 6,534+ Materials):*`);
    lines.push(masterRedirectUrl);
  } else {
    lines.push(`👉 *Tap this link to open our official website & download instantly:*`);
    lines.push(masterRedirectUrl);
  }

  if (includeCategoryLinks) {
    lines.push('');
    lines.push('📚 *Quick Direct Website Sections:*');
    lines.push(`• Schemes, Plans & Notes: ${SITE_ORIGIN}/go/schemes`);
    lines.push(`• KJSEA & CBC Exams (KSh 50): ${SITE_ORIGIN}/go/exams`);
    lines.push(`• CBC Revision Books: ${SITE_ORIGIN}/go/books`);
    lines.push(`• Tutor Peter Videos ($15): ${SITE_ORIGIN}/go/videos`);
    lines.push(`• Holiday Tuition Hub: ${SITE_ORIGIN}/go/tuition`);
  }

  lines.push('');
  lines.push(closingNote);

  return {
    replyText: lines.join('\n'),
    primaryRedirectUrl,
    masterRedirectUrl,
    campaign,
  };
}

export async function getWhatsAppAutoReplyLedger(): Promise<WhatsAppAutoReplyLedger> {
  const defaults: WhatsAppAutoReplyLedger = {
    enabled: true,
    fixedWhatsAppE164: AUTOREPLY_WHATSAPP_E164,
    fixedWhatsAppIntl: AUTOREPLY_WHATSAPP_INTL,
    fixedWhatsAppLocal: AUTOREPLY_WHATSAPP_LOCAL,
    cooldownMinutes: 30,
    verifyToken: (
      process.env.WHATSAPP_VERIFY_TOKEN || 'cbcmaterials_autoreply_254728595160'
    ).trim(),
    customGreetingHeader: DEFAULT_GREETING_HEADER,
    customClosingNote: DEFAULT_CLOSING_NOTE,
    includeQuickCategoryLinks: true,
    metaAccessToken: (process.env.WHATSAPP_ACCESS_TOKEN || '').trim(),
    metaPhoneNumberId: (process.env.WHATSAPP_PHONE_NUMBER_ID || '').trim(),
    customReplyWebhookUrl: (process.env.WHATSAPP_AUTOREPLY_WEBHOOK_URL || '').trim(),
    totalIncomingMessages: 0,
    totalAutoRepliesSent: 0,
    totalWebsiteRedirectClicks: 0,
    totalPaidAdEntryClicks: 0,
    clicksByCampaign: {},
    recentSenderTimestamps: {},
    recentLeads: [],
    updatedAt: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .download(WA_AUTOREPLY_LEDGER_PATH);
    if (error || !data) return defaults;
    const parsed = JSON.parse(
      await data.text()
    ) as Partial<WhatsAppAutoReplyLedger>;

    return {
      ...defaults,
      ...parsed,
      fixedWhatsAppE164: AUTOREPLY_WHATSAPP_E164,
      fixedWhatsAppIntl: AUTOREPLY_WHATSAPP_INTL,
      fixedWhatsAppLocal: AUTOREPLY_WHATSAPP_LOCAL,
      cooldownMinutes:
        typeof parsed.cooldownMinutes === 'number'
          ? Math.max(0, Math.min(1440, parsed.cooldownMinutes))
          : defaults.cooldownMinutes,
      verifyToken: parsed.verifyToken?.trim() || defaults.verifyToken,
      customGreetingHeader:
        parsed.customGreetingHeader?.trim() || defaults.customGreetingHeader,
      customClosingNote:
        parsed.customClosingNote?.trim() || defaults.customClosingNote,
      includeQuickCategoryLinks:
        parsed.includeQuickCategoryLinks !== undefined
          ? Boolean(parsed.includeQuickCategoryLinks)
          : true,
      metaAccessToken: parsed.metaAccessToken?.trim() || defaults.metaAccessToken,
      metaPhoneNumberId:
        parsed.metaPhoneNumberId?.trim() || defaults.metaPhoneNumberId,
      customReplyWebhookUrl:
        parsed.customReplyWebhookUrl?.trim() || defaults.customReplyWebhookUrl,
      clicksByCampaign: parsed.clicksByCampaign || {},
      recentSenderTimestamps: parsed.recentSenderTimestamps || {},
      recentLeads: Array.isArray(parsed.recentLeads)
        ? parsed.recentLeads.slice(0, 60)
        : [],
    };
  } catch {
    return defaults;
  }
}

export async function saveWhatsAppAutoReplyLedger(
  ledger: WhatsAppAutoReplyLedger
): Promise<WhatsAppAutoReplyLedger> {
  const nowMs = Date.now();
  const prunedSenders: Record<string, number> = {};
  for (const [phone, ts] of Object.entries(ledger.recentSenderTimestamps || {})) {
    if (nowMs - ts < 24 * 60 * 60 * 1000) {
      prunedSenders[phone] = ts;
    }
  }

  const next: WhatsAppAutoReplyLedger = {
    ...ledger,
    fixedWhatsAppE164: AUTOREPLY_WHATSAPP_E164,
    fixedWhatsAppIntl: AUTOREPLY_WHATSAPP_INTL,
    fixedWhatsAppLocal: AUTOREPLY_WHATSAPP_LOCAL,
    recentSenderTimestamps: prunedSenders,
    recentLeads: (ledger.recentLeads || []).slice(0, 60),
    updatedAt: new Date().toISOString(),
  };

  await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .upload(
      WA_AUTOREPLY_LEDGER_PATH,
      Buffer.from(JSON.stringify(next, null, 2), 'utf-8'),
      {
        contentType: 'application/json',
        upsert: true,
      }
    );

  return next;
}

export function normalizeWhatsAppDigits(raw: string): string {
  const digits = String(raw || '')
    .replace(/@s\.whatsapp\.net$/i, '')
    .replace(/@c\.us$/i, '')
    .replace(/^whatsapp:/i, '')
    .replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('0') && digits.length === 10) {
    return `254${digits.slice(1)}`;
  }
  if ((digits.startsWith('7') || digits.startsWith('1')) && digits.length === 9) {
    return `254${digits}`;
  }
  return digits;
}

export function shouldBypassCooldown(messageText: string): boolean {
  const lower = String(messageText || '').trim().toLowerCase();
  if (!lower) return false;
  return (
    lower.includes('cbcmaterials.shop') ||
    lower.includes('saw your ad') ||
    lower.includes('saw your advert') ||
    lower === 'link' ||
    lower === 'website' ||
    lower === 'menu' ||
    lower === 'shop' ||
    lower === 'help' ||
    lower === 'start' ||
    lower.includes('send me the link') ||
    lower.includes('send link')
  );
}

/**
 * Sends the automatic WhatsApp reply from +254728595160 back to the customer across
 * all connected WhatsApp APIs (Meta Cloud API, Whapi.Cloud, Green-API, Evolution API, Custom Webhook)
 * and also returns the synchronous reply text for WhatsAuto / AutoResponder / Twilio / Baileys Daemon!
 */
export async function handleIncomingWhatsAppCustomerMessage(input: {
  senderPhone: string;
  senderName?: string;
  incomingMessage: string;
  referralHeadline?: string;
  isPaidAdReferral?: boolean;
  sourceProvider: string;
  skipOutboundApiSend?: boolean; // true when caller (e.g. Baileys daemon, Twilio TwiML, WhatsAuto) sends the returned replyText directly
  forceReply?: boolean;
}): Promise<{
  replied: boolean;
  reason?: string;
  replyText: string;
  primaryRedirectUrl: string;
  campaign: AutoReplyCampaignSpec;
  deliveredViaApi: boolean;
  deliveryChannels: string[];
}> {
  const ledger = await getWhatsAppAutoReplyLedger();
  const cleanPhone = normalizeWhatsAppDigits(input.senderPhone);

  const built = buildWhatsAppAutoReplyMessage({
    incomingMessage: input.incomingMessage,
    senderName: input.senderName,
    referralHeadline: input.referralHeadline,
    ledger,
  });

  if (!ledger.enabled && !input.forceReply) {
    return {
      replied: false,
      reason: 'Auto-responder is paused in Admin.',
      replyText: built.replyText,
      primaryRedirectUrl: built.primaryRedirectUrl,
      campaign: built.campaign,
      deliveredViaApi: false,
      deliveryChannels: [],
    };
  }

  // Never auto-reply to our own business numbers (+254728595160 / +254705759072) to prevent loops
  if (
    !input.forceReply &&
    (!cleanPhone ||
      cleanPhone === AUTOREPLY_WHATSAPP_INTL ||
      cleanPhone === '254705759072')
  ) {
    return {
      replied: false,
      reason: 'Ignored self/system number to prevent auto-reply loop.',
      replyText: built.replyText,
      primaryRedirectUrl: built.primaryRedirectUrl,
      campaign: built.campaign,
      deliveredViaApi: false,
      deliveryChannels: [],
    };
  }

  const nowMs = Date.now();
  const lastReplyTs = ledger.recentSenderTimestamps[cleanPhone] || 0;
  const cooldownMs = Math.max(0, ledger.cooldownMinutes) * 60 * 1000;
  const bypassCooldown =
    Boolean(input.forceReply) ||
    Boolean(input.isPaidAdReferral) ||
    shouldBypassCooldown(input.incomingMessage);

  if (!bypassCooldown && lastReplyTs > 0 && nowMs - lastReplyTs < cooldownMs) {
    return {
      replied: false,
      reason: `Cooldown active for ${cleanPhone} (${ledger.cooldownMinutes}m window).`,
      replyText: built.replyText,
      primaryRedirectUrl: built.primaryRedirectUrl,
      campaign: built.campaign,
      deliveredViaApi: false,
      deliveryChannels: [],
    };
  }

  const deliveryChannels: string[] = [];
  let deliveredViaApi = false;

  if (input.skipOutboundApiSend) {
    deliveredViaApi = true;
    deliveryChannels.push(`${input.sourceProvider} Direct Synchronous Auto-Reply (+254728595160)`);
  } else {
    // Also read shared +254728595160 bridge tokens configured in WhatsAppStatusLedger
    const statusLedger = await getWhatsAppStatusLedger();

    // 1. Meta Official WhatsApp Cloud API (supports Click-to-WhatsApp Paid Ads + Interactive URL Button)
    const metaToken = (
      ledger.metaAccessToken ||
      process.env.WHATSAPP_ACCESS_TOKEN ||
      ''
    ).trim();
    const metaPhoneId = (
      ledger.metaPhoneNumberId ||
      process.env.WHATSAPP_PHONE_NUMBER_ID ||
      ''
    ).trim();

    if (metaToken && metaPhoneId) {
      try {
        // Try interactive CTA URL button first (highest click-through rate in WhatsApp!), fallback to rich text preview
        const ctaRes = await fetch(
          `https://graph.facebook.com/v21.0/${encodeURIComponent(metaPhoneId)}/messages`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${metaToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              recipient_type: 'individual',
              to: cleanPhone,
              type: 'interactive',
              interactive: {
                type: 'cta_url',
                header: {
                  type: 'text',
                  text: 'CBCMATERIALS.SHOP OFFICIAL HUB',
                },
                body: {
                  text: built.replyText.slice(0, 1000),
                },
                footer: {
                  text: 'Instant 1-Second M-Pesa Download • +254728595160',
                },
                action: {
                  name: 'cta_url',
                  parameters: {
                    display_text: 'Open CBCMATERIALS.SHOP',
                    url: built.primaryRedirectUrl,
                  },
                },
              },
            }),
            signal: AbortSignal.timeout(8000),
          }
        );

        if (ctaRes.ok) {
          deliveredViaApi = true;
          deliveryChannels.push('Meta Cloud API CTA Button (+254728595160)');
        } else {
          const textRes = await fetch(
            `https://graph.facebook.com/v21.0/${encodeURIComponent(metaPhoneId)}/messages`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${metaToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                messaging_product: 'whatsapp',
                to: cleanPhone,
                type: 'text',
                text: { preview_url: true, body: built.replyText },
              }),
              signal: AbortSignal.timeout(8000),
            }
          );
          if (textRes.ok) {
            deliveredViaApi = true;
            deliveryChannels.push('Meta Cloud API Rich Link (+254728595160)');
          }
        }
      } catch {}
    }

    // 2. Whapi.Cloud Linked Device (+254728595160)
    const whapiToken = (
      statusLedger.whapiApiToken ||
      process.env.WHAPI_API_TOKEN ||
      ''
    ).trim();
    if (whapiToken) {
      try {
        const whRes = await fetch('https://gate.whapi.cloud/messages/text', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${whapiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: `${cleanPhone}@s.whatsapp.net`,
            body: built.replyText,
            no_link_preview: false,
          }),
          signal: AbortSignal.timeout(8000),
        });
        if (whRes.ok) {
          deliveredViaApi = true;
          deliveryChannels.push('Whapi.Cloud Auto-Reply (+254728595160)');
        }
      } catch {}
    }

    // 3. Green-API Linked Device (+254728595160)
    if (statusLedger.greenApiInstanceId && statusLedger.greenApiToken) {
      try {
        const base = (
          statusLedger.greenApiUrl || 'https://api.green-api.com'
        ).replace(/\/$/, '');
        const gaUrl = `${base}/waInstance${encodeURIComponent(
          statusLedger.greenApiInstanceId
        )}/sendMessage/${encodeURIComponent(statusLedger.greenApiToken)}`;
        const gaRes = await fetch(gaUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chatId: `${cleanPhone}@c.us`,
            message: built.replyText,
            linkPreview: true,
          }),
          signal: AbortSignal.timeout(8000),
        });
        if (gaRes.ok) {
          deliveredViaApi = true;
          deliveryChannels.push('Green-API Auto-Reply (+254728595160)');
        }
      } catch {}
    }

    // 4. Evolution API Linked Device (+254728595160)
    if (
      statusLedger.evolutionApiUrl &&
      statusLedger.evolutionApiInstance &&
      statusLedger.evolutionApiKey
    ) {
      try {
        const evoBase = statusLedger.evolutionApiUrl.replace(/\/$/, '');
        const evoRes = await fetch(
          `${evoBase}/message/sendText/${encodeURIComponent(
            statusLedger.evolutionApiInstance
          )}`,
          {
            method: 'POST',
            headers: {
              apikey: statusLedger.evolutionApiKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              number: cleanPhone,
              text: built.replyText,
              linkPreview: true,
            }),
            signal: AbortSignal.timeout(8000),
          }
        );
        if (evoRes.ok) {
          deliveredViaApi = true;
          deliveryChannels.push('Evolution API Auto-Reply (+254728595160)');
        }
      } catch {}
    }

    // 5. Custom Outbound Auto-Reply Webhook (Make / Zapier / n8n / Wassenger)
    if (ledger.customReplyWebhookUrl) {
      try {
        const customRes = await fetch(ledger.customReplyWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fromBusinessWhatsApp: AUTOREPLY_WHATSAPP_E164,
            toCustomerPhone: cleanPhone,
            replyMessage: built.replyText,
            redirectUrl: built.primaryRedirectUrl,
            campaign: built.campaign.slug,
          }),
          signal: AbortSignal.timeout(8000),
        });
        if (customRes.ok) {
          deliveredViaApi = true;
          deliveryChannels.push('Custom Webhook Auto-Reply (+254728595160)');
        }
      } catch {}
    }
  }

  ledger.totalIncomingMessages = (ledger.totalIncomingMessages || 0) + 1;
  ledger.totalAutoRepliesSent = (ledger.totalAutoRepliesSent || 0) + 1;
  if (cleanPhone) {
    ledger.recentSenderTimestamps[cleanPhone] = nowMs;
  }

  ledger.recentLeads.unshift({
    id: `walead_${nowMs}_${Math.random().toString(36).slice(2, 6)}`,
    repliedAtIso: new Date(nowMs).toISOString(),
    senderPhone: cleanPhone || input.senderPhone || 'Unknown',
    senderName: (input.senderName || 'WhatsApp Customer').slice(0, 48),
    incomingMessage: String(input.incomingMessage || '').slice(0, 220),
    detectedCampaignSlug: built.campaign.slug,
    detectedCampaignLabel: built.campaign.label,
    redirectUrlSent: built.primaryRedirectUrl,
    deliveryChannels:
      deliveryChannels.length > 0
        ? deliveryChannels
        : ['Webhook JSON Auto-Reply (+254728595160)'],
    deliveredViaApi,
    isPaidAdReferral: Boolean(input.isPaidAdReferral),
  });

  await saveWhatsAppAutoReplyLedger(ledger);

  // Notify admin inbox so Paid-Ad WhatsApp leads are also visible in real time
  void sendWhatsAppAdminNotification(
    `💬 *PAID-AD WHATSAPP LEAD AUTO-REPLIED (${AUTOREPLY_WHATSAPP_E164})*\n` +
      `• *Customer:* +${cleanPhone} (${input.senderName || 'Ad Visitor'})\n` +
      `• *Message:* ${String(input.incomingMessage || '').slice(0, 90)}\n` +
      `• *Auto-Redirect Sent:* ${built.primaryRedirectUrl}`
  ).catch(() => {});

  return {
    replied: true,
    replyText: built.replyText,
    primaryRedirectUrl: built.primaryRedirectUrl,
    campaign: built.campaign,
    deliveredViaApi,
    deliveryChannels,
  };
}

/**
 * Records when a customer clicks the WhatsApp Auto-Reply Redirect Link (`/go` or `/go/[campaign]`)
 * or Paid-Ad Click-to-WhatsApp Entry Link (`/whatsapp-ad`), updating both the WhatsApp Ledger
 * and the Live Customer Arrival Sensor!
 */
export async function recordWhatsAppRedirectClick(options: {
  campaignSlug: string;
  eventType: 'WEBSITE_REDIRECT_CLICK' | 'PAID_AD_ENTRY_CLICK';
  userAgent?: string;
}): Promise<void> {
  try {
    const ledger = await getWhatsAppAutoReplyLedger();
    const spec = resolveCampaignBySlug(options.campaignSlug);

    if (options.eventType === 'WEBSITE_REDIRECT_CLICK') {
      ledger.totalWebsiteRedirectClicks =
        (ledger.totalWebsiteRedirectClicks || 0) + 1;
      ledger.clicksByCampaign[spec.slug] =
        (ledger.clicksByCampaign[spec.slug] || 0) + 1;
    } else {
      ledger.totalPaidAdEntryClicks = (ledger.totalPaidAdEntryClicks || 0) + 1;
    }

    await saveWhatsAppAutoReplyLedger(ledger);

    if (options.eventType === 'WEBSITE_REDIRECT_CLICK') {
      const sensor = await getSeoCustomerSensorLedger();
      sensor.totalCustomersDetected = (sensor.totalCustomersDetected || 0) + 1;
      sensor.recentCustomers.unshift({
        id: `wa_redir_${Date.now()}`,
        timestamp: new Date().toISOString(),
        sourceLabel: `WhatsApp Auto-Reply (${AUTOREPLY_WHATSAPP_E164})`,
        keywordCluster: spec.label,
        searchQuery: `Paid Ad -> WhatsApp -> ${spec.slug}`,
        landingPath: `/go/${spec.slug}`,
        deviceSummary: (options.userAgent || 'Mobile WhatsApp Browser').slice(0, 60),
      });
      await saveSeoCustomerSensorLedger(sensor);
    }
  } catch {
    // Non-blocking analytics
  }
}

export function isLinkPreviewBot(userAgent: string): boolean {
  const ua = String(userAgent || '').toLowerCase();
  return (
    ua.includes('whatsapp') ||
    ua.includes('facebookexternalhit') ||
    ua.includes('facebot') ||
    ua.includes('meta-externalagent') ||
    ua.includes('twitterbot') ||
    ua.includes('telegrambot') ||
    ua.includes('slackbot') ||
    ua.includes('linkedinbot') ||
    ua.includes('discordbot')
  );
}

export function buildRichPreviewRedirectHtml(
  spec: AutoReplyCampaignSpec
): string {
  const ogImage = `${SITE_ORIGIN}/opengraph-image`;
  const esc = (s: string) =>
    s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${esc(spec.ogTitle)}</title>
  <meta name="description" content="${esc(spec.ogDescription)}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="CBCMATERIALS.SHOP" />
  <meta property="og:title" content="${esc(spec.ogTitle)}" />
  <meta property="og:description" content="${esc(spec.ogDescription)}" />
  <meta property="og:url" content="${esc(spec.shortRedirectUrl)}" />
  <meta property="og:image" content="${esc(ogImage)}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${esc(spec.ogTitle)}" />
  <meta name="twitter:description" content="${esc(spec.ogDescription)}" />
  <meta name="twitter:image" content="${esc(ogImage)}" />
  <meta http-equiv="refresh" content="0;url=${esc(spec.destinationUrl)}" />
  <script>window.location.replace(${JSON.stringify(spec.destinationUrl)});</script>
</head>
<body style="font-family:system-ui,sans-serif;background:#020617;color:#f8fafc;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:24px;text-align:center;">
  <div>
    <p style="font-weight:900;font-size:20px;letter-spacing:0.04em;margin-bottom:8px;">CBCMATERIALS.SHOP</p>
    <p style="font-size:14px;color:#94a3b8;margin-bottom:16px;">Redirecting you from WhatsApp (${AUTOREPLY_WHATSAPP_E164}) to our official website...</p>
    <a href="${esc(spec.destinationUrl)}" style="display:inline-block;background:#10b981;color:#022c22;font-weight:800;padding:12px 24px;border-radius:12px;text-decoration:none;">Tap Here if Not Redirected Automatically</a>
  </div>
</body>
</html>`;
}
