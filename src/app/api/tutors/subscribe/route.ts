import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * POST /api/tutors/subscribe
 * Body: { tutorId: string }
 * Grants a verified badge to the tutor (adds entry to teacher_subscriptions).
 */
export async function POST(req: Request) {
  try {
    const { tutorId } = await req.json();
    if (!tutorId) {
      return NextResponse.json({ success: false, message: 'Missing tutorId' }, { status: 400 });
    }
    // Set verification expiry 30 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    const { error } = await supabaseAdmin
      .from('teacher_subscriptions')
      .insert({ teacher_id: tutorId, vip_until: expiresAt.toISOString() });
    if (error) throw error;
    return NextResponse.json({ success: true, message: 'Tutor verified for 30 days' });
  } catch (e: any) {
    console.error('Tutor verify error', e);
    return NextResponse.json({ success: false, message: e?.message || 'Server error' }, { status: 500 });
  }
}
