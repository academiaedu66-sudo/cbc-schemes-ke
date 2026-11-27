import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { initiateStkPush } from '@/lib/mpesa';

/**
 * POST /api/schools/invoice
 * Body: { customerId: string, grades: string[] }
 * Returns: { success: boolean, paymentUrl?: string }
 */
export async function POST(req: Request) {
  try {
    const { customerId, grades } = await req.json();
    if (!customerId || !Array.isArray(grades) || grades.length === 0) {
      return NextResponse.json({ success: false, message: 'Invalid request' }, { status: 400 });
    }
    // Simple pricing: KSh 5,000 per term + KSh 500 per grade as example
    const base = 5000;
    const perGrade = 500;
    const amount = base + perGrade * grades.length;

    // Create invoice record (pending)
    const { data: invoice, error } = await supabaseAdmin
      .from('school_invoices')
      .insert({
        customer_id: customerId,
        grades,
        amount,
        status: 'pending',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw error;

    // Initiate M‑Pesa STK push for payment
    const stk = await initiateStkPush({
      phoneNumber: '', // client will supply later via front‑end UI
      amount,
      reference: `SCH-${invoice.id}-${Date.now()}`,
      description: `School invoice for grades ${grades.join(', ')}`,
    });

    // Optionally store payment intent ID if available on stk result
    // await supabaseAdmin.from('school_invoices').update({ payment_intent_id: stk?.CheckoutRequestID }).eq('id', invoice.id);

    return NextResponse.json({ success: true, message: 'Invoice created, STK push initiated', invoiceId: invoice.id });
  } catch (e: any) {
    console.error('School invoice error', e);
    return NextResponse.json({ success: false, message: e?.message || 'Server error' }, { status: 500 });
  }
}
