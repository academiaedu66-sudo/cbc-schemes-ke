import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';
import {
  CONNECTED_WHATSAPP_STATUS_LOCAL,
  SITE_ORIGIN,
  WEBSITE_BUTTONS_FOR_DAILY_STATUS,
  getEatDateAndHour,
  type WebsiteButtonStatusSpec,
} from '@/lib/whatsapp-status-autoposter';

const BUCKET_NAME = 'cbc-materials';
const OMNICHANNEL_CONFIG_PATH = '_system/omnichannel-social-seo.json';
const INDEXNOW_KEY = 'cbcmaterials2026seokey8842a9f1e3d7';

export interface OmnichannelSocialProfiles {
  tiktokUrl: string;
  youtubeUrl: string;
  facebookPageUrl: string;
  facebookReelsUrl: string;
  xTwitterUrl: string;
}

export interface OmnichannelSocialConfig {
  enabled: boolean;
  profiles: OmnichannelSocialProfiles;
  // Optional Direct Server Auto-Publish Credentials
  fbPageId: string;
  fbPageAccessToken: string;
  xApiKey: string;
  xApiSecret: string;
  xAccessToken: string;
  xAccessTokenSecret: string;
  xBearerUserToken: string;
  tiktokAccessToken: string;
  youtubeClientId: string;
  youtubeClientSecret: string;
  youtubeRefreshToken: string;
  automationWebhookUrl: string;
  updatedAt: string;
}

export interface OmnichannelDispatchLog {
  id: string;
  dispatchedAtIso: string;
  dateEat: string;
  buttonId: string;
  buttonLabel: string;
  topicHubUrl: string;
  videoWatchUrl: string;
  channelsTriggered: string[];
  indexNowSubmitted: boolean;
}

export interface OmnichannelSocialLedger {
  dateEat: string;
  postedButtonIdsToday: string[];
  totalDispatchesAllTime: number;
  history: OmnichannelDispatchLog[];
}

export interface OmnichannelButtonSeoPack {
  buttonId: string;
  orderIndex: number;
  buttonLabel: string;
  priceBadge: string;
  topicSlug: string;
  topicHubUrl: string;
  clickableUrl: string;
  videoWatchUrl: string;
  musicalStoryUrl: string;
  posterVerticalUrl: string;
  posterCardUrl: string;
  softSongUrl: string;
  ocrTopBanner: string;
  ocrBottomCta: string;
  youtubeTitle: string;
  youtubeDescription: string;
  youtubePinnedComment: string;
  youtubeTags: string[];
  tiktokCaption: string;
  facebookPost: string;
  facebookReelFirstComment: string;
  xTweetText: string;
  shareIntents: {
    xTwitterIntentUrl: string;
    facebookShareUrl: string;
    facebookReelsUploadUrl: string;
    tiktokUploadUrl: string;
    youtubeStudioUploadUrl: string;
    whatsappShareUrl: string;
  };
}

const BUTTON_TO_SEO_TOPIC_SLUG: Record<string, string> = {
  'btn-book-1': 'cbc-revision-books',
  'btn-book-2': 'teachers-notes',
  'btn-book-3': 'cbc-revision-books',
  'btn-national-kjsea': 'kjsea-exams',
  'btn-all-materials': 'cbcmaterials',
  'btn-ask-gemini': 'cbc',
  'btn-side-hustles': 'tsc-services',
  'btn-tsc-services': 'tsc-services',
  'btn-counselling': 'cbc',
  'btn-gaming-arena': 'cbc',
  'btn-tuition-hub': 'tuition-and-tutors',
  'btn-cat-schemes': 'schemes-of-work',
  'btn-cat-lesson-plans': 'cbc-lesson-plans',
  'btn-cat-notes': 'teachers-notes',
  'btn-cat-records': 'records-of-work',
  'btn-cat-exams': 'knec-examinations',
  'btn-cat-holiday': 'holiday-assignments',
  'btn-cat-designs': 'senior-school-pathways',
};

