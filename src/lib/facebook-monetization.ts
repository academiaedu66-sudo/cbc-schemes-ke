import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';

const BUCKET_NAME = 'cbc-materials';
const FB_AUTOPOST_LEDGER_PATH = '_system/facebook-autopost-ledger.json';

export const DEFAULT_FACEBOOK_PROFILE_ID = '61591027359399';
export const DEFAULT_FACEBOOK_PROFILE_URL =
  'https://www.facebook.com/profile.php?id=61591027359399';
export const DEFAULT_FACEBOOK_REELS_URL =
  'https://www.facebook.com/profile.php?id=61591027359399&sk=reels_tab';
export const DEFAULT_WHATSAPP_PHONE_INTL = '254728595160';
export const DEFAULT_WHATSAPP_PROFILE_URL =
  'https://wa.me/254728595160?text=Hello%2C%20I%20saw%20your%20WhatsApp%20Status%20and%20visited%20cbcmaterials.shop';

export interface GeneratedFacebookLinkAd {
  id: string;
  title: string;
  gradeLabel: string;
  category: string;
  targetUrl: string;
  whatsappUrl: string;
  reelCaptionAd: string;
  reelFirstCommentAd: string;
  feedPostAd: string;
  facebookShareUrl: string;
  whatsappStatusShareUrl: string;
}

export interface FacebookAutopostLogItem {
  id: string;
  timestamp: string;
  channel: 'reel_comment' | 'reel_caption' | 'feed_post' | 'post_comment';
  fbObjectId: string;
  materialTitle: string;
  targetUrl: string;
  status: 'PUBLISHED' | 'SKIPPED' | 'ERROR';
  detail?: string;
}

export interface FacebookAutopostLedger {
  commentedReelIds: string[];
  commentedPostIds: string[];
  lastPublishedMaterialIds: string[];
  totalReelsMonetized: number;
  totalFeedAdsPublished: number;
  totalCapiEventsSent: number;
  lastSyncAt: string | null;
  recentLogs: FacebookAutopostLogItem[];
}

function getEmptyAutopostLedger(): FacebookAutopostLedger {
  return {
    commentedReelIds: [],
    commentedPostIds: [],
    lastPublishedMaterialIds: [],
    totalReelsMonetized: 0,
    totalFeedAdsPublished: 0,
    totalCapiEventsSent: 0,
    lastSyncAt: null,
    recentLogs: [],
  };
}

export async function getFacebookAutopostLedger(): Promise<FacebookAutopostLedger> {
  try {
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .download(FB_AUTOPOST_LEDGER_PATH);
    if (error || !data) return getEmptyAutopostLedger();
    const parsed = JSON.parse(await data.text()) as Partial<FacebookAutopostLedger>;
    return {
      commentedReelIds: Array.isArray(parsed.commentedReelIds) ? parsed.commentedReelIds : [],
      commentedPostIds: Array.isArray(parsed.commentedPostIds) ? parsed.commentedPostIds : [],
      lastPublishedMaterialIds: Array.isArray(parsed.lastPublishedMaterialIds)
        ? parsed.lastPublishedMaterialIds
        : [],
      totalReelsMonetized: Number(parsed.totalReelsMonetized) || 0,
      totalFeedAdsPublished: Number(parsed.totalFeedAdsPublished) || 0,
      totalCapiEventsSent: Number(parsed.totalCapiEventsSent) || 0,
      lastSyncAt: parsed.lastSyncAt || null,
      recentLogs: Array.isArray(parsed.recentLogs) ? parsed.recentLogs.slice(0, 40) : [],
    };
  } catch {
    return getEmptyAutopostLedger();
  }
}

export async function saveFacebookAutopostLedger(
  ledger: FacebookAutopostLedger
): Promise<void> {
  ledger.commentedReelIds = ledger.commentedReelIds.slice(-500);
  ledger.commentedPostIds = ledger.commentedPostIds.slice(-500);
  ledger.lastPublishedMaterialIds = ledger.lastPublishedMaterialIds.slice(-100);
  ledger.recentLogs = ledger.recentLogs.slice(0, 40);

  await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .upload(FB_AUTOPOST_LEDGER_PATH, Buffer.from(JSON.stringify(ledger, null, 2), 'utf-8'), {
      contentType: 'application/json',
      upsert: true,
    });
}

function formatGradeTag(grade: number, title: string): string {
  const up = title.toUpperCase();
  if (up.includes('PP1') || grade === -1) return 'PP1';
  if (up.includes('PP2') || grade === 0) return 'PP2';
  return `Grade ${grade}`;
}

