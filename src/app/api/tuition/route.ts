import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthorized } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase';
import {
  normalizeKenyanPhone,
  sendWhatsAppAdminNotification,
} from '@/lib/mpesa';
import {
  COORDINATOR_WHATSAPP_INTL,
  COORDINATOR_WHATSAPP_LOCAL,
  findSubjectMatches,
  getStoredTuitionRegistrations,
  GRADE_BAND_LABELS,
  gradeToBand,
  LEARNER_FEE_KES,
  saveTuitionRegistration,
  TEACHER_FEE_KES,
  type GradeBandKey,
  type TuitionRegistration,
  type TuitionRole,
} from '@/lib/tuition';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const isAdmin = isAdminAuthorized(req);
  const wantAdmin = searchParams.get('admin') === '1';

  const pool = await getStoredTuitionRegistrations();

  if (isAdmin && wantAdmin) {
    // Sync payment statuses from orders table for any registration with checkoutRequestId
    const checkoutIds = pool
      .map((r) => r.checkoutRequestId)
      .filter((x): x is string => Boolean(x));

    const orderMap = new Map<string, { status: string; receipt: string | null }>();
    if (checkoutIds.length > 0) {
      const { data: orders } = await supabaseAdmin
        .from('orders')
        .select('checkout_request_id, status, mpesa_receipt_number')
        .in('checkout_request_id', checkoutIds);

      for (const o of orders || []) {
        orderMap.set(o.checkout_request_id, {
          status: o.status,
          receipt: o.mpesa_receipt_number || null,
        });
      }
    }

    const enriched = pool.map((r) => {
      const ord = r.checkoutRequestId ? orderMap.get(r.checkoutRequestId) : undefined;
      const paymentStatus =
        ord?.status === 'COMPLETED' ? 'COMPLETED' : r.paymentStatus;
      const mpesaReceipt = ord?.receipt || r.mpesaReceipt;
      const matches = findSubjectMatches({
        targetRole: r.role === 'LEARNER' ? 'TEACHER' : 'LEARNER',
        subjects: r.subjects,
        gradeBands: r.gradeBands,
        county: r.county,
        pool,
      });

      return {
        ...r,
        paymentStatus,
        mpesaReceipt,
        matches,
      };
    });

    return NextResponse.json({ registrations: enriched });
  }

  // Public live subject-match preview (NO phone numbers ever exposed)
  const role: TuitionRole =
    searchParams.get('role') === 'TEACHER' ? 'TEACHER' : 'LEARNER';
  const rawSubjects = searchParams.get('subjects') || '';
  const subjects = rawSubjects
    .split('|')
    .map((s) => s.trim())
    .filter(Boolean);
  const rawBands = searchParams.get('bands') || '';
  const gradeBands = rawBands
    .split('|')
    .map((b) => b.trim() as GradeBandKey)
    .filter(Boolean);
  const county = searchParams.get('county') || '';

  const matches =
    subjects.length > 0
      ? findSubjectMatches({
          targetRole: role === 'LEARNER' ? 'TEACHER' : 'LEARNER',
          subjects,
          gradeBands: gradeBands.length > 0 ? gradeBands : ['JUNIOR_SCHOOL'],
          county,
          pool,
        })
      : [];

  return NextResponse.json({
    matchCount: matches.length,
    matches,
    coordinatorWhatsapp: COORDINATOR_WHATSAPP_LOCAL,
  });
}

