import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { formatPayHeroAuthHeader, getStoredPaymentConfig } from '@/lib/payment-config';
import {
  BOOK_PRICES_KES,
  BOOK_SERIES_TITLES,
  buildFullBookQuestionPool,
  collectOrderedSubTopics,
  formatBookGradeLabel,
  generateCbcBookDocxBuffer,
  generateCbcGradeUpPdfBuffer,
  generateCompleteCompilationPdfBuffer,
  generateMadeFamiliarPdfBuffer,
  getSubjectsForGradeKey,
  type CbcBookType,
} from '@/lib/cbc-books-engine';

const ALL_GRADE_KEYS = [
  'PP1',
  'PP2',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  '11',
  '12',
];

const lastPayheroCheckMap = new Map<string, number>();
function shouldThrottleBookQuery(key: string, minIntervalMs = 900): boolean {
  const now = Date.now();
  const prev = lastPayheroCheckMap.get(key) || 0;
  if (now - prev < minIntervalMs) return true;
  lastPayheroCheckMap.set(key, now);
  if (lastPayheroCheckMap.size > 500) {
    for (const [k, ts] of lastPayheroCheckMap.entries()) {
      if (now - ts > 120_000) lastPayheroCheckMap.delete(k);
    }
  }
  return false;
}

function normalizeBookType(raw: string | null): CbcBookType {
  const up = String(raw || 'GRADE_UP').toUpperCase().trim();
  if (up === 'MADE_FAMILIAR' || up === 'BOOK_MADE_FAMILIAR') return 'MADE_FAMILIAR';
  if (up === 'COMPLETE_BUNDLE' || up === 'BOOK_COMPLETE_BUNDLE') return 'COMPLETE_BUNDLE';
  return 'GRADE_UP';
}