/**
 * Generates high-converting Kenyan CBC Content Link Ads from live catalog materials
 * ready for automatic pasting into Facebook Reels captions, Reels first-comments,
 * Facebook Feed posts, Stories, and WhatsApp Status!
 */
export async function generateRotatingFacebookLinkAds(
  count = 6,
  excludeIds: string[] = []
): Promise<GeneratedFacebookLinkAd[]> {
  const excludeSet = new Set(excludeIds);
  const { data: rows } = await supabaseAdmin
    .from('resources')
    .select('id, title, grade, category, subject, term, price')
    .order('created_at', { ascending: false })
    .limit(180);

  const pool = (rows || []).filter((r) => !excludeSet.has(String(r.id)));
  const sourceList = pool.length >= count ? pool : rows || [];

  // Deterministic time-rotating slice so every sync picks fresh grades & subjects
  const hourBucket = Math.floor(Date.now() / (1000 * 60 * 30));
  const selected: typeof sourceList = [];
  if (sourceList.length > 0) {
    const step = Math.max(1, Math.floor(sourceList.length / Math.max(1, count)));
    for (let i = 0; i < Math.min(count, sourceList.length); i++) {
      const idx = (hourBucket + i * step) % sourceList.length;
      const item = sourceList[idx];
      if (item && !selected.some((s) => s.id === item.id)) {
        selected.push(item);
      }
    }
  }

  const ads: GeneratedFacebookLinkAd[] = selected.map((r) => {
    const gLabel = formatGradeTag(Number(r.grade), String(r.title || ''));
    const price = Number(r.price) || 50;
    const targetUrl = `https://www.cbcmaterials.shop/materials/${r.id}`;
    const waText = `Hello! I saw your Facebook post for "${r.title}" (KES ${price}) on cbcmaterials.shop and would like to get it.`;
    const whatsappUrl = `https://wa.me/${DEFAULT_WHATSAPP_PHONE_INTL}?text=${encodeURIComponent(waText)}`;

    const reelFirstCommentAd =
      `📚 DOWNLOAD INSTANTLY (${gLabel} • Editable Word + PDF — KES ${price}):\n` +
      `${targetUrl} \n` +
      `🎮 Play All-Subjects CBC Gaming & Book Tuition:\n` +
      `https://www.cbcmaterials.shop \n` +
      `💬 WhatsApp Direct: https://wa.me/${DEFAULT_WHATSAPP_PHONE_INTL}`;

    const reelCaptionAd =
      `🔥 2026 ${gLabel} ${r.subject || 'CBC'} ${r.category || 'Materials'} Ready! (${r.title})\n` +
      `✅ Editable Word (.DOCX) + Print-Ready (.PDF) • Unlocks in 1 Second via M-Pesa!\n` +
      `👇 Tap the link below to download:\n` +
      `${targetUrl} \n` +
      `📲 WhatsApp Support: 0728595160\n` +
      `#CBCKenya #KPSEA2026 #KJSEA2026 #KenyanTeachers #TSCTeachers #CBCMaterials`;

    const feedPostAd =
      `🇰🇪 TEACHERS, PARENTS & LEARNERS — 2026 ${gLabel.toUpperCase()} ${(r.subject || 'CBC').toUpperCase()} READY!\n\n` +
      `📄 ${r.title}\n` +
      `✔️ Includes BOTH Editable MS Word (.DOCX) & Print-Ready (.PDF)\n` +
      `✔️ Rationalized Term 1, 2 & 3 Coverage • Instant M-Pesa Auto-Download (KES ${price})\n` +
      `✔️ Plus: All-Subjects CBC Revision Gaming Arena & Verified Holiday Tuition Teachers!\n\n` +
      `👉 Download Now:\n${targetUrl} \n\n` +
      `🌐 Full Website: https://www.cbcmaterials.shop \n` +
      `💬 Chat on WhatsApp: https://wa.me/${DEFAULT_WHATSAPP_PHONE_INTL} \n\n` +
      `#CBCKenya #CBCMaterials #KPSEA #KJSEA #SeniorSchoolKenya #KenyanParents #TSCKenya`;

    const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      targetUrl
    )}&quote=${encodeURIComponent(feedPostAd)}`;

    const whatsappStatusShareUrl = `https://wa.me/?text=${encodeURIComponent(
      `${reelCaptionAd}`
    )}`;

    return {
      id: String(r.id),
      title: String(r.title),
      gradeLabel: gLabel,
      category: String(r.category || 'CBC Resource'),
      targetUrl,
      whatsappUrl,
      reelCaptionAd,
      reelFirstCommentAd,
      feedPostAd,
      facebookShareUrl,
      whatsappStatusShareUrl,
    };
  });

  // Always include a flagship Portal + Gaming + Tuition promo ad if catalog returned empty
  if (ads.length === 0) {
    const portalUrl =
      'https://www.cbcmaterials.shop/?utm_source=facebook_reels&utm_medium=monetized_ad&utm_campaign=flagship';
    const commentAd =
      `📚 Download 3,400+ 2026 CBC Schemes, Notes, Lesson Plans & KPSEA/KJSEA Exams (PP1–Grade 12) 👉 ${portalUrl} | 💬 WhatsApp: https://wa.me/${DEFAULT_WHATSAPP_PHONE_INTL}`;
    ads.push({
      id: 'portal-flagship',
      title: '3,400+ 2026 CBC Schemes, Notes, Exams & Subject Gaming Hub (PP1–Grade 12)',
      gradeLabel: 'PP1–Grade 12',
      category: 'Full Portal',
      targetUrl: portalUrl,
      whatsappUrl: DEFAULT_WHATSAPP_PROFILE_URL,
      reelCaptionAd: `${commentAd}\n#CBCKenya #KPSEA2026 #KJSEA2026 #TSCTeachers`,
      reelFirstCommentAd: commentAd,
      feedPostAd: commentAd,
      facebookShareUrl: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(portalUrl)}`,
      whatsappStatusShareUrl: `https://wa.me/?text=${encodeURIComponent(commentAd)}`,
    });
  }

  return ads;
}