export async function POST(req: NextRequest) {
  void req.headers.get('user-agent');

  try {
    const body = await req.json();
    const role: TuitionRole = body.role === 'TEACHER' ? 'TEACHER' : 'LEARNER';
    const fullName = String(body.fullName || '').trim();
    const rawPhone = String(body.phone || '').trim();
    const phone = normalizeKenyanPhone(rawPhone) || rawPhone;
    const county = String(body.county || '').trim() || 'Kenya (Flexible)';
    const learnerGrade = String(body.learnerGrade || '').trim();
    const subjects = Array.isArray(body.subjects)
      ? body.subjects.map((s: unknown) => String(s).trim()).filter(Boolean)
      : [];

    if (!fullName || !phone || subjects.length === 0) {
      return NextResponse.json(
        {
          error:
            'Full name, phone number, and at least one CBC subject are required.',
        },
        { status: 400 }
      );
    }

    const gradeBands: GradeBandKey[] =
      role === 'LEARNER'
        ? [gradeToBand(learnerGrade || '7')]
        : Array.isArray(body.gradeBands) && body.gradeBands.length > 0
        ? body.gradeBands
        : ['JUNIOR_SCHOOL'];

    const feeKes = role === 'LEARNER' ? LEARNER_FEE_KES : TEACHER_FEE_KES;
    const checkoutRequestId = body.checkoutRequestId
      ? String(body.checkoutRequestId)
      : undefined;

    let paymentStatus: 'PENDING' | 'COMPLETED' =
      body.paymentStatus === 'COMPLETED' ? 'COMPLETED' : 'PENDING';
    let mpesaReceipt: string | undefined = body.mpesaReceipt
      ? String(body.mpesaReceipt)
      : undefined;

    if (checkoutRequestId) {
      const { data: ord } = await supabaseAdmin
        .from('orders')
        .select('status, mpesa_receipt_number')
        .eq('checkout_request_id', checkoutRequestId)
        .maybeSingle();

      if (ord?.status === 'COMPLETED') {
        paymentStatus = 'COMPLETED';
      }
      if (ord?.mpesa_receipt_number) {
        mpesaReceipt = ord.mpesa_receipt_number;
      }
    }

    const prefix = role === 'LEARNER' ? 'STU' : 'TCH';
    const referenceCode =
      body.referenceCode ||
      `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;

    const entry: TuitionRegistration = {
      id: body.id || `${prefix.toLowerCase()}-${Date.now()}`,
      referenceCode,
      role,
      fullName,
      phone,
      county,
      learnerGrade: role === 'LEARNER' ? learnerGrade : undefined,
      gradeBands,
      subjects,
      mode: body.mode || 'Home or Online',
      schedule: body.schedule || 'School Holidays (April / Aug / Dec)',
      tscOrQualification: body.tscOrQualification
        ? String(body.tscOrQualification).trim()
        : undefined,
      notes: body.notes ? String(body.notes).trim() : undefined,
      feeKes,
      checkoutRequestId,
      mpesaReceipt,
      paymentStatus,
      createdAt: new Date().toISOString(),
    };

    const updatedPool = await saveTuitionRegistration(entry);
    const matches = findSubjectMatches({
      targetRole: role === 'LEARNER' ? 'TEACHER' : 'LEARNER',
      subjects: entry.subjects,
      gradeBands: entry.gradeBands,
      county: entry.county,
      pool: updatedPool,
    });

    const levelDesc =
      role === 'LEARNER'
        ? learnerGrade.startsWith('PP')
          ? learnerGrade
          : `Grade ${learnerGrade}`
        : gradeBands.map((b) => GRADE_BAND_LABELS[b]).join('; ');

    const matchedCodesSummary =
      matches.length > 0
        ? matches
            .slice(0, 4)
            .map((m) => `${m.referenceCode} (${m.maskedName}: ${m.matchedSubjects.join(', ')})`)
            .join(' | ')
        : 'Coordinator Priority Match';

    // Mandatory WhatsApp Coordinator message to 0705759072
    const waText =
      role === 'LEARNER'
        ? `Hello Coordinator (${COORDINATOR_WHATSAPP_LOCAL})! 🎓 *PERSONAL / HOLIDAY TEACHER BOOKING*\n` +
          `• *Booking Ref:* ${referenceCode}\n` +
          `• *Learner / Parent:* ${fullName} (${phone})\n` +
          `• *Grade Level:* ${levelDesc}\n` +
          `• *Subjects Needed (${subjects.length}):* ${subjects.join(', ')}\n` +
          `• *Location & Mode:* ${county} (${entry.mode})\n` +
          `• *Schedule:* ${entry.schedule}\n` +
          `• *Registration Fee:* KSh ${LEARNER_FEE_KES} (${mpesaReceipt || paymentStatus})\n` +
          `• *Matched Teachers:* ${matchedCodesSummary}\n` +
          `Please connect me with my matched subject teacher(s).`
        : `Hello Coordinator (${COORDINATOR_WHATSAPP_LOCAL})! 👨‍🏫 *PERSONAL / HOLIDAY TEACHER REGISTRATION*\n` +
          `• *Teacher Ref:* ${referenceCode}\n` +
          `• *Teacher Name:* ${fullName} (${phone})\n` +
          `• *Qualification:* ${entry.tscOrQualification || 'CBC Teacher'}\n` +
          `• *Levels Taught:* ${levelDesc}\n` +
          `• *Subjects Taught (${subjects.length}):* ${subjects.join(', ')}\n` +
          `• *Location & Mode:* ${county} (${entry.mode})\n` +
          `• *Availability:* ${entry.schedule}\n` +
          `• *Registration Fee:* KSh ${TEACHER_FEE_KES} (${mpesaReceipt || paymentStatus})\n` +
          `• *Matched Learner Requests:* ${matchedCodesSummary}\n` +
          `Please verify my profile and connect me with learners in my subjects.`;

    // Also notify coordinator inbox 254705759072 automatically from server
    await sendWhatsAppAdminNotification(waText).catch(() => {});

    const whatsappCoordinatorUrl = `https://wa.me/${COORDINATOR_WHATSAPP_INTL}?text=${encodeURIComponent(
      waText
    )}`;

    return NextResponse.json({
      success: true,
      registration: {
        id: entry.id,
        referenceCode: entry.referenceCode,
        role: entry.role,
        feeKes: entry.feeKes,
        paymentStatus: entry.paymentStatus,
      },
      matches,
      whatsappCoordinatorUrl,
      coordinatorWhatsapp: COORDINATOR_WHATSAPP_LOCAL,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to save tuition registration';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
