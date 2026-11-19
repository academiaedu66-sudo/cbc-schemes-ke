import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import {
  buildTutorPeterWhiteboardLesson,
  SITE_ORIGIN,
  type MaterialVideoInput,
} from '@/lib/tutor-peter-videos';
import { getOmnichannelState } from '@/lib/social-seo-engine';

const BUCKET_NAME = 'cbc-materials';
const PUBLISHED_VIDEOS_LEDGER = '_videos/published-videos-ledger.json';
const INDEXNOW_KEY = 'cbcmaterials2026seokey8842a9f1e3d7';

export interface PublishedVideoRecord {
  materialId: string;
  title: string;
  youtubeTitle: string;
  publicVideoUrl: string;
  watchPageUrl: string;
  thumbnailUrl: string;
  youtubeVideoId?: string;
  youtubeWatchUrl?: string;
  syndicatedSites: string[];
  publishedAtIso: string;
}

export async function getPublishedVideosLedger(): Promise<
  PublishedVideoRecord[]
> {
  try {
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .download(PUBLISHED_VIDEOS_LEDGER);
    if (error || !data) return [];
    const parsed = JSON.parse(await data.text());
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function savePublishedVideoRecord(
  rec: PublishedVideoRecord
): Promise<void> {
  const existing = await getPublishedVideosLedger();
  const filtered = existing.filter((x) => x.materialId !== rec.materialId);
  filtered.unshift(rec);
  await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .upload(
      PUBLISHED_VIDEOS_LEDGER,
      Buffer.from(JSON.stringify(filtered.slice(0, 500), null, 2), 'utf-8'),
      {
        contentType: 'application/json',
        upsert: true,
      }
    );
}

async function getFreshYouTubeAccessToken(params: {
  directAccessToken?: string;
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}): Promise<string | null> {
  if (params.directAccessToken?.trim()) {
    return params.directAccessToken.trim();
  }
  if (
    !params.clientId.trim() ||
    !params.clientSecret.trim() ||
    !params.refreshToken.trim()
  ) {
    return null;
  }
  try {
    const body = new URLSearchParams({
      client_id: params.clientId.trim(),
      client_secret: params.clientSecret.trim(),
      refresh_token: params.refreshToken.trim(),
      grant_type: 'refresh_token',
    });
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { access_token?: string };
    return json.access_token || null;
  } catch {
    return null;
  }
}

async function uploadVideoToYouTubeDataApi(params: {
  accessToken: string;
  videoBuffer: Buffer;
  mimeType: string;
  title: string;
  description: string;
  tags: string[];
  thumbnailUrl: string;
}): Promise<{ videoId: string; watchUrl: string } | { error: string }> {
  try {
    // Step 1: Initiate YouTube Data API v3 Resumable Upload Session
    const metadata = {
      snippet: {
        title: params.title,
        description: params.description,
        tags: params.tags,
        categoryId: '27', // 27 = Education (Official YouTube Requirement for Classes)
        defaultLanguage: 'en',
        defaultAudioLanguage: 'en',
      },
      status: {
        privacyStatus: 'public',
        selfDeclaredMadeForKids: false,
        embeddable: true,
        publicStatsViewable: true,
      },
    };

    const initRes = await fetch(
      'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${params.accessToken}`,
          'Content-Type': 'application/json; charset=UTF-8',
          'X-Upload-Content-Length': String(params.videoBuffer.length),
          'X-Upload-Content-Type': params.mimeType,
        },
        body: JSON.stringify(metadata),
        signal: AbortSignal.timeout(15000),
      }
    );

    if (!initRes.ok) {
      const errTxt = await initRes.text().catch(() => '');
      return {
        error: `YouTube init HTTP ${initRes.status}: ${errTxt.slice(0, 180)}`,
      };
    }

    const uploadLocation = initRes.headers.get('location');
    if (!uploadLocation) {
      return { error: 'YouTube did not return resumable upload location' };
    }

    // Step 2: Upload binary video bytes to YouTube
    const uploadRes = await fetch(uploadLocation, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${params.accessToken}`,
        'Content-Length': String(params.videoBuffer.length),
        'Content-Type': params.mimeType,
      },
      body: new Uint8Array(params.videoBuffer),
      signal: AbortSignal.timeout(55000),
    });

    if (!uploadRes.ok) {
      const errTxt = await uploadRes.text().catch(() => '');
      return {
        error: `YouTube binary upload HTTP ${uploadRes.status}: ${errTxt.slice(
          0,
          180
        )}`,
      };
    }

    const uploadedJson = (await uploadRes.json()) as { id?: string };
    const videoId = uploadedJson.id || '';
    if (!videoId) {
      return { error: 'YouTube upload completed without videoId' };
    }

    // Step 3: Set Custom 1280x720 Tutor Peter Whiteboard Thumbnail (best-effort)
    try {
      const thumbRes = await fetch(params.thumbnailUrl, {
        signal: AbortSignal.timeout(8000),
      });
      if (thumbRes.ok) {
        const thumbBuf = await thumbRes.arrayBuffer();
        await fetch(
          `https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId=${encodeURIComponent(
            videoId
          )}`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${params.accessToken}`,
              'Content-Type': 'image/png',
            },
            body: thumbBuf,
            signal: AbortSignal.timeout(12000),
          }
        );
      }
    } catch {}

    return {
      videoId,
      watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
    };
  } catch (e: unknown) {
    return {
      error: e instanceof Error ? e.message : 'YouTube upload exception',
    };
  }
}