export const DEFAULT_OMNICHANNEL_PROFILES: OmnichannelSocialProfiles = {
  facebookPageUrl: 'https://www.facebook.com/profile.php?id=61591027359399',
  facebookReelsUrl:
    'https://www.facebook.com/profile.php?id=61591027359399&sk=reels_tab',
  tiktokUrl: 'https://www.tiktok.com/@cbcmaterials.shop',
  youtubeUrl: 'https://www.youtube.com/@cbcmaterials',
  xTwitterUrl: 'https://x.com/cbcmaterials_ke',
};

export function getDefaultOmnichannelConfig(): OmnichannelSocialConfig {
  return {
    enabled: true,
    profiles: { ...DEFAULT_OMNICHANNEL_PROFILES },
    fbPageId: (process.env.FACEBOOK_PAGE_ID || '61591027359399').trim(),
    fbPageAccessToken: (process.env.FACEBOOK_PAGE_ACCESS_TOKEN || '').trim(),
    xApiKey: (process.env.X_API_KEY || '').trim(),
    xApiSecret: (process.env.X_API_SECRET || '').trim(),
    xAccessToken: (process.env.X_ACCESS_TOKEN || '').trim(),
    xAccessTokenSecret: (process.env.X_ACCESS_TOKEN_SECRET || '').trim(),
    xBearerUserToken: (process.env.X_USER_BEARER_TOKEN || '').trim(),
    tiktokAccessToken: (process.env.TIKTOK_ACCESS_TOKEN || '').trim(),
    youtubeClientId: (process.env.YOUTUBE_CLIENT_ID || '').trim(),
    youtubeClientSecret: (process.env.YOUTUBE_CLIENT_SECRET || '').trim(),
    youtubeRefreshToken: (process.env.YOUTUBE_REFRESH_TOKEN || '').trim(),
    automationWebhookUrl: (process.env.SOCIAL_AUTOMATION_WEBHOOK_URL || '').trim(),
    updatedAt: new Date().toISOString(),
  };
}

interface StoredOmnichannelState {
  config: OmnichannelSocialConfig;
  ledger: OmnichannelSocialLedger;
}

export async function getOmnichannelState(): Promise<StoredOmnichannelState> {
  const { dateEat } = getEatDateAndHour();
  const defConfig = getDefaultOmnichannelConfig();
  const defLedger: OmnichannelSocialLedger = {
    dateEat,
    postedButtonIdsToday: [],
    totalDispatchesAllTime: 0,
    history: [],
  };

  try {
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .download(OMNICHANNEL_CONFIG_PATH);

    if (error || !data) {
      return { config: defConfig, ledger: defLedger };
    }

    const parsed = JSON.parse(await data.text()) as Partial<StoredOmnichannelState>;
    const mergedConfig: OmnichannelSocialConfig = {
      ...defConfig,
      ...(parsed.config || {}),
      profiles: {
        ...defConfig.profiles,
        ...(parsed.config?.profiles || {}),
      },
    };

    const rawLedger = parsed.ledger;
    const isSameDay = rawLedger?.dateEat === dateEat;
    const mergedLedger: OmnichannelSocialLedger = {
      dateEat,
      postedButtonIdsToday:
        isSameDay && Array.isArray(rawLedger?.postedButtonIdsToday)
          ? rawLedger.postedButtonIdsToday
          : [],
      totalDispatchesAllTime: Number(rawLedger?.totalDispatchesAllTime) || 0,
      history: Array.isArray(rawLedger?.history)
        ? rawLedger.history.slice(0, 40)
        : [],
    };

    return { config: mergedConfig, ledger: mergedLedger };
  } catch {
    return { config: defConfig, ledger: defLedger };
  }
}

export async function saveOmnichannelState(
  state: StoredOmnichannelState
): Promise<void> {
  state.config.updatedAt = new Date().toISOString();
  state.ledger.history = (state.ledger.history || []).slice(0, 40);

  await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .upload(
      OMNICHANNEL_CONFIG_PATH,
      Buffer.from(JSON.stringify(state, null, 2), 'utf-8'),
      {
        contentType: 'application/json',
        upsert: true,
      }
    );
}

