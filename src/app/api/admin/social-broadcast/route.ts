import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthorized } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase';
import { generateRotatingFacebookLinkAds } from '@/lib/facebook-monetization';
import {
  executeMultiPlatformBroadcast,
  getSocialBroadcasterConfig,
  saveSocialBroadcasterConfig,
  type SocialBroadcasterConfig,
} from '@/lib/social-broadcaster';

export async function GET(req: NextRequest) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const query = (searchParams.get('q') || '').trim();

  const config = await getSocialBroadcasterConfig();

  let searchResults: Array<{
    id: string;
    title: string;
    grade: number;
    subject: string;
    category: string;
    price: number;
  }> = [];

  if (query) {
    const { data } = await supabaseAdmin
      .from('resources')
      .select('id, title, grade, subject, category, price')
      .ilike('title', `%${query}%`)
      .limit(15);
    searchResults = (data || []) as typeof searchResults;
  } else {
    const { data } = await supabaseAdmin
      .from('resources')
      .select('id, title, grade, subject, category, price')
      .order('created_at', { ascending: false })
      .limit(12);
    searchResults = (data || []) as typeof searchResults;
  }

  const sampleAds = await generateRotatingFacebookLinkAds(3);

  return NextResponse.json({
    ok: true,
    config: {
      ...config,
      hasFbAccessToken: Boolean(config.fbPageAccessToken),
      hasMetaCapiToken: Boolean(config.metaConversionsApiToken),
      hasTelegramBotToken: Boolean(config.telegramBotToken),
      // Redact raw secret tokens when sending to UI unless empty; allow overwriting
      fbPageAccessToken: '',
      metaConversionsApiToken: '',
      telegramBotToken: '',
    },
    searchResults,
    sampleAds,
  });
}

export async function POST(req: NextRequest) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: 'Invalid admin credentials' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const action = String(body.action || 'broadcast_now');

    if (action === 'save_config') {
      const existing = await getSocialBroadcasterConfig();
      const incoming = (body.config || {}) as Partial<SocialBroadcasterConfig>;

      const updated: SocialBroadcasterConfig = {
        ...existing,
        platforms: Array.isArray(incoming.platforms)
          ? incoming.platforms
          : existing.platforms,
        metaPixelId:
          incoming.metaPixelId !== undefined
            ? String(incoming.metaPixelId).trim()
            : existing.metaPixelId,
        fbPageAccessToken: incoming.fbPageAccessToken?.trim()
          ? incoming.fbPageAccessToken.trim()
          : existing.fbPageAccessToken,
        metaConversionsApiToken: incoming.metaConversionsApiToken?.trim()
          ? incoming.metaConversionsApiToken.trim()
          : existing.metaConversionsApiToken,
        telegramBotToken: incoming.telegramBotToken?.trim()
          ? incoming.telegramBotToken.trim()
          : existing.telegramBotToken,
        telegramChatId:
          incoming.telegramChatId !== undefined
            ? String(incoming.telegramChatId).trim()
            : existing.telegramChatId,
        automationWebhookUrl:
          incoming.automationWebhookUrl !== undefined
            ? String(incoming.automationWebhookUrl).trim()
            : existing.automationWebhookUrl,
      };

      const saved = await saveSocialBroadcasterConfig(updated);
      return NextResponse.json({
        ok: true,
        message: 'All social media links & ON/OFF posting switches saved live!',
        config: {
          ...saved,
          hasFbAccessToken: Boolean(saved.fbPageAccessToken),
          hasMetaCapiToken: Boolean(saved.metaConversionsApiToken),
          hasTelegramBotToken: Boolean(saved.telegramBotToken),
          fbPageAccessToken: '',
          metaConversionsApiToken: '',
          telegramBotToken: '',
        },
      });
    }

    // Default: 1-Click Automated Broadcast across all ON platforms!
    const result = await executeMultiPlatformBroadcast({
      materialId: body.materialId ? String(body.materialId) : 'AUTO',
      customCaption: body.customCaption ? String(body.customCaption) : '',
      customTargetUrl: body.customTargetUrl ? String(body.customTargetUrl) : '',
    });

    return NextResponse.json({
      ok: true,
      ...result,
      config: {
        ...result.config,
        hasFbAccessToken: Boolean(result.config.fbPageAccessToken),
        hasMetaCapiToken: Boolean(result.config.metaConversionsApiToken),
        hasTelegramBotToken: Boolean(result.config.telegramBotToken),
        fbPageAccessToken: '',
        metaConversionsApiToken: '',
        telegramBotToken: '',
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Broadcast failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
