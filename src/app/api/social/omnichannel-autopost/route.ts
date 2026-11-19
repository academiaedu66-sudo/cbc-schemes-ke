import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthorized } from '@/lib/admin-auth';
import {
  getAllOmnichannelButtonSeoPacks,
  getOmnichannelState,
  runScheduledOmnichannelSocialRanker,
  saveOmnichannelState,
  type OmnichannelSocialConfig,
} from '@/lib/social-seo-engine';
import {
  getSocialBroadcasterConfig,
  saveSocialBroadcasterConfig,
} from '@/lib/social-broadcaster';

function redactOmnichannelConfig(cfg: OmnichannelSocialConfig) {
  return {
    enabled: cfg.enabled,
    profiles: cfg.profiles,
    fbPageId: cfg.fbPageId,
    automationWebhookUrl: cfg.automationWebhookUrl,
    hasFbToken: Boolean(cfg.fbPageAccessToken.trim()),
    hasXTwitterKeys:
      Boolean(cfg.xBearerUserToken.trim()) ||
      Boolean(
        cfg.xApiKey.trim() &&
          cfg.xApiSecret.trim() &&
          cfg.xAccessToken.trim() &&
          cfg.xAccessTokenSecret.trim()
      ),
    hasTikTokToken: Boolean(cfg.tiktokAccessToken.trim()),
    hasYouTubeToken: Boolean(
      cfg.youtubeClientId.trim() &&
        cfg.youtubeClientSecret.trim() &&
        cfg.youtubeRefreshToken.trim()
    ),
    updatedAt: cfg.updatedAt,
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const isCronQuery = searchParams.get('cron') === 'omnichannel';
  const isVercelCron = req.headers.get('x-vercel-cron') === '1';

  if (isCronQuery || isVercelCron) {
    const forceButtonId = searchParams.get('buttonId') || undefined;
    const result = await runScheduledOmnichannelSocialRanker({ forceButtonId });
    return NextResponse.json({
      trigger: 'omnichannel_cron',
      ...result,
    });
  }

  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const state = await getOmnichannelState();
  const packs = getAllOmnichannelButtonSeoPacks(state.ledger.dateEat);

  return NextResponse.json({
    ok: true,
    config: redactOmnichannelConfig(state.config),
    ledger: state.ledger,
    packs,
    rssFeedUrl: 'https://www.cbcmaterials.shop/social-feed.xml',
    videoHubUrl: 'https://www.cbcmaterials.shop/videos',
  });
}

export async function POST(req: NextRequest) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const action = String(body.action || 'dispatch_now');

    if (action === 'save_config') {
      const state = await getOmnichannelState();
      const inc = (body.config || {}) as Partial<OmnichannelSocialConfig>;

      state.config = {
        ...state.config,
        enabled:
          typeof inc.enabled === 'boolean' ? inc.enabled : state.config.enabled,
        profiles: {
          ...state.config.profiles,
          ...(inc.profiles || {}),
        },
        fbPageId:
          inc.fbPageId !== undefined
            ? String(inc.fbPageId).trim()
            : state.config.fbPageId,
        fbPageAccessToken: inc.fbPageAccessToken?.trim()
          ? inc.fbPageAccessToken.trim()
          : state.config.fbPageAccessToken,
        xApiKey: inc.xApiKey?.trim() ? inc.xApiKey.trim() : state.config.xApiKey,
        xApiSecret: inc.xApiSecret?.trim()
          ? inc.xApiSecret.trim()
          : state.config.xApiSecret,
        xAccessToken: inc.xAccessToken?.trim()
          ? inc.xAccessToken.trim()
          : state.config.xAccessToken,
        xAccessTokenSecret: inc.xAccessTokenSecret?.trim()
          ? inc.xAccessTokenSecret.trim()
          : state.config.xAccessTokenSecret,
        xBearerUserToken: inc.xBearerUserToken?.trim()
          ? inc.xBearerUserToken.trim()
          : state.config.xBearerUserToken,
        tiktokAccessToken: inc.tiktokAccessToken?.trim()
          ? inc.tiktokAccessToken.trim()
          : state.config.tiktokAccessToken,
        youtubeClientId: inc.youtubeClientId?.trim()
          ? inc.youtubeClientId.trim()
          : state.config.youtubeClientId,
        youtubeClientSecret: inc.youtubeClientSecret?.trim()
          ? inc.youtubeClientSecret.trim()
          : state.config.youtubeClientSecret,
        youtubeRefreshToken: inc.youtubeRefreshToken?.trim()
          ? inc.youtubeRefreshToken.trim()
          : state.config.youtubeRefreshToken,
        automationWebhookUrl:
          inc.automationWebhookUrl !== undefined
            ? String(inc.automationWebhookUrl).trim()
            : state.config.automationWebhookUrl,
      };

      await saveOmnichannelState(state);

      // Sync profile links into SocialBroadcasterConfig so Footer & Public Config reflect them immediately
      try {
        const sb = await getSocialBroadcasterConfig();
        sb.platforms = sb.platforms.map((p) => {
          if (p.id === 'tiktok' && state.config.profiles.tiktokUrl) {
            return {
              ...p,
              allowPosting: true,
              profileUrl: state.config.profiles.tiktokUrl,
            };
          }
          if (p.id === 'youtube' && state.config.profiles.youtubeUrl) {
            return {
              ...p,
              allowPosting: true,
              profileUrl: state.config.profiles.youtubeUrl,
            };
          }
          if (p.id === 'x_twitter' && state.config.profiles.xTwitterUrl) {
            return {
              ...p,
              allowPosting: true,
              profileUrl: state.config.profiles.xTwitterUrl,
            };
          }
          if (p.id === 'facebook_feed' && state.config.profiles.facebookPageUrl) {
            return {
              ...p,
              allowPosting: true,
              profileUrl: state.config.profiles.facebookPageUrl,
            };
          }
          if (
            p.id === 'facebook_reels' &&
            state.config.profiles.facebookReelsUrl
          ) {
            return {
              ...p,
              allowPosting: true,
              profileUrl: state.config.profiles.facebookReelsUrl,
            };
          }
          return p;
        });
        if (state.config.fbPageAccessToken) {
          sb.fbPageAccessToken = state.config.fbPageAccessToken;
        }
        if (state.config.automationWebhookUrl) {
          sb.automationWebhookUrl = state.config.automationWebhookUrl;
        }
        await saveSocialBroadcasterConfig(sb);
      } catch {}

      return NextResponse.json({
        ok: true,
        message:
          'TikTok, YouTube, Facebook & X (Twitter) SEO links and automation settings saved live!',
        config: redactOmnichannelConfig(state.config),
      });
    }

    const forceButtonId = body.buttonId ? String(body.buttonId) : undefined;
    const result = await runScheduledOmnichannelSocialRanker({ forceButtonId });
    const latestState = await getOmnichannelState();

    return NextResponse.json({
      ...result,
      ledger: latestState.ledger,
      config: redactOmnichannelConfig(latestState.config),
    });
  } catch (err: unknown) {
    const msg =
      err instanceof Error ? err.message : 'Omnichannel dispatch failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