export function buildOmnichannelButtonSeoPack(
  spec: WebsiteButtonStatusSpec,
  dateEat?: string
): OmnichannelButtonSeoPack {
  const dayStr = dateEat || getEatDateAndHour().dateEat;
  const daySeed = dayStr
    .split('-')
    .reduce((acc, part) => acc + (parseInt(part, 10) || 0), 0);
  const headline = spec.headlines[(daySeed + spec.orderIndex) % spec.headlines.length];
  const topicSlug = BUTTON_TO_SEO_TOPIC_SLUG[spec.buttonId] || 'cbc';
  const topicHubUrl = `${SITE_ORIGIN}/topics/${topicSlug}`;
  const videoWatchUrl = `${SITE_ORIGIN}/videos/${spec.buttonId}`;
  const posterVerticalUrl = `${SITE_ORIGIN}/api/social/poster-image?service=${encodeURIComponent(
    spec.posterServiceCode
  )}&day=${encodeURIComponent(dayStr)}&format=vertical`;
  const posterCardUrl = `${SITE_ORIGIN}/api/social/poster-image?service=${encodeURIComponent(
    spec.posterServiceCode
  )}&day=${encodeURIComponent(dayStr)}&format=card`;

  const cleanLabel = spec.buttonLabel.replace(/^\d+\.\s*/, '');
  const youtubeTitle =
    `2026 ${cleanLabel} | CBCMaterials Kenya (cbcmaterials.shop) #Shorts`.slice(
      0,
      99
    );

  const youtubeDescription =
    `👉 Download Instantly Here: ${spec.clickableUrl}\n` +
    `📚 Full ${cleanLabel} SEO Catalog: ${topicHubUrl}\n` +
    `🌐 Official Website: ${SITE_ORIGIN}\n\n` +
    `${headline}\n` +
    `${spec.subheadline}\n\n` +
    `✅ 2026 KICD-Rationalized Competency-Based Curriculum (CBC) Materials (PP1, PP2, Grades 1–12)\n` +
    `✅ Editable Microsoft Word (.DOCX) + Print-Ready (.PDF) Formats\n` +
    `✅ Covers CBC Schemes of Work, Teachers Notes, Lesson Plans, Records of Work, KNEC KJSEA & KPSEA Examinations + Official Marking Schemes, TSC TPAD Services, and Verified Home & Online Tuition Tutors Across All 47 Counties in Kenya.\n` +
    `✅ Instant 1-Second M-Pesa STK Prompt Unlock (${spec.priceBadge}) • WhatsApp: ${CONNECTED_WHATSAPP_STATUS_LOCAL}\n\n` +
    `🔎 Search "cbcmaterials.shop" on Google or Chrome anytime!\n` +
    `${spec.hashtags} #CBCKenya #CBCMaterials #SchemesOfWork #TeachersNotes #KNEC #KJSEA2026 #KPSEA2026 #TSC #TuitionKenya #Shorts`;

  const youtubePinnedComment =
    `📌 DIRECT INSTANT DOWNLOAD (${spec.priceBadge}):\n` +
    `👉 ${spec.clickableUrl}\n` +
    `🔎 Or search "cbcmaterials.shop" on Google! WhatsApp: ${CONNECTED_WHATSAPP_STATUS_LOCAL}`;

  const tiktokCaption =
    `🔥 ${headline} (${spec.priceBadge})\n` +
    `✅ ${spec.subheadline}\n` +
    `🔎 Search "cbcmaterials.shop" on Google or tap link in bio 👉 ${SITE_ORIGIN.replace(
      'https://',
      ''
    )}\n` +
    `📲 M-Pesa / WhatsApp: ${CONNECTED_WHATSAPP_STATUS_LOCAL}\n` +
    `${spec.hashtags} #cbcmaterials #cbckenya #kjsea2026 #kpsea2026 #schemesofwork #teachersoftiktokkenya #knec #tsc`;

  const facebookPost =
    `🇰🇪 *${cleanLabel}* — 2026 OFFICIAL CBCMATERIALS KENYA UPDATE!\n\n` +
    `✨ ${headline}\n` +
    `✅ ${spec.subheadline}\n` +
    `💳 *${spec.priceBadge}* (Works seamlessly with M-Pesa & Fuliza — Auto-Downloads in 1 Second!)\n\n` +
    `👉 *Tap Clickable Link to Open Immediately:*\n${spec.clickableUrl}\n\n` +
    `🎬 *Watch Video & Topic Hub:*\n${videoWatchUrl}\n\n` +
    `📲 WhatsApp / M-Pesa: ${CONNECTED_WHATSAPP_STATUS_LOCAL}\n` +
    `${spec.hashtags} #CBCMaterials #CBCKenya #TSCTeachers #KJSEA2026 #SchemesOfWork`;

  const facebookReelFirstComment =
    `📚 OPEN "${cleanLabel}" INSTANTLY HERE 👉 ${spec.clickableUrl} | Topic Hub: ${topicHubUrl} | WhatsApp: ${CONNECTED_WHATSAPP_STATUS_LOCAL}`;

  // X (Twitter) tweet kept <= 275 chars (URL counts as 23 chars on X)
  const shortTweetHeadline =
    headline.length > 125 ? `${headline.slice(0, 122)}...` : headline;
  const xTweetText =
    `🇰🇪 ${shortTweetHeadline}\n` +
    `✅ ${spec.priceBadge} (Word + PDF)\n` +
    `👉 ${spec.clickableUrl}\n` +
    `#CBCKenya #CBCMaterials #KJSEA2026 #KNEC #TSC`;

  return {
    buttonId: spec.buttonId,
    orderIndex: spec.orderIndex,
    buttonLabel: spec.buttonLabel,
    priceBadge: spec.priceBadge,
    topicSlug,
    topicHubUrl,
    clickableUrl: spec.clickableUrl,
    videoWatchUrl,
    musicalStoryUrl: spec.musicalStoryUrl,
    posterVerticalUrl,
    posterCardUrl,
    softSongUrl: `${SITE_ORIGIN}/audio/whatsapp-status-soft-song.mp3`,
    ocrTopBanner: `SEARCH "CBCMATERIALS.SHOP" ON GOOGLE`,
    ocrBottomCta: `${spec.priceBadge} • WWW.CBCMATERIALS.SHOP`,
    youtubeTitle,
    youtubeDescription,
    youtubePinnedComment,
    youtubeTags: [
      'CBCMaterials',
      'cbcmaterials.shop',
      'CBC Kenya',
      '2026 CBC Schemes of Work',
      'CBC Teachers Notes',
      'KNEC Examinations',
      'KJSEA 2026',
      'KPSEA 2026',
      'TSC TPAD',
      'CBC Tuition Tutors Kenya',
      cleanLabel,
    ],
    tiktokCaption,
    facebookPost,
    facebookReelFirstComment,
    xTweetText,
    shareIntents: {
      xTwitterIntentUrl: `https://x.com/intent/tweet?text=${encodeURIComponent(
        xTweetText
      )}`,
      facebookShareUrl: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        videoWatchUrl
      )}&quote=${encodeURIComponent(facebookPost)}`,
      facebookReelsUploadUrl: DEFAULT_OMNICHANNEL_PROFILES.facebookReelsUrl,
      tiktokUploadUrl: 'https://www.tiktok.com/tiktokstudio/upload',
      youtubeStudioUploadUrl: 'https://studio.youtube.com/',
      whatsappShareUrl: `https://wa.me/?text=${encodeURIComponent(facebookPost)}`,
    },
  };
}

