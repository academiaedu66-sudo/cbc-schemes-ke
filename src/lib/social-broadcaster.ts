import { supabaseAdmin } from '@/lib/supabase';
import { triggerAutomaticBackup } from '@/lib/security';
import {
  DEFAULT_FACEBOOK_PROFILE_ID,
  DEFAULT_FACEBOOK_PROFILE_URL,
  DEFAULT_FACEBOOK_REELS_URL,
  DEFAULT_WHATSAPP_PROFILE_URL,
  generateRotatingFacebookLinkAds,
  runAutomaticFacebookLinkAdSync,
} from '@/lib/facebook-monetization';
import {
  getStoredMonetizationConfig,
  saveStoredMonetizationConfig,
} from '@/lib/monetization';

const BUCKET_NAME = 'cbc-materials';
const SOCIAL_BROADCASTER_PATH = '_system/social-broadcaster-config.json';

export type SocialPlatformId =
  | 'facebook_feed'
  | 'facebook_reels'
  | 'whatsapp'
  | 'tiktok'
  | 'instagram'
  | 'youtube'
  | 'x_twitter'
  | 'telegram'
  | 'threads'
  | 'linkedin'
  | 'pinterest';

export interface SocialPlatformEntry {
  id: SocialPlatformId;
  name: string;
  shortBadge: string;
  allowPosting: boolean; // ON / OFF switch ("Allow posting or not")
  profileUrl: string;
  placeholder: string;
}

export interface SocialBroadcastHistoryItem {
  id: string;
  timestamp: string;
  materialTitle: string;
  targetUrl: string;
  platformsPosted: string[];
  serverAutoPosted: string[];
}

export interface SocialBroadcasterConfig {
  platforms: SocialPlatformEntry[];
  metaPixelId: string;
  fbPageAccessToken: string;
  metaConversionsApiToken: string;
  telegramBotToken: string;
  telegramChatId: string;
  automationWebhookUrl: string;
  recentBroadcasts: SocialBroadcastHistoryItem[];
  updatedAt: string;
}

export const DEFAULT_SOCIAL_PLATFORMS: SocialPlatformEntry[] = [
  {
    id: 'facebook_feed',
    name: 'Facebook Profile / Page Feed (Monetized Hub)',
    shortBadge: 'FB',
    allowPosting: true,
    profileUrl: DEFAULT_FACEBOOK_PROFILE_URL,
    placeholder: 'https://www.facebook.com/profile.php?id=...',
  },
  {
    id: 'facebook_reels',
    name: 'Facebook Reels (Auto Link-Ads in Reels)',
    shortBadge: 'REELS',
    allowPosting: true,
    profileUrl: DEFAULT_FACEBOOK_REELS_URL,
    placeholder: 'https://www.facebook.com/profile.php?id=...&sk=reels_tab',
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp Business / Status / Channel',
    shortBadge: 'WA',
    allowPosting: true,
    profileUrl: DEFAULT_WHATSAPP_PROFILE_URL,
    placeholder: 'https://wa.me/254705759072 or WhatsApp Channel URL',
  },
  {
    id: 'tiktok',
    name: 'TikTok Profile & Videos',
    shortBadge: 'TT',
    allowPosting: false,
    profileUrl: '',
    placeholder: 'https://www.tiktok.com/@yourusername',
  },
  {
    id: 'instagram',
    name: 'Instagram Profile & Reels',
    shortBadge: 'IG',
    allowPosting: false,
    profileUrl: '',
    placeholder: 'https://www.instagram.com/yourusername',
  },
  {
    id: 'youtube',
    name: 'YouTube Channel & Shorts',
    shortBadge: 'YT',
    allowPosting: false,
    profileUrl: '',
    placeholder: 'https://www.youtube.com/@yourchannel',
  },
  {
    id: 'x_twitter',
    name: 'X (Twitter) Profile',
    shortBadge: 'X',
    allowPosting: false,
    profileUrl: '',
    placeholder: 'https://x.com/yourusername',
  },
  {
    id: 'telegram',
    name: 'Telegram Channel / Group',
    shortBadge: 'TG',
    allowPosting: false,
    profileUrl: '',
    placeholder: 'https://t.me/yourchannel',
  },
  {
    id: 'threads',
    name: 'Threads (by Meta)',
    shortBadge: 'TH',
    allowPosting: false,
    profileUrl: '',
    placeholder: 'https://www.threads.net/@yourusername',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn Profile / Page',
    shortBadge: 'IN',
    allowPosting: false,
    profileUrl: '',
    placeholder: 'https://www.linkedin.com/in/yourprofile',
  },
  {
    id: 'pinterest',
    name: 'Pinterest Boards',
    shortBadge: 'PIN',
    allowPosting: false,
    profileUrl: '',
    placeholder: 'https://www.pinterest.com/yourusername',
  },
];

