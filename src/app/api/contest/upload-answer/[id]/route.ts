// src/app/api/contest/upload-answer/[id]/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { updateContestParticipant } from '@/lib/contest-store';
import { triggerAutomaticBackup } from '@/lib/security';
import { v4 as uuidv4 } from 'uuid';

/**
 * Endpoint for participants to upload a photo of their answer sheet.
 * Expected multipart/form-data with field `file`.
 */
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const urlId = new URL(req.url).pathname.split('/').pop() || '';
    const participantId = (req.headers.get('x-participant-id') || urlId).trim();
    if (!file || !participantId) {
      return NextResponse.json({ success: false, message: 'Missing file or participant ID' }, { status: 400 });
    }

    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `_contest_answers/${uuidv4()}.${fileExt}`;
    const bucket = 'cbc-materials';
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error } = await supabaseAdmin.storage.from(bucket).upload(fileName, buffer, {
      contentType: file.type || 'image/jpeg',
    });
    if (error) throw error;

    // Placeholder auto-mark: generate a score between 0-100
    const marks = Math.floor(Math.random() * 101);
    const supabaseUrl = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/+$/, '');
    const answerUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${fileName}`;

    await updateContestParticipant(participantId, {
      marks,
      answer_url: answerUrl,
    });

    void triggerAutomaticBackup(`Contest answer graded: ${participantId} (${marks}/100)`);
    return NextResponse.json({ success: true, marks, message: 'Answer uploaded and graded' });
  } catch (e: unknown) {
    console.error('Upload answer error', e);
    const msg = e instanceof Error ? e.message : 'Server error';
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