export function getAllOmnichannelButtonSeoPacks(
  dateEat?: string
): OmnichannelButtonSeoPack[] {
  const day = dateEat || getEatDateAndHour().dateEat;
  return WEBSITE_BUTTONS_FOR_DAILY_STATUS.map((spec) =>
    buildOmnichannelButtonSeoPack(spec, day)
  );
}

/**
 * Signs an OAuth 1.0a request for X (Twitter) API v2 (`POST https://api.twitter.com/2/tweets`)
 * using standard Developer Portal Consumer Key/Secret + User Access Token/Secret.
 */
function buildXTwitterOauth1Header(params: {
  method: string;
  url: string;
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  accessTokenSecret: string;
}): string {
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: params.apiKey,
    oauth_nonce: crypto.randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: params.accessToken,
    oauth_version: '1.0',
  };

  const pctEncode = (str: string) =>
    encodeURIComponent(str).replace(
      /[!'()*]/g,
      (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`
    );

  const paramString = Object.keys(oauthParams)
    .sort()
    .map((k) => `${pctEncode(k)}=${pctEncode(oauthParams[k])}`)
    .join('&');

  const signatureBase = [
    params.method.toUpperCase(),
    pctEncode(params.url),
    pctEncode(paramString),
  ].join('&');

  const signingKey = `${pctEncode(params.apiSecret)}&${pctEncode(
    params.accessTokenSecret
  )}`;
  const signature = crypto
    .createHmac('sha1', signingKey)
    .update(signatureBase)
    .digest('base64');

  oauthParams.oauth_signature = signature;

  const headerParts = Object.keys(oauthParams)
    .sort()
    .map((k) => `${pctEncode(k)}="${pctEncode(oauthParams[k])}"`)
    .join(', ');

  return `OAuth ${headerParts}`;
}

async function publishDirectToXTwitter(
  config: OmnichannelSocialConfig,
  text: string
): Promise<boolean> {
  const endpoint = 'https://api.twitter.com/2/tweets';
  try {
    if (config.xBearerUserToken.trim()) {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.xBearerUserToken.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
        signal: AbortSignal.timeout(10000),
      });
      if (res.ok) return true;
    }

    if (
      config.xApiKey.trim() &&
      config.xApiSecret.trim() &&
      config.xAccessToken.trim() &&
      config.xAccessTokenSecret.trim()
    ) {
      const authHeader = buildXTwitterOauth1Header({
        method: 'POST',
        url: endpoint,
        apiKey: config.xApiKey.trim(),
        apiSecret: config.xApiSecret.trim(),
        accessToken: config.xAccessToken.trim(),
        accessTokenSecret: config.xAccessTokenSecret.trim(),
      });
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
        signal: AbortSignal.timeout(10000),
      });
      if (res.ok) return true;
    }
  } catch {}
  return false;
}

async function publishDirectToFacebookPage(
  config: OmnichannelSocialConfig,
  pack: OmnichannelButtonSeoPack
): Promise<boolean> {
  const token = config.fbPageAccessToken.trim();
  const pageId = config.fbPageId.trim() || 'me';
  if (!token) return false;
  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${encodeURIComponent(pageId)}/photos`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: pack.posterVerticalUrl,
          caption: pack.facebookPost,
          access_token: token,
        }),
        signal: AbortSignal.timeout(12000),
      }
    );
    return res.ok;
  } catch {
    return false;
  }
}