async function resolveVerifiedBookOrder(checkoutRequestId: string) {
  const { data: initialOrder } = await supabaseAdmin
    .from('orders')
    .select('checkout_request_id, status, amount, phone_number, mpesa_receipt_number')
    .eq('checkout_request_id', checkoutRequestId)
    .maybeSingle();

  let order = initialOrder;

  if (
    checkoutRequestId.startsWith('PAYHERO_') &&
    (!order || order.status === 'PENDING') &&
    !shouldThrottleBookQuery(`book_${checkoutRequestId}`, 900)
  ) {
    try {
      const stored = await getStoredPaymentConfig();
      const rawToken = (
        stored.payheroAuthToken ||
        process.env.PAYHERO_AUTH_TOKEN ||
        ''
      ).trim();
      if (rawToken) {
        const reference = checkoutRequestId.replace(/^PAYHERO_/, '');
        const phRes = await fetch(
          `https://backend.payhero.co.ke/api/v2/transaction-status?reference=${encodeURIComponent(
            reference
          )}`,
          {
            headers: { Authorization: formatPayHeroAuthHeader(rawToken) },
            cache: 'no-store',
          }
        );
        const phJson = await phRes.json();
        const st = String(phJson?.status || '').toUpperCase();
        if (st === 'SUCCESS' || st === 'COMPLETED') {
          const receipt = String(
            phJson?.provider_reference ||
              phJson?.third_party_reference ||
              reference
          ).slice(0, 40);
          const amt = Math.max(
            500,
            Number(phJson?.amount) || Number(order?.amount) || 500
          );
          const phPhone = String(
            phJson?.phone_number || order?.phone_number || '254700000000'
          );
          await supabaseAdmin.from('orders').upsert(
            {
              checkout_request_id: checkoutRequestId,
              phone_number: phPhone,
              resource_id: null,
              amount: amt,
              mpesa_receipt_number: receipt,
              status: 'COMPLETED',
            },
            { onConflict: 'checkout_request_id' }
          );
          order = {
            checkout_request_id: checkoutRequestId,
            status: 'COMPLETED',
            amount: amt,
            phone_number: phPhone,
            mpesa_receipt_number: receipt,
          };
        } else if (st === 'FAILED' || st === 'CANCELLED' || st === 'CANCELED') {
          if (order) {
            await supabaseAdmin
              .from('orders')
              .update({ status: 'FAILED', updated_at: new Date().toISOString() })
              .eq('checkout_request_id', checkoutRequestId);
            order = { ...order, status: 'FAILED' };
          }
        }
      }
    } catch {
      // Non-fatal fallback to DB order row
    }
  }

  return order;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const action = (url.searchParams.get('action') || 'preview').toLowerCase();

  try {

    // 1. CATALOG OF GRADES & SUBJECTS
    if (action === 'catalog') {
      const grades = ALL_GRADE_KEYS.map((gk) => ({
        gradeKey: gk,
        gradeLabel: formatBookGradeLabel(gk),
        subjects: getSubjectsForGradeKey(gk),
      }));
      return NextResponse.json({
        grades,
        prices: BOOK_PRICES_KES,
        titles: BOOK_SERIES_TITLES,
      });
    }

    // 2. LIVE SAMPLE PREVIEW FOR ANY GRADE + SUBJECT + BOOK BUTTON
    if (action === 'preview') {
      const bookType = normalizeBookType(url.searchParams.get('bookType'));
      const gradeKey = (url.searchParams.get('gradeKey') || '7').trim();
      const validSubjects = getSubjectsForGradeKey(gradeKey);
      const requestedSubj = (url.searchParams.get('subject') || '').trim();
      const subject = validSubjects.includes(requestedSubj)
        ? requestedSubj
        : validSubjects[0] || 'Mathematics';

      const {
        strands,
        subTopics,
        coursebookTitle,
        approvedBooks,
        officialPortalUrl,
      } = collectOrderedSubTopics(gradeKey, subject);
      const sampleQuestions = buildFullBookQuestionPool(gradeKey, subject, 6);
      const firstUnit = subTopics[0] || {
        strand: strands[0]?.strand || 'Strand 1',
        substrand: strands[0]?.subs[0] || 'Sub-strand 1.1',
        subtopicTitle: strands[0]?.subs[0] || 'Core Concept',
        kiq: 'How do we apply this concept in daily life?',
        resources: 'Approved Learner Book & practical charts',
      };

      const samplePointNotes = [
        `• Core Concept Focus: Clear mastery of "${firstUnit.subtopicTitle}" under ${firstUnit.strand}.`,
        `• Key Inquiry Guide: ${firstUnit.kiq || `How is "${firstUnit.subtopicTitle}" applied practically?`}`,
        `• Practical Learning Aids: ${firstUnit.resources}.`,
        `• Worked Principle: ${sampleQuestions[0]?.explanation || 'Step-by-step worked method & accuracy check.'}`,
        `• Exam Watch-Out: Avoid confusing terms; follow each sub-topic question immediately after reading the notes.`,
      ];

      return NextResponse.json({
        bookType,
        seriesTitle: BOOK_SERIES_TITLES[bookType],
        gradeKey,
        gradeLabel: formatBookGradeLabel(gradeKey),
        subject,
        availableSubjects: validSubjects,
        priceKes: BOOK_PRICES_KES[bookType],
        totalPages: bookType === 'COMPLETE_BUNDLE' ? 100 : 50,
        coursebookTitle,
        approvedBooks,
        officialPortalUrl,
        totalStrands: strands.length,
        totalSubTopics: subTopics.length,
        strands: strands.map((s) => ({
          strand: s.strand,
          subsCount: s.subs.length,
          subsPreview: s.subs.slice(0, 4),
        })),
        sampleSubTopic: {
          strand: firstUnit.strand,
          subtopicTitle: firstUnit.subtopicTitle,
          pointNotes: samplePointNotes,
        },
        sampleQuestions: sampleQuestions.slice(0, 4).map((q) => ({
          qNumber: q.qNumber,
          strand: q.strand,
          substrand: q.substrand,
          prompt: q.prompt,
          options: q.options || null,
          marks: q.marks,
          answerText: q.answerText,
          explanation: q.explanation,
        })),
      });
    }

    // 3. INSTANT PAYMENT STATUS POLLING (AUTO-UNLOCK ON PIN ENTRY)
    if (action === 'status') {
      const checkoutRequestId = (url.searchParams.get('checkoutRequestId') || '').trim();
      if (!checkoutRequestId) {
        return NextResponse.json(
          { error: 'checkoutRequestId is required.' },
          { status: 400 }
        );
      }

      const order = await resolveVerifiedBookOrder(checkoutRequestId);
      if (!order) {
        return NextResponse.json({ status: 'PENDING', amount: 0, unlockedTypes: [] });
      }

      const amt = Number(order.amount) || 0;
      const unlockedTypes: CbcBookType[] = [];
      if (order.status === 'COMPLETED') {
        if (amt >= 500) unlockedTypes.push('GRADE_UP');
        if (amt >= 750) unlockedTypes.push('MADE_FAMILIAR');
        if (amt >= 1500) unlockedTypes.push('COMPLETE_BUNDLE');
      }

      return NextResponse.json({
        status: order.status,
        amount: amt,
        receipt: order.mpesa_receipt_number || null,
        unlockedTypes,
      });
    }

    // 4. AUTHENTICATED 50-PAGE / 100-PAGE BOOK DOWNLOAD (.PDF OR .DOCX)
    if (action === 'download') {
      const checkoutRequestId = (url.searchParams.get('checkoutRequestId') || '').trim();
      const bookType = normalizeBookType(url.searchParams.get('bookType'));
      const gradeKey = (url.searchParams.get('gradeKey') || '7').trim();
      const validSubjects = getSubjectsForGradeKey(gradeKey);
      const requestedSubj = (url.searchParams.get('subject') || '').trim();
      const subject = validSubjects.includes(requestedSubj)
        ? requestedSubj
        : validSubjects[0] || 'Mathematics';
      const format = (url.searchParams.get('format') || 'pdf').toLowerCase();

      // Admin internal verification bypass only on localhost when needed for automated PDF QA
      const isLocalQa =
        process.env.NODE_ENV !== 'production' &&
        checkoutRequestId === 'LOCAL_QA_VERIFY_50_PAGES';

      if (!isLocalQa) {
        if (!checkoutRequestId) {
          return NextResponse.json(
            { error: 'M-Pesa payment verification is required to download this book.' },
            { status: 402 }
          );
        }

        const order = await resolveVerifiedBookOrder(checkoutRequestId);
        const requiredKes = BOOK_PRICES_KES[bookType];

        if (!order || order.status !== 'COMPLETED') {
          return NextResponse.json(
            {
              error:
                'Your M-Pesa payment is not yet confirmed. Please enter your M-Pesa PIN on your phone first.',
            },
            { status: 402 }
          );
        }

        if ((Number(order.amount) || 0) < requiredKes) {
          return NextResponse.json(
            {
              error: `This book requires a KSh ${requiredKes} payment (received KSh ${order.amount}).`,
            },
            { status: 403 }
          );
        }
      }

      const cleanGrade = formatBookGradeLabel(gradeKey).replace(/\s+/g, '_');
      const cleanSubj = subject.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '');
      const seriesSlug =
        bookType === 'GRADE_UP'
          ? 'CBC_GRADE_UP_50_Pages'
          : bookType === 'MADE_FAMILIAR'
          ? 'COMPETENCY_BASED_MADE_FAMILIAR_50_Pages'
          : 'COMPLETE_COMPILATION_CBC_GRADE_UP_AND_MADE_FAMILIAR_100_Pages';

      if (format === 'docx') {
        const docxBuf = await generateCbcBookDocxBuffer({
          bookType,
          gradeKey,
          subject,
        });
        return new NextResponse(new Uint8Array(docxBuf), {
          status: 200,
          headers: {
            'Content-Type':
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'Content-Disposition': `attachment; filename="${seriesSlug}_${cleanGrade}_${cleanSubj}.docx"`,
            'Cache-Control': 'no-store',
          },
        });
      }

      let pdfBytes: Uint8Array;
      if (bookType === 'GRADE_UP') {
        pdfBytes = await generateCbcGradeUpPdfBuffer({ gradeKey, subject });
      } else if (bookType === 'MADE_FAMILIAR') {
        pdfBytes = await generateMadeFamiliarPdfBuffer({ gradeKey, subject });
      } else {
        pdfBytes = await generateCompleteCompilationPdfBuffer({ gradeKey, subject });
      }

      return new NextResponse(Buffer.from(pdfBytes), {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${seriesSlug}_${cleanGrade}_${cleanSubj}.pdf"`,
          'Cache-Control': 'no-store',
        },
      });
    }

    return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
  } catch (err) {
    console.error('[Books API Error]:', err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : 'Unable to process book request right now.',
      },
      { status: 500 }
    );
  }
}
