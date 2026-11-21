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
    name: 'WhatsApp Status & Business (0728595160 • Hourly Auto-Status)',
    shortBadge: 'WA',
    allowPosting: true,
    profileUrl: DEFAULT_WHATSAPP_PROFILE_URL,
    placeholder: 'https://wa.me/254728595160',
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
        profileUrl: (
          existing.profileUrl !== undefined && existing.profileUrl !== ''
            ? existing.profileUrl
            : def.profileUrl
        )
          .replace(/254705759072/g, '254728595160')
          .replace(/0705759072/g, '0728595160'),
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
  posterVerticalUrl: string;
  posterCardUrl: string;
  localPosterPath: string;
  materialTitle: string;
  enabledCount: number;
  intents: PlatformLaunchIntent[];
  message: string;
}> {
  const config = await getSocialBroadcasterConfig();
  const activePlatforms = config.platforms.filter((p) => p.allowPosting);

  const selKey = (params.materialId || 'AUTO').trim();

  // Resolve target material or website service
  let targetTitle = '2026 CBC Schemes, Notes, Exams & Gaming Hub (PP1–Grade 12)';
  let targetUrl = params.customTargetUrl?.trim() || 'https://www.cbcmaterials.shop';
  let posterQuery = 'materialId=PORTAL';
  let feedCaption = params.customCaption?.trim() || '';
  let reelComment = '';

  if (selKey === 'SERVICE_GAMING') {
    targetTitle = 'CBC All-Subjects Gaming Arena (PP1–Grade 12 • Play & Earn Rewards)';
    targetUrl = 'https://www.cbcmaterials.shop';
    posterQuery = 'service=GAMING';
    reelComment =
      `🎮 PLAY ALL 21 CBC SUBJECTS & EARN REWARDS:\n` +
      `https://www.cbcmaterials.shop \n` +
      `👍 Follow on Facebook: ${DEFAULT_FACEBOOK_PROFILE_URL} \n` +
      `💬 WhatsApp: https://wa.me/254728595160`;
    if (!feedCaption) {
      feedCaption =
        `🎮 PLAY & REVISE ALL 21 CBC SUBJECTS ON WWW.CBCMATERIALS.SHOP!\n` +
        `✅ End-of-Strand Textbook Exercises (PP1 – Grade 12) • Zero Question Repetition!\n` +
        `✅ 1 Correct Question = 1 Point • 1,000 Points = KSh 5 Cash Reward (KSh 10 for 20-Min Pass)!\n\n` +
        `👉 Tap This Clickable Link to Start Playing:\nhttps://www.cbcmaterials.shop \n\n` +
        `💬 WhatsApp Support: https://wa.me/254728595160 \n` +
        `#CBCKenya #KPSEA2026 #KJSEA2026 #KenyanStudents #CBCGaming #CBCMaterials`;
    }
  } else if (selKey === 'SERVICE_TUITION') {
    targetTitle = 'Personal & Holiday CBC Tuition Teachers (All 47 Counties)';
    targetUrl = 'https://www.cbcmaterials.shop/#holiday-tuition-hub';
    posterQuery = 'service=TUITION';
    reelComment =
      `🎓 BOOK HOME OR ONLINE CBC TUITION / REGISTER AS A TEACHER:\n` +
      `https://www.cbcmaterials.shop \n` +
      `💬 WhatsApp Coordinator: https://wa.me/254728595160`;
    if (!feedCaption) {
      feedCaption =
        `🎓 NEED A VERIFIED HOME OR ONLINE CBC TUITION TEACHER? (PP1 – GRADE 12)\n` +
        `✅ Parents & Learners matched with top subject teachers across all 47 Counties!\n` +
        `✅ Qualified CBC Teachers: Register (KSh 500) for Priority Student Matching!\n\n` +
        `👉 Click Here to Book or Register:\nhttps://www.cbcmaterials.shop \n\n` +
        `💬 WhatsApp Direct: https://wa.me/254728595160 \n` +
        `#HolidayTuitionKenya #TSCTeachers #CBCKenya #KenyanParents #CBCMaterials`;
    }
  } else if (selKey === 'SERVICE_GEMINI') {
    targetTitle = 'Ask Gemini AI CBC Homework & Step-by-Step Revision Hub';
    targetUrl = 'https://www.cbcmaterials.shop';
    posterQuery = 'service=GEMINI';
    reelComment =
      `🤖 ASK GEMINI STEP-BY-STEP CBC HOMEWORK HELP:\n` +
      `https://www.cbcmaterials.shop \n` +
      `💬 WhatsApp: https://wa.me/254728595160`;
    if (!feedCaption) {
      feedCaption =
        `🤖 STUCK ON HOMEWORK? ASK GEMINI ON WWW.CBCMATERIALS.SHOP!\n` +
        `✅ Instant step-by-step worked answers for Maths, Sciences, English, Kiswahili & all CBC subjects (PP1–Grade 12)!\n\n` +
        `👉 Click Here to Try Free & Unlock Full Answers:\nhttps://www.cbcmaterials.shop \n\n` +
        `💬 WhatsApp Support: https://wa.me/254728595160 \n` +
        `#CBCKenya #HomeworkHelpKenya #KPSEA #KJSEA #CBCMaterials`;
    }
  } else if (selKey === 'SERVICE_BOOK_1') {
    targetTitle = 'CBC GRADE UP — 50-Page Book Per Subject + Marking Schemes (KSh 500)';
    targetUrl = 'https://www.cbcmaterials.shop/?book=1';
    posterQuery = 'service=BOOK_1';
    reelComment =
      `📘 GET "CBC GRADE UP" (50-Page Book + Marking Schemes — KSh 500):\n` +
      `https://www.cbcmaterials.shop/?book=1 \n` +
      `💬 WhatsApp: https://wa.me/254728595160`;
    if (!feedCaption) {
      feedCaption =
        `📘 NEW 50-PAGE BOOK PER SUBJECT: "CBC GRADE UP" (PP1 – GRADE 12)!\n` +
        `✅ Relevant questions covering ALL Strands & Sub-strands sequentially!\n` +
        `✅ Complete Marking Schemes & Worked Solutions at the end of every book!\n` +
        `✅ Only KSh 500 via Instant M-Pesa STK Prompt (PDF + Editable DOCX)!\n\n` +
        `👉 Click Here to Download Immediately:\nhttps://www.cbcmaterials.shop/?book=1 \n\n` +
        `💬 WhatsApp Direct: https://wa.me/254728595160 \n` +
        `#CBCGradeUp #CBCKenya #KPSEA2026 #KJSEA2026 #CBCMaterials`;
    }
  } else if (selKey === 'SERVICE_BOOK_2') {
    targetTitle =
      'SUPER-LIGHT CBC COMPILATION — 50-Page Point-Form Notes + Q&A (KSh 750)';
    targetUrl = 'https://www.cbcmaterials.shop/?book=2';
    posterQuery = 'service=BOOK_2';
    reelComment =
      `📗 GET "SUPER-LIGHT CBC COMPILATION" (50-Page Notes + Q&A — KSh 750):\n` +
      `https://www.cbcmaterials.shop/?book=2 \n` +
      `💬 WhatsApp: https://wa.me/254728595160`;
    if (!feedCaption) {
      feedCaption =
        `📗 NEW 50-PAGE REVISION BOOK: "SUPER-LIGHT CBC COMPILATION" (PP1 – GRADE 12)!\n` +
        `✅ Short Point-Form Notes covering EVERYTHING in each Strand & Sub-strand!\n` +
        `✅ Every sub-topic followed immediately by relevant practice questions + Answers!\n` +
        `✅ Only KSh 750 via Instant M-Pesa STK Prompt (PDF + Editable DOCX)!\n\n` +
        `👉 Click Here to Download Immediately:\nhttps://www.cbcmaterials.shop/?book=2 \n\n` +
        `💬 WhatsApp Direct: https://wa.me/254728595160 \n` +
        `#SuperLightCBC #CBCKenya #KPSEA2026 #KJSEA2026 #CBCMaterials`;
    }
  } else if (selKey === 'SERVICE_BOOK_3') {
    targetTitle =
      'SMART CBC ALL SUBJECTS — 100-Page Master Book + All Subjects in Grade (KSh 1,500)';
    targetUrl = 'https://www.cbcmaterials.shop/?book=3';
    posterQuery = 'service=BOOK_3';
    reelComment =
      `📚 GET "SMART CBC ALL SUBJECTS" (100-Page Master Book — KSh 1,500):\n` +
      `https://www.cbcmaterials.shop/?book=3 \n` +
      `💬 WhatsApp: https://wa.me/254728595160`;
    if (!feedCaption) {
      feedCaption =
        `🏆 SMART CBC ALL SUBJECTS (100 PAGES + FULL GRADE SUBJECT ACCESS — KSh 1,500)!\n` +
        `✅ Combines BOTH 50-Page Books: "SUPER-LIGHT CBC COMPILATION" + "CBC GRADE UP"!\n` +
        `✅ Point-Form Notes + Sub-topic Questions + 170 Exam Questions + Full Marking Schemes!\n` +
        `✅ Instant M-Pesa STK Prompt Auto-Download on WWW.CBCMATERIALS.SHOP!\n\n` +
        `👉 Click Here to Get Smart CBC All Subjects:\nhttps://www.cbcmaterials.shop/?book=3 \n\n` +
        `💬 WhatsApp Direct: https://wa.me/254728595160 \n` +
        `#SmartCBC #CBCGradeUp #CBCKenya #KPSEA2026 #KJSEA2026`;
    }
  } else if (selKey === 'SERVICE_PORTAL') {
    targetTitle = '3,400+ 2026 CBC Schemes, Notes, Lesson Plans & KPSEA/KJSEA Exams';
    targetUrl = 'https://www.cbcmaterials.shop';
    posterQuery = 'materialId=PORTAL';
    reelComment =
      `📚 GET ALL 3,400+ CBC SCHEMES, NOTES & EXAMS (WORD + PDF):\n` +
      `https://www.cbcmaterials.shop \n` +
      `💬 WhatsApp: https://wa.me/254728595160`;
    if (!feedCaption) {
      feedCaption =
        `🇰🇪 OFFICIAL KENYA CBC PORTAL — WWW.CBCMATERIALS.SHOP!\n` +
        `✅ 3,400+ Rationalized 2026 Schemes of Work, Lesson Plans, Notes & KPSEA/KJSEA Exams (PP1–Grade 12)\n` +
        `✅ Editable Word (.DOCX) + Print-Ready (.PDF) • Instant 1-Second M-Pesa Auto-Download!\n` +
        `✅ Plus: All-Subjects Gaming Arena, Holiday Tuition & Ask Gemini Q&A!\n\n` +
        `👉 Click Here to Open:\nhttps://www.cbcmaterials.shop \n\n` +
        `💬 WhatsApp Direct: https://wa.me/254728595160 \n` +
        `#CBCKenya #CBCMaterials #TSCTeachers #KPSEA2026 #KJSEA2026`;
    }
  } else if (selKey !== 'AUTO') {
    const { data: item } = await supabaseAdmin
      .from('resources')
      .select('id, title, grade, category, subject, price')
      .eq('id', selKey)
      .maybeSingle();

    if (item) {
      targetTitle = String(item.title);
      targetUrl = `https://www.cbcmaterials.shop/materials/${item.id}`;
      posterQuery = `materialId=${encodeURIComponent(String(item.id))}`;
      const price = Number(item.price) || 50;
      reelComment =
        `📚 DOWNLOAD INSTANTLY (Editable Word + PDF — KES ${price}):\n` +
        `${targetUrl} \n` +
        `🌐 All Services: https://www.cbcmaterials.shop \n` +
        `💬 WhatsApp: https://wa.me/254728595160`;
      if (!feedCaption) {
        feedCaption =
          `🔥 2026 READY: ${item.title}\n` +
          `✅ Editable MS Word (.DOCX) + Print-Ready (.PDF) • Unlocks in 1 Second via M-Pesa (KES ${price})!\n` +
          `👉 Tap Clickable Link to Download:\n${targetUrl} \n` +
          `🌐 Full Website: https://www.cbcmaterials.shop \n` +
          `🎬 Watch Daily CBC Revision Reels on Our Facebook: ${DEFAULT_FACEBOOK_REELS_URL} \n` +
          `💬 WhatsApp Direct: 0728595160\n` +
          `#CBCKenya #KPSEA2026 #KJSEA2026 #TSCTeachers #CBCMaterials`;
      }
    }
  }

  if (!feedCaption) {
    const rotated = await generateRotatingFacebookLinkAds(1);
    const top = rotated[0];
    targetTitle = top.title;
    targetUrl = top.targetUrl;
    posterQuery =
      top.id !== 'portal-flagship'
        ? `materialId=${encodeURIComponent(top.id)}`
        : 'materialId=PORTAL';
    feedCaption = top.feedPostAd;
    reelComment = top.reelFirstCommentAd;
  }
  if (!reelComment) {
    reelComment = `📚 Open now 👉 ${targetUrl} | All CBC Materials: https://www.cbcmaterials.shop`;
  }

  const localPosterPath = `/api/social/poster-image?${posterQuery}&format=vertical`;
  const posterVerticalUrl = `https://www.cbcmaterials.shop${localPosterPath}`;
  const posterCardUrl = `https://www.cbcmaterials.shop/api/social/poster-image?${posterQuery}&format=card`;

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

  // 2. Run Telegram Bot API Direct HD Photo + Clickable Link Broadcast if Telegram is ON
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
        )}/sendPhoto`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: config.telegramChatId.trim(),
            photo: posterVerticalUrl,
            caption: `${targetTitle}\n\n👉 Click to Open: ${targetUrl}\n🌐 Portal: https://www.cbcmaterials.shop\n💬 WhatsApp: https://wa.me/254728595160`,
          }),
        }
      );
      if (tgRes.ok) {
        telegramServerOk = true;
        serverAutoPosted.push('Telegram Channel (HD Image + Link)');
      }
    } catch { }
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
    } catch { }
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
    posterVerticalUrl,
    posterCardUrl,
    localPosterPath,
    materialTitle: targetTitle,
    enabledCount: activePlatforms.length,
    intents,
    message:
      activePlatforms.length === 0
        ? 'All platforms are currently switched OFF. Turn ON at least one platform to post!'
        : `HD Poster Image + Clickable Link ready across ${activePlatforms.length} ON platform(s)${serverAutoPosted.length > 0
          ? ` (${serverAutoPosted.join(', ')} auto-posted!)`
          : ''
        }!`,
  };
}