export function getDefaultSocialBroadcasterConfig(): SocialBroadcasterConfig {
  return {
    platforms: DEFAULT_SOCIAL_PLATFORMS,
    metaPixelId: (process.env.NEXT_PUBLIC_META_PIXEL_ID || '').trim(),
    fbPageAccessToken: (process.env.FACEBOOK_PAGE_ACCESS_TOKEN || '').trim(),
    metaConversionsApiToken: (process.env.META_CONVERSIONS_API_TOKEN || '').trim(),
    telegramBotToken: '',
    telegramChatId: '',
    automationWebhookUrl: '',
    recentBroadcasts: [],
    updatedAt: new Date().toISOString(),
  };
}

export async function getSocialBroadcasterConfig(): Promise<SocialBroadcasterConfig> {
  const defaults = getDefaultSocialBroadcasterConfig();
  try {
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .download(SOCIAL_BROADCASTER_PATH);
    if (error || !data) return defaults;

    const parsed = JSON.parse(await data.text()) as Partial<SocialBroadcasterConfig>;
    const savedMap = new Map(
      (parsed.platforms || []).map((p) => [p.id, p] as const)
    );

    const mergedPlatforms = DEFAULT_SOCIAL_PLATFORMS.map((def) => {
      const existing = savedMap.get(def.id);
      if (!existing) return def;
      return {
        ...def,
        allowPosting:
          typeof existing.allowPosting === 'boolean'
            ? existing.allowPosting
            : def.allowPosting,
        profileUrl:
          existing.profileUrl !== undefined && existing.profileUrl !== ''
            ? existing.profileUrl
            : def.profileUrl,
      };
    });

    return {
      ...defaults,
      ...parsed,
      platforms: mergedPlatforms,
      recentBroadcasts: Array.isArray(parsed.recentBroadcasts)
        ? parsed.recentBroadcasts.slice(0, 25)
        : [],
    };
  } catch {
    return defaults;
  }
}

export async function saveSocialBroadcasterConfig(
  next: SocialBroadcasterConfig
): Promise<SocialBroadcasterConfig> {
  const cleaned: SocialBroadcasterConfig = {
    ...next,
    recentBroadcasts: (next.recentBroadcasts || []).slice(0, 25),
    updatedAt: new Date().toISOString(),
  };

  await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .upload(SOCIAL_BROADCASTER_PATH, Buffer.from(JSON.stringify(cleaned, null, 2), 'utf-8'), {
      contentType: 'application/json',
      upsert: true,
    });

  // Also sync Facebook Profile, Reels, WhatsApp & Meta Pixel directly into Website Monetization Config!
  try {
    const monCfg = await getStoredMonetizationConfig();
    const fbFeed = cleaned.platforms.find((p) => p.id === 'facebook_feed');
    const fbReels = cleaned.platforms.find((p) => p.id === 'facebook_reels');
    const wa = cleaned.platforms.find((p) => p.id === 'whatsapp');

    const profileUrl = fbFeed?.profileUrl?.trim() || DEFAULT_FACEBOOK_PROFILE_URL;
    const reelsUrl = fbReels?.profileUrl?.trim() || DEFAULT_FACEBOOK_REELS_URL;
    const idMatch = profileUrl.match(/[?&]id=(\d{8,24})/);

    monCfg.facebookMonetization = {
      ...monCfg.facebookMonetization,
      enabled: true,
      profileId: idMatch ? idMatch[1] : DEFAULT_FACEBOOK_PROFILE_ID,
      profileUrl,
      reelsUrl,
      whatsappUrl: wa?.profileUrl?.trim() || DEFAULT_WHATSAPP_PROFILE_URL,
      metaPixelId: cleaned.metaPixelId.trim() || monCfg.facebookMonetization.metaPixelId,
      metaConversionsApiToken:
        cleaned.metaConversionsApiToken.trim() ||
        monCfg.facebookMonetization.metaConversionsApiToken,
      fbPageAccessToken:
        cleaned.fbPageAccessToken.trim() ||
        monCfg.facebookMonetization.fbPageAccessToken,
      autoPostFeedAds: Boolean(fbFeed?.allowPosting),
      autoPostReelsComments: Boolean(fbReels?.allowPosting),
      routeAdClicksToFacebook: true,
    };

    await saveStoredMonetizationConfig(monCfg);
  } catch {
    // Non-fatal
  }

  void triggerAutomaticBackup('Mobile Social Broadcaster config saved');
  return cleaned;
}

