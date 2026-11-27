import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * POST /api/teacher/assets/upload
 * Body: { teacherId: string, title: string, description?: string, fileUrl: string, priceKes: number }
 * Stores a new teacher‑created asset.
 */
export async function POST(req: Request) {
  try {
    const { teacherId, title, description, fileUrl, priceKes } = await req.json();
    if (!teacherId || !title || !fileUrl || !priceKes) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }
    const { error } = await supabaseAdmin
      .from('teacher_assets')
      .insert({
        teacher_id: teacherId,
        title,
        description: description || '',
        file_url: fileUrl,
        price: priceKes,
      });
    if (error) throw error;
    return NextResponse.json({ success: true, message: 'Asset uploaded' });
  } catch (e: any) {
    console.error('Asset upload error', e);
    return NextResponse.json({ success: false, message: e?.message || 'Server error' }, { status: 500 });
  }
}