async function publishDirectToTikTokPhotoMode(
  config: OmnichannelSocialConfig,
  pack: OmnichannelButtonSeoPack
): Promise<boolean> {
  const token = config.tiktokAccessToken.trim();
  if (!token) return false;
  try {
    const res = await fetch(
      'https://open.tiktokapis.com/v2/post/publish/content/init/',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json; charset=UTF-8',
        },
        body: JSON.stringify({
          post_info: {
            title: pack.buttonLabel.slice(0, 85),
            description: pack.tiktokCaption.slice(0, 2100),
            privacy_level: 'PUBLIC_TO_EVERYONE',
            auto_add_music: true,
          },
          source_info: {
            source: 'PULL_FROM_URL',
            photo_cover_index: 0,
            photo_images: [pack.posterVerticalUrl],
          },
          post_mode: 'DIRECT_POST',
          media_type: 'PHOTO',
        }),
        signal: AbortSignal.timeout(12000),
      }
    );
    return res.ok;
  } catch {
    return false;
  }
}

async function pingSearchEnginesForSocialUrls(urls: string[]): Promise<boolean> {
  const payload = {
    host: 'www.cbcmaterials.shop',
    key: INDEXNOW_KEY,
    keyLocation: `${SITE_ORIGIN}/${INDEXNOW_KEY}.txt`,
    urlList: urls,
  };
  let anyOk = false;
  for (const endpoint of [
    'https://api.indexnow.org/indexnow',
    'https://www.bing.com/indexnow',
  ]) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(8000),
      });
      if (res.status >= 200 && res.status < 300) {
        anyOk = true;
      }
    } catch {}
  }
  return anyOk;
}

