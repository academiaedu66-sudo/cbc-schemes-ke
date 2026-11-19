import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import {
  buildDailyButtonStatusAd,
  CONNECTED_WHATSAPP_STATUS_LOCAL,
  WEBSITE_BUTTONS_FOR_DAILY_STATUS,
} from '@/lib/whatsapp-status-autoposter';

function getGradeBadge(grade: number, title: string): string {
  const up = title.toUpperCase();
  if (up.includes('PP1') || grade === -1) return 'PP1 (PRE-PRIMARY 1)';
  if (up.includes('PP2') || grade === 0) return 'PP2 (PRE-PRIMARY 2)';
  return `GRADE ${grade}`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const materialId = (searchParams.get('materialId') || 'AUTO').trim();
  const service = (searchParams.get('service') || '').trim().toUpperCase();
  const format = (searchParams.get('format') || 'vertical').toLowerCase();
  const isVertical = format !== 'card';

  const width = isVertical ? 1080 : 1200;
  const height = isVertical ? 1920 : 630;

  let badgeTop = 'PP1 – GRADE 12 • 6,534+ FILES';
  let headline =
    '2026 CBC Schemes of Work, Lesson Plans, Notes & NATIONAL KJSEA TESTS';
  let subheadline =
    'Editable Word (.DOCX) + Print-Ready (.PDF) • Unlocks in 1 Second via M-Pesa!';
  let priceTag = 'FROM KES 50 • INSTANT DOWNLOAD';
  const linkDisplay = 'www.cbcmaterials.shop';

  const matchedButtonSpec = service
    ? WEBSITE_BUTTONS_FOR_DAILY_STATUS.find(
        (b) => b.posterServiceCode.toUpperCase() === service
      )
    : undefined;

  if (matchedButtonSpec) {
    const built = buildDailyButtonStatusAd(matchedButtonSpec);
    badgeTop = `BUTTON ${built.orderIndex}/18 • ${built.buttonLabel}`;
    headline = built.headline;
    subheadline = built.subheadline;
    priceTag = built.priceBadge;
  } else if (materialId && materialId !== 'AUTO' && materialId !== 'PORTAL') {
    const uuidMatch = materialId.match(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
    );
    if (uuidMatch) {
      const { data: row } = await supabaseAdmin
        .from('resources')
        .select('id, title, grade, category, subject, price')
        .eq('id', uuidMatch[0])
        .maybeSingle();

      if (row) {
        const gText = getGradeBadge(Number(row.grade), String(row.title || ''));
        badgeTop = `${gText} • ${(row.subject || 'CBC').toUpperCase()} • ${(
          row.category || 'RESOURCE'
        ).toUpperCase()}`;
        headline = String(row.title);
        subheadline =
          'Includes BOTH Editable MS Word (.DOCX) & Print-Ready (.PDF) • Instant M-Pesa Auto-Open!';
        priceTag = `KES ${Number(row.price) || 50} • DOCX + PDF`;
      }
    }
  } else if (materialId === 'AUTO') {
    const hourIdx = Math.floor(Date.now() / (1000 * 60 * 20)) % 15;
    const { data: rows } = await supabaseAdmin
      .from('resources')
      .select('id, title, grade, category, subject, price')
      .order('created_at', { ascending: false })
      .limit(16);

    const picked = rows && rows.length > 0 ? rows[hourIdx % rows.length] : null;
    if (picked) {
      const gText = getGradeBadge(Number(picked.grade), String(picked.title || ''));
      badgeTop = `${gText} • ${(picked.subject || 'CBC').toUpperCase()}`;
      headline = String(picked.title);
      subheadline =
        'Editable Word (.DOCX) + Print-Ready (.PDF) • Plus All-Subjects Gaming & Holiday Tuition!';
      priceTag = `KES ${Number(picked.price) || 50} • INSTANT UNLOCK`;
    }
  }

  // =========================================================================
  // 1. LANDSCAPE CLICKABLE LINK-CARD FORMAT (1200 x 630 — Feed / OG Card)
  // =========================================================================
  if (!isVertical) {
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '44px 56px',
            background:
              'linear-gradient(135deg, #022c22 0%, #0f172a 55%, #172554 100%)',
            color: '#ffffff',
            fontFamily: 'sans-serif',
            border: '8px solid #10b981',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div
              style={{
                background: '#10b981',
                color: '#022c22',
                borderRadius: '999px',
                padding: '10px 24px',
                fontSize: '21px',
                fontWeight: 900,
              }}
            >
              {badgeTop.slice(0, 48)}
            </div>
            <div
              style={{
                background: '#fbbf24',
                color: '#0f172a',
                borderRadius: '14px',
                padding: '10px 22px',
                fontSize: '22px',
                fontWeight: 900,
              }}
            >
              {priceTag}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div
              style={{
                fontSize: headline.length > 72 ? '42px' : '50px',
                fontWeight: 900,
                lineHeight: 1.14,
                color: '#ffffff',
              }}
            >
              {headline.slice(0, 110)}
            </div>
            <div
              style={{
                fontSize: '24px',
                color: '#cbd5e1',
                lineHeight: 1.3,
              }}
            >
              {subheadline}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#ffffff',
              color: '#0f172a',
              borderRadius: '22px',
              padding: '18px 28px',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span
                style={{
                  fontSize: '16px',
                  fontWeight: 800,
                  color: '#047857',
                }}
              >
                CLICK THIS CARD OR VISIT TO OPEN INSTANTLY:
              </span>
              <span
                style={{
                  fontSize: '34px',
                  fontWeight: 900,
                  color: '#0f172a',
                }}
              >
                https://{linkDisplay}
              </span>
            </div>
            <div
              style={{
                background: '#059669',
                color: '#ffffff',
                borderRadius: '16px',
                padding: '14px 24px',
                fontSize: '22px',
                fontWeight: 900,
              }}
            >
              WhatsApp: {CONNECTED_WHATSAPP_STATUS_LOCAL} • Soft Song Inside
            </div>
          </div>
        </div>
      ),
      { width, height }
    );
  }

  // =========================================================================
  // 2. VERTICAL FULL-HD REELS & WHATSAPP STATUS POSTER (1080 x 1920)
  // =========================================================================
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '76px 64px',
          background:
            'linear-gradient(165deg, #022c22 0%, #0f172a 48%, #1e1b4b 100%)',
          color: '#ffffff',
          fontFamily: 'sans-serif',
          border: '14px solid #10b981',
        }}
      >
        {/* Top Brand & Domain Header */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '22px',
          }}
        >
          <div
            style={{
              background: '#fbbf24',
              color: '#0f172a',
              borderRadius: '999px',
              padding: '16px 38px',
              fontSize: '30px',
              fontWeight: 900,
              letterSpacing: '0.5px',
            }}
          >
            KENYA #1 OFFICIAL CBC PORTAL (2026)
          </div>

          <div
            style={{
              background: 'rgba(16, 185, 129, 0.22)',
              border: '3px solid #34d399',
              color: '#6ee7b7',
              borderRadius: '24px',
              padding: '16px 32px',
              fontSize: '28px',
              fontWeight: 800,
              textAlign: 'center',
            }}
          >
            {badgeTop.slice(0, 52)}
          </div>
        </div>

        {/* Center Featured Material / Service Card */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '28px',
            background: 'rgba(15, 23, 42, 0.82)',
            border: '3px solid rgba(148, 163, 184, 0.35)',
            borderRadius: '40px',
            padding: '48px 44px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignSelf: 'flex-start',
              background: '#10b981',
              color: '#022c22',
              borderRadius: '18px',
              padding: '12px 26px',
              fontSize: '28px',
              fontWeight: 900,
            }}
          >
            {priceTag}
          </div>

          <div
            style={{
              fontSize: headline.length > 75 ? '54px' : '64px',
              fontWeight: 900,
              lineHeight: 1.15,
              color: '#ffffff',
            }}
          >
            {headline.slice(0, 115)}
          </div>

          <div
            style={{
              fontSize: '31px',
              color: '#cbd5e1',
              lineHeight: 1.38,
            }}
          >
            {subheadline}
          </div>
        </div>

        {/* Services Directory Checklist */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
            background: 'rgba(255, 255, 255, 0.07)',
            borderRadius: '32px',
            padding: '34px 38px',
            fontSize: '27px',
            fontWeight: 700,
            color: '#f1f5f9',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ color: '#34d399', fontWeight: 900 }}>✓</span>
            <span>PP1 – Grade 12 Schemes, Notes, Plans &amp; Exams (Word + PDF)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ color: '#fbbf24', fontWeight: 900 }}>✓</span>
            <span>All-Subjects CBC Gaming Arena (Play &amp; Earn Rewards)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ color: '#60a5fa', fontWeight: 900 }}>✓</span>
            <span>Book Holiday &amp; Personal Tuition + Ask Gemini Q&amp;A</span>
          </div>
        </div>

        {/* High-Contrast Clickable Link CTA Footer */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            background: '#ffffff',
            color: '#0f172a',
            borderRadius: '38px',
            padding: '38px 36px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: '24px',
              fontWeight: 900,
              color: '#047857',
              letterSpacing: '0.5px',
            }}
          >
            TAP THE CLICKABLE LINK IN CAPTION / COMMENT OR VISIT:
          </div>

          <div
            style={{
              background: '#1877F2',
              color: '#ffffff',
              borderRadius: '24px',
              padding: '20px 38px',
              fontSize: '46px',
              fontWeight: 900,
            }}
          >
            www.cbcmaterials.shop
          </div>

          <div
            style={{
              fontSize: '28px',
              fontWeight: 800,
              color: '#0f172a',
            }}
          >
            WhatsApp Status: {CONNECTED_WHATSAPP_STATUS_LOCAL} • Soft Lounge Song Included
          </div>
        </div>
      </div>
    ),
    { width, height }
  );
}