/**
 * Extracts numeric/slug Facebook Page or Professional Profile ID from a URL or ID string
 */
export function extractFacebookActorId(urlOrId: string): string {
  const raw = String(urlOrId || '').trim();
  if (!raw) return DEFAULT_FACEBOOK_PROFILE_ID;
  if (/^\d{8,24}$/.test(raw)) return raw;
  const idMatch = raw.match(/[?&]id=(\d{8,24})/);
  if (idMatch) return idMatch[1];
  try {
    const u = new URL(raw);
    const seg = u.pathname.split('/').filter(Boolean)[0];
    if (seg && seg !== 'profile.php') return seg;
  } catch {
    // fallback below
  }
  return DEFAULT_FACEBOOK_PROFILE_ID;
}

/**
 * Server-Side Meta Conversions API (CAPI) Bridge:
 * Sends website views, clicks, interactions, and M-Pesa purchases straight into
 * Facebook's monetization & ad-attribution engine!
 */
export async function sendMetaConversionsEvent(params: {
  pixelId?: string;
  capiAccessToken?: string;
  eventName: 'PageView' | 'ViewContent' | 'Contact' | 'Lead' | 'InitiateCheckout' | 'Purchase';
  sourceUrl?: string;
  userAgent?: string;
  clientIp?: string;
  valueKes?: number;
  contentName?: string;
}): Promise<boolean> {
  const pixelId = (
    params.pixelId ||
    process.env.NEXT_PUBLIC_META_PIXEL_ID ||
    process.env.META_PIXEL_ID ||
    ''
  ).trim();
  const token = (
    params.capiAccessToken ||
    process.env.META_CONVERSIONS_API_TOKEN ||
    process.env.FACEBOOK_PAGE_ACCESS_TOKEN ||
    ''
  ).trim();

  if (!pixelId || !token) return false;

  try {
    const eventTime = Math.floor(Date.now() / 1000);
    const eventId = `cbc_${eventTime}_${crypto.randomBytes(4).toString('hex')}`;
    const payload = {
      data: [
        {
          event_name: params.eventName,
          event_time: eventTime,
          event_id: eventId,
          action_source: 'website',
          event_source_url: params.sourceUrl || 'https://www.cbcmaterials.shop',
          user_data: {
            client_ip_address: params.clientIp || undefined,
            client_user_agent: params.userAgent || 'Mozilla/5.0',
          },
          custom_data: {
            currency: 'KES',
            value: params.valueKes ?? (params.eventName === 'PageView' ? 1 : 5),
            content_name: params.contentName || 'CBC Curriculum Hub',
          },
        },
      ],
    };

    const res = await fetch(
      `https://graph.facebook.com/v21.0/${encodeURIComponent(
        pixelId
      )}/events?access_token=${encodeURIComponent(token)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Automatically scans the user's Facebook Reels & Feed via Meta Graph API,
 * pastes website content link ads into Reel comments/descriptions, and publishes
 * rotating curriculum material link ads to the monetizable Facebook Feed!
 */
export async function runAutomaticFacebookLinkAdSync(params: {
  fbActorId?: string;
  fbAccessToken?: string;
  publishFeedPost?: boolean;
  injectReelsLinks?: boolean;
}): Promise<{
  connectedToGraphApi: boolean;
  actorId: string;
  reelsUpdated: number;
  feedPostsPublished: number;
  postCommentsAdded: number;
  generatedAds: GeneratedFacebookLinkAd[];
  ledger: FacebookAutopostLedger;
  message: string;
}> {
  const ledger = await getFacebookAutopostLedger();
  const actorId = extractFacebookActorId(
    params.fbActorId || process.env.FACEBOOK_PAGE_ID || DEFAULT_FACEBOOK_PROFILE_ID
  );
  const accessToken = (
    params.fbAccessToken ||
    process.env.FACEBOOK_PAGE_ACCESS_TOKEN ||
    ''
  ).trim();

  const generatedAds = await generateRotatingFacebookLinkAds(
    6,
    ledger.lastPublishedMaterialIds
  );

  if (!accessToken) {
    ledger.lastSyncAt = new Date().toISOString();
    await saveFacebookAutopostLedger(ledger);
    return {
      connectedToGraphApi: false,
      actorId,
      reelsUpdated: 0,
      feedPostsPublished: 0,
      postCommentsAdded: 0,
      generatedAds,
      ledger,
      message:
        'Generated 6 fresh Reels & Feed link ads for Facebook Profile 61591027359399. Add your Meta Graph Access Token in Monetization -> Facebook Tab to enable 24/7 zero-touch background Graph API posting into every new Reel!',
    };
  }

  let reelsUpdated = 0;
  let feedPostsPublished = 0;
  let postCommentsAdded = 0;
  let adCursor = 0;

  // 1. Scan Facebook Reels & Videos and automatically paste clickable website link ads in comments + description!
  if (params.injectReelsLinks !== false) {
    for (const endpoint of ['video_reels', 'videos']) {
      try {
        const listRes = await fetch(
          `https://graph.facebook.com/v21.0/${encodeURIComponent(
            actorId
          )}/${endpoint}?fields=id,description,permalink_url&limit=12&access_token=${encodeURIComponent(
            accessToken
          )}`,
          { cache: 'no-store' }
        );
        const listJson = (await listRes.json()) as {
          data?: Array<{ id: string; description?: string }>;
        };
        const videos = Array.isArray(listJson?.data) ? listJson.data : [];

        for (const vid of videos) {
          if (!vid?.id || ledger.commentedReelIds.includes(vid.id)) continue;
          const ad = generatedAds[adCursor % generatedAds.length];
          adCursor++;

          // Post clickable first-comment link ad on the Reel
          const commentRes = await fetch(
            `https://graph.facebook.com/v21.0/${encodeURIComponent(vid.id)}/comments`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                message: ad.reelFirstCommentAd,
                access_token: accessToken,
              }),
            }
          );

          if (commentRes.ok) {
            reelsUpdated++;
            ledger.totalReelsMonetized += 1;
            ledger.commentedReelIds.push(vid.id);
            ledger.recentLogs.unshift({
              id: `log_${Date.now()}_${vid.id}`,
              timestamp: new Date().toISOString(),
              channel: 'reel_comment',
              fbObjectId: vid.id,
              materialTitle: ad.title,
              targetUrl: ad.targetUrl,
              status: 'PUBLISHED',
              detail: 'Auto-pasted clickable cbcmaterials.shop content link ad into Reel comments',
            });
          }

          // Also append website link to Reel caption if description doesn't already mention cbcmaterials.shop
          const existingDesc = String(vid.description || '');
          if (!existingDesc.toLowerCase().includes('cbcmaterials.shop')) {
            const updatedDesc = existingDesc
              ? `${existingDesc}\n\n${ad.reelFirstCommentAd}`
              : ad.reelCaptionAd;
            await fetch(
              `https://graph.facebook.com/v21.0/${encodeURIComponent(vid.id)}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  description: updatedDesc,
                  access_token: accessToken,
                }),
              }
            ).catch(() => {});
          }
        }
      } catch {
        // Continue to next endpoint cleanly
      }
    }

    // Also scan recent photo/text posts and drop link ad in first comment if not yet linked!
    try {
      const postsRes = await fetch(
        `https://graph.facebook.com/v21.0/${encodeURIComponent(
          actorId
        )}/posts?fields=id,message&limit=8&access_token=${encodeURIComponent(accessToken)}`,
        { cache: 'no-store' }
      );
      const postsJson = (await postsRes.json()) as {
        data?: Array<{ id: string; message?: string }>;
      };
      for (const post of postsJson?.data || []) {
        if (!post?.id || ledger.commentedPostIds.includes(post.id)) continue;
        if (String(post.message || '').toLowerCase().includes('cbcmaterials.shop')) {
          ledger.commentedPostIds.push(post.id);
          continue;
        }
        const ad = generatedAds[adCursor % generatedAds.length];
        adCursor++;
        const cRes = await fetch(
          `https://graph.facebook.com/v21.0/${encodeURIComponent(post.id)}/comments`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: ad.reelFirstCommentAd,
              access_token: accessToken,
            }),
          }
        );
        if (cRes.ok) {
          postCommentsAdded++;
          ledger.commentedPostIds.push(post.id);
          ledger.recentLogs.unshift({
            id: `log_${Date.now()}_${post.id}`,
            timestamp: new Date().toISOString(),
            channel: 'post_comment',
            fbObjectId: post.id,
            materialTitle: ad.title,
            targetUrl: ad.targetUrl,
            status: 'PUBLISHED',
            detail: 'Auto-pasted clickable website link ad into Facebook post comments',
          });
        }
      }
    } catch {
      // Ignore if post read scope not enabled
    }
  }

  // 2. Publish a fresh Monetizable Feed Link-Ad Post with OpenGraph Preview Card!
  if (params.publishFeedPost !== false && generatedAds.length > 0) {
    const featuredAd = generatedAds[0];
    try {
      const feedRes = await fetch(
        `https://graph.facebook.com/v21.0/${encodeURIComponent(actorId)}/feed`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: featuredAd.feedPostAd,
            link: featuredAd.targetUrl,
            access_token: accessToken,
          }),
        }
      );
      const feedJson = (await feedRes.json()) as { id?: string; error?: { message?: string } };
      if (feedRes.ok && feedJson?.id) {
        feedPostsPublished++;
        ledger.totalFeedAdsPublished += 1;
        ledger.commentedPostIds.push(feedJson.id);
        ledger.lastPublishedMaterialIds.push(featuredAd.id);
        ledger.recentLogs.unshift({
          id: `log_${Date.now()}_${feedJson.id}`,
          timestamp: new Date().toISOString(),
          channel: 'feed_post',
          fbObjectId: feedJson.id,
          materialTitle: featuredAd.title,
          targetUrl: featuredAd.targetUrl,
          status: 'PUBLISHED',
          detail: 'Published clickable OpenGraph image card + link ad to Facebook Feed',
        });
      }

      // Also publish the auto-generated HD Vertical Poster Image with clickable caption link!
      const posterUrl = `https://www.cbcmaterials.shop/api/social/poster-image?materialId=${encodeURIComponent(
        featuredAd.id
      )}&format=vertical`;
      const photoRes = await fetch(
        `https://graph.facebook.com/v21.0/${encodeURIComponent(actorId)}/photos`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: posterUrl,
            caption: featuredAd.reelCaptionAd,
            access_token: accessToken,
          }),
        }
      );
      if (photoRes.ok) {
        feedPostsPublished++;
        ledger.totalFeedAdsPublished += 1;
      } else if (feedJson?.error?.message) {
        ledger.recentLogs.unshift({
          id: `log_err_${Date.now()}`,
          timestamp: new Date().toISOString(),
          channel: 'feed_post',
          fbObjectId: actorId,
          materialTitle: featuredAd.title,
          targetUrl: featuredAd.targetUrl,
          status: 'ERROR',
          detail: feedJson.error.message,
        });
      }
    } catch (err: unknown) {
      ledger.recentLogs.unshift({
        id: `log_err_${Date.now()}`,
        timestamp: new Date().toISOString(),
        channel: 'feed_post',
        fbObjectId: actorId,
        materialTitle: featuredAd.title,
        targetUrl: featuredAd.targetUrl,
        status: 'ERROR',
        detail: err instanceof Error ? err.message : 'Network error',
      });
    }
  }

  ledger.lastSyncAt = new Date().toISOString();
  await saveFacebookAutopostLedger(ledger);

  return {
    connectedToGraphApi: true,
    actorId,
    reelsUpdated,
    feedPostsPublished,
    postCommentsAdded,
    generatedAds,
    ledger,
    message: `Synced Facebook Profile/Page (${actorId}): ${reelsUpdated} Reel(s) updated with website link ads, ${postCommentsAdded} post comment(s) added, and ${feedPostsPublished} new Feed Link Ad(s) published!`,
  };
}
