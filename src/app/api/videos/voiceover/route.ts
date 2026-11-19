import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { supabaseAdmin } from '@/lib/supabase';
import {
  buildTutorPeterWhiteboardLesson,
  type MaterialVideoInput,
} from '@/lib/tutor-peter-videos';

const execFileAsync = promisify(execFile);
const BUCKET_NAME = 'cbc-materials';

function splitTextIntoChunks(text: string, maxLen = 175): string[] {
  const sentences = text
    .replace(/\s+/g, ' ')
    .trim()
    .split(/(?<=[.!?])\s+/);
  const chunks: string[] = [];
  let current = '';

  for (const sentence of sentences) {
    if (!sentence) continue;
    if ((current + ' ' + sentence).trim().length <= maxLen) {
      current = (current + ' ' + sentence).trim();
    } else {
      if (current) chunks.push(current);
      if (sentence.length <= maxLen) {
        current = sentence;
      } else {
        // Split long sentence on commas/spaces
        const words = sentence.split(' ');
        let sub = '';
        for (const w of words) {
          if ((sub + ' ' + w).trim().length <= maxLen) {
            sub = (sub + ' ' + w).trim();
          } else {
            if (sub) chunks.push(sub);
            sub = w;
          }
        }
        current = sub;
      }
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

async function synthesizeViaLocalEdgeTts(text: string): Promise<Buffer | null> {
  if (process.env.VERCEL) return null;
  const tmpFile = path.join(
    os.tmpdir(),
    `tutor-peter-${Date.now()}-${Math.random().toString(36).slice(2)}.mp3`
  );
  try {
    await execFileAsync(
      'python',
      [
        '-m',
        'edge_tts',
        '--voice',
        'en-KE-ChilembaNeural',
        '--rate=-2%',
        '--text',
        text,
        '--write-media',
        tmpFile,
      ],
      { timeout: 18000 }
    );
    const buf = await fs.readFile(tmpFile);
    await fs.unlink(tmpFile).catch(() => {});
    if (buf.length > 1000) return buf;
  } catch {
    await fs.unlink(tmpFile).catch(() => {});
  }
  return null;
}

async function synthesizeViaCloudMp3Chunks(
  text: string
): Promise<Buffer | null> {
  try {
    const chunks = splitTextIntoChunks(text, 175);
    const buffers: Buffer[] = [];

    for (const chunk of chunks) {
      const url = `https://translate.googleapis.com/translate_tts?ie=UTF-8&client=tw-ob&tl=en&q=${encodeURIComponent(
        chunk
      )}`;
      const res = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125.0.0.0 Safari/537.36',
        },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) return null;
      const ab = await res.arrayBuffer();
      if (ab.byteLength > 200) {
        buffers.push(Buffer.from(ab));
      }
    }

    if (buffers.length > 0) {
      return Buffer.concat(buffers);
    }
  } catch {}
  return null;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const materialId = (searchParams.get('materialId') || '').trim();

  let material: MaterialVideoInput = {
    id: materialId || 'sample-cbc-lesson',
    title:
      searchParams.get('title') ||
      '2026 Rationalized CBC Lesson & Worked Examples',
    grade: Number(searchParams.get('grade')) || 8,
    level: searchParams.get('level') || 'JSS',
    category: searchParams.get('category') || "Teachers' Notes",
    subject: searchParams.get('subject') || 'Mathematics',
    term: Number(searchParams.get('term')) || 1,
    price: Number(searchParams.get('price')) || 50,
  };

  if (materialId && materialId !== 'sample-cbc-lesson') {
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
  const safeId = lesson.materialId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const cachePath = `_videos/voiceovers/${safeId}-v2.mp3`;

  // 1. Check Supabase Storage MP3 voiceover cache
  try {
    const { data: cachedBlob, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .download(cachePath);

    if (!error && cachedBlob && cachedBlob.size > 1000) {
      const ab = await cachedBlob.arrayBuffer();
      return new NextResponse(Buffer.from(ab), {
        status: 200,
        headers: {
          'Content-Type': 'audio/mpeg',
          'Cache-Control': 'public, max-age=86400, s-maxage=604800',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  } catch {}

  // 2. Synthesize fresh Tutor Peter voiceover (Kenyan Neural Voice locally, or Cloud MP3 chunks on serverless)
  let mp3Buffer = await synthesizeViaLocalEdgeTts(lesson.fullVoiceoverText);
  if (!mp3Buffer) {
    mp3Buffer = await synthesizeViaCloudMp3Chunks(lesson.fullVoiceoverText);
  }

  if (mp3Buffer && mp3Buffer.length > 1000) {
    // Save asynchronously to Supabase Storage cache
    supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(cachePath, mp3Buffer, {
        contentType: 'audio/mpeg',
        upsert: true,
      })
      .catch(() => {});

    return new NextResponse(new Uint8Array(mp3Buffer), {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=86400, s-maxage=604800',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  // 3. Guaranteed fallback to pre-synthesized Kenyan Male Tutor Peter Intro MP3
  return NextResponse.redirect(
    new URL('/audio/tutor-peter-intro.mp3', req.url)
  );
}
