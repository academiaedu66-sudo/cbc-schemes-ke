import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * POST /api/quiz/enter
 * Body: { customerId: string, quizId: string }
 * Records a quiz tournament entry (awaiting payment).
 */
export async function POST(req: Request) {
  try {
    const { customerId, quizId } = await req.json();
    if (!customerId || !quizId) {
      return NextResponse.json({ success: false, message: 'Missing parameters' }, { status: 400 });
    }
    const { error } = await supabaseAdmin
      .from('quiz_entries')
      .insert({ customer_id: customerId, quiz_id: quizId, paid: false });
    if (error) throw error;
    return NextResponse.json({ success: true, message: 'Quiz entry recorded' });
  } catch (e: any) {
    console.error('Quiz entry error', e);
    return NextResponse.json({ success: false, message: e?.message || 'Server error' }, { status: 500 });
  }
}