export async function runScheduledOmnichannelSocialRanker(options?: {
  forceButtonId?: string;
}): Promise<{
  ok: boolean;
  posted: boolean;
  pack: OmnichannelButtonSeoPack;
  channelsTriggered: string[];
  indexNowSubmitted: boolean;
  postedTodayCount: number;
  totalButtons: number;
}> {
  const state = await getOmnichannelState();
  const { dateEat } = getEatDateAndHour();

  let targetSpec: WebsiteButtonStatusSpec | undefined;
  if (options?.forceButtonId) {
    targetSpec = WEBSITE_BUTTONS_FOR_DAILY_STATUS.find(
      (b) => b.buttonId === options.forceButtonId
    );
  }
  if (!targetSpec) {
    targetSpec =
      WEBSITE_BUTTONS_FOR_DAILY_STATUS.find(
        (b) => !state.ledger.postedButtonIdsToday.includes(b.buttonId)
      ) || WEBSITE_BUTTONS_FOR_DAILY_STATUS[0];
  }

  const pack = buildOmnichannelButtonSeoPack(targetSpec, dateEat);
  const channelsTriggered: string[] = [
    'Public Google VideoObject Hub (/videos/' + pack.buttonId + ')',
    'RSS 2.0 Social Syndication Feed (/social-feed.xml)',
  ];

  const [xOk, fbOk, ttOk] = await Promise.all([
    publishDirectToXTwitter(state.config, pack.xTweetText),
    publishDirectToFacebookPage(state.config, pack),
    publishDirectToTikTokPhotoMode(state.config, pack),
  ]);

  if (xOk) channelsTriggered.push('X / Twitter API v2 (Auto-Tweeted)');
  if (fbOk) channelsTriggered.push('Facebook Page Feed (Graph API)');
  if (ttOk) channelsTriggered.push('TikTok Content API v2 (Photo/Music Mode)');

  if (state.config.automationWebhookUrl.trim()) {
    try {
      const whRes = await fetch(state.config.automationWebhookUrl.trim(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'omnichannel_social_seo_dispatch',
          timestamp: new Date().toISOString(),
          profiles: state.config.profiles,
          pack,
        }),
        signal: AbortSignal.timeout(10000),
      });
      if (whRes.ok) {
        channelsTriggered.push('Multi-Social Webhook (TikTok/YT/FB/X)');
      }
    } catch {}
  }

  const indexNowSubmitted = await pingSearchEnginesForSocialUrls([
    SITE_ORIGIN,
    pack.videoWatchUrl,
    pack.musicalStoryUrl,
    pack.topicHubUrl,
    `${SITE_ORIGIN}/videos`,
    `${SITE_ORIGIN}/social-feed.xml`,
  ]);

  if (!state.ledger.postedButtonIdsToday.includes(pack.buttonId)) {
    state.ledger.postedButtonIdsToday.push(pack.buttonId);
  }
  state.ledger.totalDispatchesAllTime += 1;
  state.ledger.history.unshift({
    id: `omni_${Date.now()}`,
    dispatchedAtIso: new Date().toISOString(),
    dateEat,
    buttonId: pack.buttonId,
    buttonLabel: pack.buttonLabel,
    topicHubUrl: pack.topicHubUrl,
    videoWatchUrl: pack.videoWatchUrl,
    channelsTriggered,
    indexNowSubmitted,
  });

  await saveOmnichannelState(state);

  return {
    ok: true,
    posted: true,
    pack,
    channelsTriggered,
    indexNowSubmitted,
    postedTodayCount: state.ledger.postedButtonIdsToday.length,
    totalButtons: WEBSITE_BUTTONS_FOR_DAILY_STATUS.length,
  };
}
