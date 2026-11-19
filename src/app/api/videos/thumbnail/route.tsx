import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { supabaseAdmin } from '@/lib/supabase';
import {
  buildTutorPeterWhiteboardLesson,
  type MaterialVideoInput,
} from '@/lib/tutor-peter-videos';

let cachedPortraitDataUri: string | null = null;

async function getTutorPeterPortraitDataUri(): Promise<string> {
  if (cachedPortraitDataUri) return cachedPortraitDataUri;
  try {
    const imgPath = path.join(
      process.cwd(),
      'public',
      'images',
      'tutor-peter-portrait.jpg'
    );
    const buf = await fs.readFile(imgPath);
    cachedPortraitDataUri = `data:image/jpeg;base64,${buf.toString('base64')}`;
    return cachedPortraitDataUri;
  } catch {
    return 'https://www.cbcmaterials.shop/images/tutor-peter-portrait.jpg';
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const materialId = (searchParams.get('materialId') || '').trim();

  let material: MaterialVideoInput = {
    id: materialId || 'cbc-class',
    title:
      searchParams.get('title') ||
      '2026 CBC Schemes, Notes & KJSEA Whiteboard Demonstration',
    grade: Number(searchParams.get('grade')) || 8,
    level: searchParams.get('level') || 'JSS',
    category: searchParams.get('category') || "Teachers' Notes",
    subject: searchParams.get('subject') || 'Mathematics',
    term: Number(searchParams.get('term')) || 1,
    price: Number(searchParams.get('price')) || 50,
  };

  if (materialId && materialId !== 'cbc-class') {
    const { data } = await supabaseAdmin
      .from('resources')
      .select(
        'id, title, grade, level, category, subject, term, price, description, strands'
      )
      .eq('id', materialId)
      .maybeSingle();

    if (data) {
      material = data as MaterialVideoInput;
    }
  }

  const lesson = buildTutorPeterWhiteboardLesson(material);
  const portraitSrc = await getTutorPeterPortraitDataUri();

  return new ImageResponse(
    (
      <div
        style={{
          width: '1280px',
          height: '720px',
          display: 'flex',
          flexDirection: 'row',
          background:
            'linear-gradient(135deg, #f8fafc 0%, #eef2ff 55%, #ecfdf5 100%)',
          padding: '28px',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Left Presenter Card — Tutor Peter */}
        <div
          style={{
            width: '390px',
            height: '664px',
            borderRadius: '28px',
            background: '#ffffff',
            border: '4px solid #059669',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px',
            boxShadow: '0 18px 40px rgba(2, 6, 23, 0.12)',
            marginRight: '24px',
          }}
        >
          <div
            style={{
              background: '#dc2626',
              color: '#ffffff',
              fontSize: '18px',
              fontWeight: 900,
              padding: '8px 18px',
              borderRadius: '999px',
              letterSpacing: '1px',
            }}
          >
            LIVE WHITEBOARD CLASS
          </div>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={portraitSrc}
            alt="Tutor Peter"
            width={320}
            height={390}
            style={{
              width: '320px',
              height: '390px',
              objectFit: 'cover',
              borderRadius: '22px',
              border: '3px solid #e2e8f0',
            }}
          />

          <div
            style={{
              width: '100%',
              background: '#022c22',
              color: '#ffffff',
              borderRadius: '18px',
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                fontSize: '26px',
                fontWeight: 900,
                color: '#fde68a',
              }}
            >
              TUTOR PETER
            </div>
            <div
              style={{
                fontSize: '15px',
                fontWeight: 700,
                color: '#a7f3d0',
                marginTop: '3px',
              }}
            >
              &ldquo;Welcome to our today&apos;s class!&rdquo;
            </div>
          </div>
        </div>

        {/* Right Silver-Framed Classroom Whiteboard */}
        <div
          style={{
            flex: 1,
            height: '664px',
            borderRadius: '24px',
            background: '#ffffff',
            border: '10px solid #cbd5e1',
            boxShadow: '0 20px 50px rgba(15, 23, 42, 0.14)',
            padding: '32px 36px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px',
              }}
            >
              <div
                style={{
                  background: '#065f46',
                  color: '#ffffff',
                  fontSize: '20px',
                  fontWeight: 900,
                  padding: '8px 18px',
                  borderRadius: '12px',
                }}
              >
                {lesson.gradeLabel.toUpperCase()} •{' '}
                {lesson.subject.toUpperCase()}
              </div>
              <div
                style={{
                  background: '#fef3c7',
                  color: '#92400e',
                  border: '2px solid #f59e0b',
                  fontSize: '18px',
                  fontWeight: 900,
                  padding: '6px 14px',
                  borderRadius: '12px',
                }}
              >
                2026 KICD • {lesson.termLabel.toUpperCase()}
              </div>
            </div>

            <div
              style={{
                fontSize: '38px',
                fontWeight: 900,
                color: '#0f172a',
                lineHeight: 1.18,
                borderBottom: '5px solid #10b981',
                paddingBottom: '14px',
              }}
            >
              {lesson.boardTopicTitle}
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                marginTop: '22px',
                gap: '12px',
              }}
            >
              {lesson.boardKeyPoints.map((pt, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: '22px',
                    fontWeight: 700,
                    color: '#1e293b',
                    background: '#f8fafc',
                    padding: '10px 16px',
                    borderRadius: '12px',
                    borderLeft: '6px solid #2563eb',
                  }}
                >
                  {pt}
                </div>
              ))}
            </div>
          </div>

          {/* Bottom CTA Bar */}
          <div
            style={{
              background: '#0f172a',
              color: '#ffffff',
              borderRadius: '16px',
              padding: '14px 22px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div
              style={{
                fontSize: '22px',
                fontWeight: 900,
                color: '#34d399',
              }}
            >
              www.cbcmaterials.shop
            </div>
            <div
              style={{
                fontSize: '20px',
                fontWeight: 800,
                color: '#fde68a',
              }}
            >
              WORD + PDF • KES {lesson.price}
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1280,
      height: 720,
    }
  );
}