export async function GET() {
  const ledger = await getPublishedVideosLedger();
  return NextResponse.json({
    ok: true,
    publishedCount: ledger.length,
    videos: ledger.slice(0, 50),
  });
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const videoFile = formData.get('video') as File | null;
    const materialId = String(formData.get('materialId') || '').trim();
    const directYoutubeToken = String(
      formData.get('youtubeAccessToken') || ''
    ).trim();
    const customWebhookUrl = String(formData.get('webhookUrl') || '').trim();

    if (!videoFile || !materialId) {
      return NextResponse.json(
        { error: 'Missing video file or materialId' },
        { status: 400 }
      );
    }

    // Load material details
    let material: MaterialVideoInput = {
      id: materialId,
      title: String(
        formData.get('title') || '2026 CBC Whiteboard Demonstration'
      ),
      grade: Number(formData.get('grade')) || 8,
      level: String(formData.get('level') || 'JSS'),
      category: String(formData.get('category') || "Teachers' Notes"),
      subject: String(formData.get('subject') || 'Mathematics'),
      term: Number(formData.get('term')) || 1,
      price: Number(formData.get('price')) || 50,
    };

    const { data: dbItem } = await supabaseAdmin
      .from('resources')
      .select(
        'id, title, grade, level, category, subject, term, price, description, strands'
      )
      .eq('id', materialId)
      .maybeSingle();

    if (dbItem) {
      material = dbItem as MaterialVideoInput;
    }

    const lesson = buildTutorPeterWhiteboardLesson(material);
    const ab = await videoFile.arrayBuffer();
    const videoBuffer = Buffer.from(ab);
    const mimeType = videoFile.type || 'video/webm';
    const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
    const safeId = materialId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const storagePath = `public-videos/tutor-peter-${safeId}.${ext}`;

    // 1. Host Video Publicly on Supabase CDN (Required for Pull-From-URL Auto-Post & Google Video Sitemap!)
    await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(storagePath, videoBuffer, {
        contentType: mimeType,
        upsert: true,
      });

    const { data: pubData } = supabaseAdmin.storage
      .from(BUCKET_NAME)
      .getPublicUrl(storagePath);
    const publicVideoUrl = pubData.publicUrl;

    const syndicatedSites: string[] = [
      'CBCMaterials Public Video CDN',
      'Google Video Sitemap (/video-sitemap.xml)',
      'Social Media RSS Feed (/social-feed.xml)',
    ];

    const omniState = await getOmnichannelState();
    const cfg = omniState.config;

    // 2. Direct Auto-Post to YouTube Data API v3 (if OAuth token or saved Refresh Token is configured)
    let youtubeVideoId: string | undefined;
    let youtubeWatchUrl: string | undefined;
    let youtubeNote = '';

    const ytToken = await getFreshYouTubeAccessToken({
      directAccessToken: directYoutubeToken,
      clientId: cfg.youtubeClientId,
      clientSecret: cfg.youtubeClientSecret,
      refreshToken: cfg.youtubeRefreshToken,
    });

    if (ytToken) {
      const ytRes = await uploadVideoToYouTubeDataApi({
        accessToken: ytToken,
        videoBuffer,
        mimeType,
        title: lesson.youtubeTitle,
        description: lesson.youtubeDescription,
        tags: lesson.youtubeTags,
        thumbnailUrl: lesson.thumbnailUrl,
      });
      if ('videoId' in ytRes) {
        youtubeVideoId = ytRes.videoId;
        youtubeWatchUrl = ytRes.watchUrl;
        syndicatedSites.push(`YouTube (${ytRes.watchUrl})`);
      } else {
        youtubeNote = ytRes.error;
      }
    }

    // 3. Direct Auto-Post Video to Facebook Page / Reels Graph API (if FB token saved)
    if (cfg.fbPageAccessToken.trim()) {
      try {
        const fbPageId = cfg.fbPageId.trim() || 'me';
        const fbRes = await fetch(
          `https://graph-video.facebook.com/v21.0/${encodeURIComponent(
            fbPageId
          )}/videos`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              file_url: publicVideoUrl,
              title: lesson.youtubeTitle,
              description: lesson.youtubeDescription,
              access_token: cfg.fbPageAccessToken.trim(),
            }),
            signal: AbortSignal.timeout(15000),
          }
        );
        if (fbRes.ok) {
          syndicatedSites.push('Facebook Video / Reels (Graph API)');
        }
      } catch {}
    }

    // 4. Direct Auto-Post Video to TikTok Content Posting API v2 (PULL_FROM_URL)
    if (cfg.tiktokAccessToken.trim()) {
      try {
        const ttRes = await fetch(
          'https://open.tiktokapis.com/v2/post/publish/video/init/',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${cfg.tiktokAccessToken.trim()}`,
              'Content-Type': 'application/json; charset=UTF-8',
            },
            body: JSON.stringify({
              post_info: {
                title: lesson.youtubeTitle,
                privacy_level: 'PUBLIC_TO_EVERYONE',
              },
              source_info: {
                source: 'PULL_FROM_URL',
                video_url: publicVideoUrl,
              },
            }),
            signal: AbortSignal.timeout(12000),
          }
        );
        if (ttRes.ok) {
          syndicatedSites.push('TikTok Video API v2');
        }
      } catch {}
    }

    // 5. Direct Multi-Site Webhook (Make / Zapier / Buffer / n8n / Publer -> YouTube, TikTok, FB, X, LinkedIn, IG, Vimeo)
    const activeWebhook =
      customWebhookUrl || cfg.automationWebhookUrl.trim() || '';
    if (activeWebhook) {
      try {
        const whRes = await fetch(activeWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'tutor_peter_whiteboard_video_published',
            materialId: lesson.materialId,
            publicVideoUrl,
            youtubeWatchUrl: youtubeWatchUrl || null,
            thumbnailUrl: lesson.thumbnailUrl,
            watchPageUrl: lesson.watchPageUrl,
            materialPageUrl: lesson.materialPageUrl,
            youtubeTitle: lesson.youtubeTitle,
            youtubeDescription: lesson.youtubeDescription,
            youtubeTags: lesson.youtubeTags,
            captionsSrt: lesson.captionsSrt,
          }),
          signal: AbortSignal.timeout(10000),
        });
        if (whRes.ok) {
          syndicatedSites.push('Multi-Site Automation Webhook');
        }
      } catch {}
    }

    // 6. Save to Published Videos Ledger & Ping Search Engines (IndexNow) for Instant Ranking
    const record: PublishedVideoRecord = {
      materialId: lesson.materialId,
      title: lesson.title,
      youtubeTitle: lesson.youtubeTitle,
      publicVideoUrl,
      watchPageUrl: lesson.watchPageUrl,
      thumbnailUrl: lesson.thumbnailUrl,
      youtubeVideoId,
      youtubeWatchUrl,
      syndicatedSites,
      publishedAtIso: new Date().toISOString(),
    };
    await savePublishedVideoRecord(record);

    // Ping IndexNow for instant video search indexing
    const indexPayload = {
      host: 'www.cbcmaterials.shop',
      key: INDEXNOW_KEY,
      keyLocation: `${SITE_ORIGIN}/${INDEXNOW_KEY}.txt`,
      urlList: [
        lesson.watchPageUrl,
        lesson.materialPageUrl,
        `${SITE_ORIGIN}/video-sitemap.xml`,
        `${SITE_ORIGIN}/videos`,
      ],
    };
    await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(indexPayload),
      signal: AbortSignal.timeout(6000),
    }).catch(() => {});

    return NextResponse.json({
      ok: true,
      publicVideoUrl,
      youtubeVideoId: youtubeVideoId || null,
      youtubeWatchUrl: youtubeWatchUrl || null,
      youtubeNote: youtubeNote || null,
      watchPageUrl: lesson.watchPageUrl,
      thumbnailUrl: lesson.thumbnailUrl,
      syndicatedSites,
    });
  } catch (err: unknown) {
    const msg =
      err instanceof Error ? err.message : 'Failed to publish whiteboard video';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
