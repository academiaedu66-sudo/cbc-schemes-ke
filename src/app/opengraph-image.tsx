import { ImageResponse } from 'next/og';

export const alt =
  'CBC Kenya Resource Hub — 2026 KICD Schemes of Work, Lesson Plans, Notes & KPSEA/KJSEA Exams (PP1 to Grade 12)';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '56px 64px',
          background: 'linear-gradient(135deg, #064e3b 0%, #0f172a 60%, #1e1b4b 100%)',
          color: '#ffffff',
          fontFamily: 'sans-serif',
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
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              background: 'rgba(16, 185, 129, 0.2)',
              border: '2px solid rgba(52, 211, 153, 0.5)',
              borderRadius: '999px',
              padding: '10px 24px',
              fontSize: '22px',
              fontWeight: 800,
              color: '#6ee7b7',
            }}
          >
            www.cbcmaterials.shop • Official Kenya CBC Portal
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
            PP1 – Grade 12 (3,400+ Files)
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div
            style={{
              fontSize: '60px',
              fontWeight: 900,
              lineHeight: 1.12,
              letterSpacing: '-1px',
            }}
          >
            2026 KICD Rationalized CBC Schemes, Notes, Lesson Plans &amp; Exams
          </div>
          <div
            style={{
              fontSize: '28px',
              color: '#cbd5e1',
              lineHeight: 1.35,
            }}
          >
            Editable Word (.DOCX) + Print-Ready (.PDF) • KPSEA &amp; KJSEA Trials • Holiday Tuition • Instant M-Pesa Download
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '16px',
            fontSize: '20px',
            fontWeight: 700,
            color: '#e2e8f0',
          }}
        >
          <div
            style={{
              background: 'rgba(255,255,255,0.1)',
              padding: '12px 20px',
              borderRadius: '12px',
            }}
          >
            Schemes of Work (KES 50)
          </div>
          <div
            style={{
              background: 'rgba(255,255,255,0.1)',
              padding: '12px 20px',
              borderRadius: '12px',
            }}
          >
            Lesson Plans &amp; Notes
          </div>
          <div
            style={{
              background: 'rgba(255,255,255,0.1)',
              padding: '12px 20px',
              borderRadius: '12px',
            }}
          >
            KPSEA / KJSEA Marking Schemes
          </div>
          <div
            style={{
              background: '#10b981',
              color: '#052e16',
              padding: '12px 22px',
              borderRadius: '12px',
              fontWeight: 900,
            }}
          >
            Instant M-Pesa STK Push
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
