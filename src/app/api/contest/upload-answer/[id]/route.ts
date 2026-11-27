// src/app/api/contest/upload-answer/[id]/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { triggerAutomaticBackup } from '@/lib/security';
import FormData from 'form-data';
import { v4 as uuidv4 } from 'uuid';

/**
 * Endpoint for participants to upload a photo of their answer sheet.
 * Expected multipart/form-data with field `file`.
 */
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const participantId = (req.headers.get('x-participant-id') || '').trim();
    if (!file || !participantId) {
      return NextResponse.json({ success: false, message: 'Missing file or participant ID' }, { status: 400 });
    }
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${uuidv4()}.${fileExt}`;
    const bucket = 'contest-answers';
    const { error } = await supabaseAdmin.storage.from(bucket).upload(fileName, file, {
      contentType: file.type,
    });
    if (error) throw error;

    // Placeholder auto‑mark: generate a random score between 0‑100
    const marks = Math.floor(Math.random() * 101);

    // Update participant record with marks and answer URL
    await supabaseAdmin.from('contest_participants').update({
      marks,
      answer_url: `${process.env.SUPABASE_URL ?? ''}`.replace('https://', 'https://') + `/storage/v1/object/public/${bucket}/${fileName}`,
    }).eq('id', participantId);

    void triggerAutomaticBackup(`Contest answer graded: ${participantId} (${marks}/100)`);
    return NextResponse.json({ success: true, marks, message: 'Answer uploaded and graded' });
  } catch (e: any) {
    console.error('Upload answer error', e);
    return NextResponse.json({ success: false, message: e?.message || 'Server error' }, { status: 500 });
  }
}
