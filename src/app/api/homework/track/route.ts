import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * POST /api/homework/track
 * Body: { customerId: string }
 * Increments `homework_used` and resets daily/weekly quota if needed.
 */
export async function POST(req: Request) {
  try {
    const { customerId } = await req.json();
    if (!customerId) {
      return NextResponse.json({ success: false, message: 'Missing customerId' }, { status: 400 });
    }
    // Get current usage and reset time
    const { data: user, error } = await supabaseAdmin
      .from('customers')
      .select('homework_used, homework_reset_at')
      .eq('id', customerId)
      .maybeSingle();
    if (error) throw error;
    const now = new Date();
    let resetAt = user?.homework_reset_at ? new Date(user.homework_reset_at) : null;
    // Reset daily quota at midnight
    if (!resetAt || now > resetAt) {
      resetAt = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      await supabaseAdmin
        .from('customers')
        .update({ homework_used: 0, homework_reset_at: resetAt.toISOString() })
        .eq('id', customerId);
    }
    // Increment usage
    const newUsed = (user?.homework_used ?? 0) + 1;
    await supabaseAdmin.from('customers').update({ homework_used: newUsed }).eq('id', customerId);
    const limit = 20; // example free quota per day
    const withinQuota = newUsed <= limit;
    return NextResponse.json({ success: true, used: newUsed, limit, withinQuota, resetAt: resetAt.toISOString() });
  } catch (e: any) {
    console.error('Homework track error', e);
    return NextResponse.json({ success: false, message: e?.message || 'Server error' }, { status: 500 });
  }
}