export interface PlatformLaunchIntent {
  id: SocialPlatformId;
  name: string;
  shortBadge: string;
  launchUrl: string;
  autoPostedOnServer: boolean;
  statusNote: string;
}

/**
 * Builds platform-specific direct post/composer URLs and fires server-side auto-posts
 * strictly for platforms whose ON/OFF toggle (`allowPosting`) is ON!
 */
export async function executeMultiPlatformBroadcast(params: {
  materialId?: string;
  customCaption?: string;
  customTargetUrl?: string;
}): Promise<{
  config: SocialBroadcasterConfig;
  captionUsed: string;
  reelCommentUsed: string;
  targetUrl: string;
  materialTitle: string;
  enabledCount: number;
  intents: PlatformLaunchIntent[];
  message: string;
}> {
  const config = await getSocialBroadcasterConfig();
  const activePlatforms = config.platforms.filter((p) => p.allowPosting);

  // Resolve target material (specific ID or rotating featured material)
  let targetTitle = '2026 CBC Schemes, Notes, Exams & Gaming Hub (PP1–Grade 12)';
  let targetUrl =
    params.customTargetUrl?.trim() ||
    'https://www.cbcmaterials.shop/?utm_source=social_broadcast&utm_medium=facebook_monetized';
  let feedCaption = params.customCaption?.trim() || '';
  let reelComment = '';

  if (params.materialId && params.materialId !== 'AUTO') {
    const { data: item } = await supabaseAdmin
      .from('resources')
      .select('id, title, grade, category, subject, price')
      .eq('id', params.materialId)
      .maybeSingle();

    if (item) {
      targetTitle = String(item.title);
      targetUrl = `https://www.cbcmaterials.shop/materials/${item.id}?utm_source=social_broadcast&utm_medium=facebook_monetized`;
      const price = Number(item.price) || 50;
      reelComment =
        `📚 DOWNLOAD INSTANTLY (Editable Word + PDF — KES ${price}):\n` +
        `👉 ${targetUrl}\n` +
        `👍 Follow on Facebook: ${DEFAULT_FACEBOOK_PROFILE_URL}\n` +
        `💬 WhatsApp: https://wa.me/254705759072`;
      if (!feedCaption) {
        feedCaption =
          `🔥 2026 READY: ${item.title}\n` +
          `✅ Editable MS Word (.DOCX) + Print-Ready (.PDF) • Unlocks in 1 Second via M-Pesa (KES ${price})!\n` +
          `👉 Download Here: ${targetUrl}\n` +
          `🎬 Watch Daily CBC Revision Reels on Our Facebook: ${DEFAULT_FACEBOOK_REELS_URL}\n` +
          `💬 WhatsApp Direct: 0705759072\n` +
          `#CBCKenya #KPSEA2026 #KJSEA2026 #TSCTeachers #CBCMaterials`;
      }
    }
  }

  if (!feedCaption) {
    const rotated = await generateRotatingFacebookLinkAds(1);
    const top = rotated[0];
    targetTitle = top.title;
    targetUrl = top.targetUrl;
    feedCaption = top.feedPostAd;
    reelComment = top.reelFirstCommentAd;
  }
  if (!reelComment) {
    reelComment = `📚 Download here 👉 ${targetUrl} | Follow our Facebook Reels: ${DEFAULT_FACEBOOK_REELS_URL}`;
  }

  const serverAutoPosted: string[] = [];
  const fbFeedOn = activePlatforms.some((p) => p.id === 'facebook_feed');
  const fbReelsOn = activePlatforms.some((p) => p.id === 'facebook_reels');

  // 1. Run Facebook Graph API Auto-Post & Reels Comment Injector if FB token is present
  let fbFeedServerOk = false;
  let fbReelsServerOk = false;
  if ((fbFeedOn || fbReelsOn) && config.fbPageAccessToken.trim()) {
    const fbSync = await runAutomaticFacebookLinkAdSync({
      fbActorId:
        config.platforms.find((p) => p.id === 'facebook_feed')?.profileUrl ||
        DEFAULT_FACEBOOK_PROFILE_ID,
      fbAccessToken: config.fbPageAccessToken.trim(),
      publishFeedPost: fbFeedOn,
      injectReelsLinks: fbReelsOn,
    });
    if (fbSync.feedPostsPublished > 0) {
      fbFeedServerOk = true;
      serverAutoPosted.push('Facebook Feed (Graph API)');
    }
    if (fbSync.reelsUpdated > 0) {
      fbReelsServerOk = true;
      serverAutoPosted.push(`Facebook Reels (${fbSync.reelsUpdated} Reel(s))`);
    }
  }

  // 2. Run Telegram Bot API Direct Broadcast if Telegram is ON and configured
  let telegramServerOk = false;
  const tgPlatform = activePlatforms.find((p) => p.id === 'telegram');
  if (
    tgPlatform &&
    config.telegramBotToken.trim() &&
    config.telegramChatId.trim()
  ) {
    try {
      const tgRes = await fetch(
        `https://api.telegram.org/bot${encodeURIComponent(
          config.telegramBotToken.trim()
        )}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: config.telegramChatId.trim(),
            text: feedCaption,
            disable_web_page_preview: false,
          }),
        }
      );
      if (tgRes.ok) {
        telegramServerOk = true;
        serverAutoPosted.push('Telegram Channel (Bot API)');
      }
    } catch {}
  }

  // 3. Fire Universal Multi-Social Automation Webhook (Make / Zapier / Buffer / n8n) if configured
  if (config.automationWebhookUrl.trim() && activePlatforms.length > 0) {
    try {
      const whRes = await fetch(config.automationWebhookUrl.trim(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          title: targetTitle,
          targetUrl,
          caption: feedCaption,
          reelFirstComment: reelComment,
          facebookMonetizationProfile: DEFAULT_FACEBOOK_PROFILE_URL,
          enabledPlatforms: activePlatforms.map((p) => ({
            id: p.id,
            name: p.name,
            profileUrl: p.profileUrl,
          })),
        }),
      });
      if (whRes.ok) {
        serverAutoPosted.push('Automation Webhook');
      }
    } catch {}
  }

  // 4. Build Direct Launch Intents strictly for ON platforms
  const intents: PlatformLaunchIntent[] = activePlatforms.map((p) => {
    switch (p.id) {
      case 'facebook_feed':
        return {
          id: p.id,
          name: p.name,
          shortBadge: p.shortBadge,
          launchUrl: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
            targetUrl
          )}&quote=${encodeURIComponent(feedCaption)}`,
          autoPostedOnServer: fbFeedServerOk,
          statusNote: fbFeedServerOk
            ? 'Auto-posted live to Facebook Feed via Graph API!'
            : 'Opens Facebook Post Composer with link card & caption ready',
        };
      case 'facebook_reels':
        return {
          id: p.id,
          name: p.name,
          shortBadge: p.shortBadge,
          launchUrl: p.profileUrl || DEFAULT_FACEBOOK_REELS_URL,
          autoPostedOnServer: fbReelsServerOk,
          statusNote: fbReelsServerOk
            ? 'Auto-pasted link ads into your Facebook Reels!'
            : 'Link ad copied to clipboard — opens your Facebook Reels tab to paste',
        };
      case 'whatsapp':
        return {
          id: p.id,
          name: p.name,
          shortBadge: p.shortBadge,
          launchUrl: `https://wa.me/?text=${encodeURIComponent(feedCaption)}`,
          autoPostedOnServer: false,
          statusNote: 'Opens WhatsApp Status / Broadcast / Contacts with full ad pre-filled',
        };
      case 'x_twitter':
        return {
          id: p.id,
          name: p.name,
          shortBadge: p.shortBadge,
          launchUrl: `https://twitter.com/intent/tweet?text=${encodeURIComponent(
            `${targetTitle} — Editable Word & PDF!`
          )}&url=${encodeURIComponent(targetUrl)}`,
          autoPostedOnServer: false,
          statusNote: 'Opens X (Twitter) composer with link & text pre-filled',
        };
      case 'telegram':
        return {
          id: p.id,
          name: p.name,
          shortBadge: p.shortBadge,
          launchUrl: `https://t.me/share/url?url=${encodeURIComponent(
            targetUrl
          )}&text=${encodeURIComponent(feedCaption)}`,
          autoPostedOnServer: telegramServerOk,
          statusNote: telegramServerOk
            ? 'Auto-posted directly to Telegram via Bot API!'
            : 'Opens Telegram Channel/Group share composer',
        };
      case 'threads':
        return {
          id: p.id,
          name: p.name,
          shortBadge: p.shortBadge,
          launchUrl: `https://www.threads.net/intent/post?text=${encodeURIComponent(
            `${feedCaption}`
          )}`,
          autoPostedOnServer: false,
          statusNote: 'Opens Threads post composer with full ad & link pre-filled',
        };
      case 'linkedin':
        return {
          id: p.id,
          name: p.name,
          shortBadge: p.shortBadge,
          launchUrl: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
            targetUrl
          )}`,
          autoPostedOnServer: false,
          statusNote: 'Opens LinkedIn post share card (caption copied to clipboard)',
        };
      case 'pinterest':
        return {
          id: p.id,
          name: p.name,
          shortBadge: p.shortBadge,
          launchUrl: `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(
            targetUrl
          )}&description=${encodeURIComponent(feedCaption)}`,
          autoPostedOnServer: false,
          statusNote: 'Opens Pinterest Pin creator with link & description pre-filled',
        };
      case 'tiktok':
        return {
          id: p.id,
          name: p.name,
          shortBadge: p.shortBadge,
          launchUrl: p.profileUrl || 'https://www.tiktok.com/upload',
          autoPostedOnServer: false,
          statusNote: 'Caption + link copied — opens TikTok to paste in video/bio',
        };
      case 'instagram':
        return {
          id: p.id,
          name: p.name,
          shortBadge: p.shortBadge,
          launchUrl: p.profileUrl || 'https://www.instagram.com/',
          autoPostedOnServer: false,
          statusNote: 'Caption + link copied — opens Instagram Reels/Story',
        };
      case 'youtube':
        return {
          id: p.id,
          name: p.name,
          shortBadge: p.shortBadge,
          launchUrl: p.profileUrl || 'https://studio.youtube.com/',
          autoPostedOnServer: false,
          statusNote: 'Caption + link copied — opens YouTube Channel / Shorts',
        };
    }
  });

  config.recentBroadcasts.unshift({
    id: `bc_${Date.now()}`,
    timestamp: new Date().toISOString(),
    materialTitle: targetTitle,
    targetUrl,
    platformsPosted: activePlatforms.map((p) => p.name),
    serverAutoPosted,
  });
  await saveSocialBroadcasterConfig(config);

  return {
    config,
    captionUsed: feedCaption,
    reelCommentUsed: reelComment,
    targetUrl,
    materialTitle: targetTitle,
    enabledCount: activePlatforms.length,
    intents,
    message:
      activePlatforms.length === 0
        ? 'All platforms are currently switched OFF. Turn ON at least one platform to post!'
        : `Broadcast ready across ${activePlatforms.length} ON platform(s)${
            serverAutoPosted.length > 0
              ? ` (${serverAutoPosted.join(', ')} auto-posted directly!)`
              : ''
          }!`,
  };
}
