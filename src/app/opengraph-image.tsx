import { ImageResponse } from 'next/og';
import fs from 'fs/promises';
import path from 'path';

export const alt =
  'CBCMATERIALS.SHOP — 2026 KICD Schemes of Work, Teachers Notes, Lesson Plans & KNEC KJSEA/KPSEA Exams (PP1 to Grade 12)';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function OpenGraphImage() {
  const logoPath = path.join(
    process.cwd(),
    'public',
    'images',
    'cbcmaterials-logo.jpg'
  );
  const logoBuf = await fs.readFile(logoPath);
  const logoDataUri = `data:image/jpeg;base64,${logoBuf.toString('base64')}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '48px 58px',
          background:
            'linear-gradient(135deg, #022c22 0%, #0f172a 55%, #1e1b4b 100%)',
          color: '#ffffff',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Top Row: Official Crest Logo + Colourful Uppercase CBCMATERIALS.SHOP */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '22px',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoDataUri}
              alt="CBCMATERIALS.SHOP"
              width={118}
              height={118}
              style={{
                width: '118px',
                height: '118px',
                borderRadius: '28px',
                border: '4px solid #fbbf24',
                background: '#ffffff',
                objectFit: 'cover',
              }}
            />

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                fontSize: '54px',
                fontWeight: 900,
                letterSpacing: '-1px',
              }}
            >
              <span style={{ color: '#fbbf24' }}>CBC</span>
              <span style={{ color: '#34d399' }}>MATERIALS</span>
              <span
                style={{
                  background: '#e11d48',
                  color: '#ffffff',
                  padding: '4px 16px',
                  borderRadius: '16px',
                  marginLeft: '8px',
                  fontSize: '42px',
                  border: '3px solid #fde68a',
                }}
              >
                .SHOP
              </span>
            </div>
          </div>

          <div
            style={{
              background: '#fbbf24',
              color: '#0f172a',
              borderRadius: '16px',
              padding: '12px 24px',
              fontSize: '22px',
              fontWeight: 900,
              display: 'flex',
            }}
          >
            6,534+ FILES • PP1–G12
          </div>
        </div>

        {/* Center Headline */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <div
            style={{
              fontSize: '52px',
              fontWeight: 900,
              lineHeight: 1.14,
              color: '#ffffff',
              display: 'flex',
            }}
          >
            2026 CBC Schemes of Work, Teachers Notes, KNEC KJSEA &amp; KPSEA
            Examinations
          </div>
          <div
            style={{
              fontSize: '26px',
              color: '#a7f3d0',
              fontWeight: 700,
              lineHeight: 1.35,
              display: 'flex',
            }}
          >
            Editable Word (.DOCX) + Print-Ready (.PDF) • All TSC Services •
            Tutor Peter Classes • Verified Tuition Tutors
          </div>
        </div>

        {/* Bottom Colourful Feature Pills */}
        <div
          style={{
            display: 'flex',
            gap: '16px',
            fontSize: '20px',
            fontWeight: 800,
          }}
        >
          <div
            style={{
              background: '#059669',
              color: '#ffffff',
              padding: '12px 22px',
              borderRadius: '14px',
              display: 'flex',
            }}
          >
            Schemes &amp; Notes (From KES 50)
          </div>
          <div
            style={{
              background: '#e11d48',
              color: '#ffffff',
              padding: '12px 22px',
              borderRadius: '14px',
              display: 'flex',
            }}
          >
            National KJSEA &amp; Marking Schemes
          </div>
          <div
            style={{
              background: '#2563eb',
              color: '#ffffff',
              padding: '12px 22px',
              borderRadius: '14px',
              display: 'flex',
            }}
          >
            Instant 1s M-Pesa Unlock
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
