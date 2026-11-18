import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { formatPayHeroAuthHeader, getStoredPaymentConfig } from '@/lib/payment-config';
import {
  extractMpesaNameFromPayload,
  recordBuyerMpesaName,
  resolveBuyerMpesaName,
} from '@/lib/buyer-identity';
import {
  BOOK_ALL_TERMS_PRICES_KES,
  BOOK_PRICES_KES,
  BOOK_SERIES_TITLES,
  buildFullBookQuestionPool,
  buildStructuredSyllabusNotesTree,
  collectOrderedSubTopics,
  formatBookGradeLabel,
  formatBookTermLabel,
  generateCbcBookDocxBuffer,
  generateCbcGradeUpPdfBuffer,
  generateCompleteCompilationPdfBuffer,
  generateMadeFamiliarPdfBuffer,
  getBookPriceKes,
  getBookQuestionCounts,
  getSubjectsForGradeKey,
  normalizeBookTerm,
  type BookTermOption,
  type CbcBookType,
} from '@/lib/cbc-books-engine';
import {
  buildJamoKenyattaKjseaExam,
  generateJamoKjseaDocxBuffer,
  generateJamoKjseaPdfBuffer,
} from '@/lib/jamo-kjsea-exam';

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
  let detectedMpesaName = '';

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
        detectedMpesaName = extractMpesaNameFromPayload(phJson);
        if (st === 'SUCCESS' || st === 'COMPLETED') {
          const receipt = String(
            phJson?.provider_reference ||
            phJson?.third_party_reference ||
            reference
          ).slice(0, 40);
          const amt = Math.max(
            10,
            Number(phJson?.amount) || Number(order?.amount) || 50
          );
          const phPhone = String(
            phJson?.phone_number || order?.phone_number || '254700000000'
          );
          if (detectedMpesaName) {
            await recordBuyerMpesaName({
              checkoutRequestId,
              phone: phPhone,
              buyerName: detectedMpesaName,
            });
          }
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

  const buyerName = order
    ? await resolveBuyerMpesaName({
      checkoutRequestId,
      phone: order.phone_number,
      fallbackName: detectedMpesaName,
    })
    : detectedMpesaName;

  return { order, buyerName };
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const action = (url.searchParams.get('action') || 'preview').toLowerCase();

  try {
    // 1. CATALOG OF GRADES, SUBJECTS & TERM PRICING (+20% FOR ALL TERMS)
    if (action === 'catalog') {
      const grades = ALL_GRADE_KEYS.map((gk) => ({
        gradeKey: gk,
        gradeLabel: formatBookGradeLabel(gk),
        subjects: getSubjectsForGradeKey(gk),
      }));
      return NextResponse.json({
        grades,
        singleTermPrices: BOOK_PRICES_KES,
        allTermsPrices: BOOK_ALL_TERMS_PRICES_KES,
        prices: BOOK_PRICES_KES,
        titles: BOOK_SERIES_TITLES,
      });
    }

    // DEV QA: FULL AUDIT OF TERM 1, TERM 2, TERM 3 & ALL-TERMS SHORT NOTES, EXAMPLES & ZERO-REPEAT QUESTIONS
    if (
      (action === 'verify_zero_repeat' || action === 'verify_notes_and_questions') &&
      process.env.NODE_ENV !== 'production'
    ) {
      const requestedTermParam = url.searchParams.get('term');
      const termsToAudit: BookTermOption[] =
        requestedTermParam !== null
          ? [normalizeBookTerm(requestedTermParam)]
          : [1, 2, 3, 0];

      let totalPairs = 0;
      let totalStrandsChecked = 0;
      let totalSubstrandsChecked = 0;
      let totalNotePointsChecked = 0;
      let globalMinSubPoints = 999;
      let globalMinStrandPoints = 999;
      let missingStrandViolations = 0;
      let substrandUnder11Violations = 0;
      let strandUnder30Violations = 0;
      let missingExampleViolations = 0;
      let duplicateNoteCount = 0;
      let totalQuestionsChecked = 0;
      let duplicateCount = 0;
      const violations: string[] = [];

      for (const termOpt of termsToAudit) {
        for (const gk of ALL_GRADE_KEYS) {
          for (const subj of getSubjectsForGradeKey(gk)) {
            totalPairs++;
            const rawSyl = collectOrderedSubTopics(gk, subj, termOpt);
            const tree0 = buildStructuredSyllabusNotesTree(gk, subj, 0, termOpt);
            const tree1 = buildStructuredSyllabusNotesTree(gk, subj, 1, termOpt);

            if (tree0.strands.length !== rawSyl.strands.length || tree0.strands.length === 0) {
              missingStrandViolations++;
              violations.push(`Missing strands in T${termOpt} ${gk} ${subj}`);
            }

            const seenNotes = new Set<string>();
            for (const tree of [tree0, tree1]) {
              for (const st of tree.strands) {
                totalStrandsChecked++;
                globalMinStrandPoints = Math.min(globalMinStrandPoints, st.totalPoints);
                if (st.totalPoints < 30) {
                  strandUnder30Violations++;
                  if (violations.length < 20) {
                    violations.push(
                      `Strand <30 pts: T${termOpt} ${gk} ${subj} ${st.strandTitle} (${st.totalPoints})`
                    );
                  }
                }
                for (const sub of st.substrands) {
                  totalSubstrandsChecked++;
                  totalNotePointsChecked += sub.points.length;
                  globalMinSubPoints = Math.min(globalMinSubPoints, sub.points.length);
                  if (sub.points.length <= 10) {
                    substrandUnder11Violations++;
                    if (violations.length < 20) {
                      violations.push(
                        `Substrand <=10 pts: T${termOpt} ${gk} ${subj} ${sub.substrandTitle} (${sub.points.length})`
                      );
                    }
                  }
                  for (const pt of sub.points) {
                    if (
                      !pt.includes('Valid Approved Examples [') &&
                      !pt.includes('Mifano Sanifu kutoka Vitabu Teule [')
                    ) {
                      missingExampleViolations++;
                      if (violations.length < 20) {
                        violations.push(
                          `Missing example in T${termOpt} ${gk} ${subj}: ${pt.slice(0, 80)}`
                        );
                      }
                    }
                    const normPt = pt
                      .replace(/^\d+\.\s*/, '')
                      .toLowerCase()
                      .replace(/\s+/g, ' ')
                      .trim();
                    if (seenNotes.has(normPt)) {
                      duplicateNoteCount++;
                      if (violations.length < 20) {
                        violations.push(`Dup note in T${termOpt} ${gk} ${subj}: ${pt.slice(0, 80)}`);
                      }
                    }
                    seenNotes.add(normPt);
                  }
                }
              }
            }

            const { madeFamiliarCount, gradeUpCount } = getBookQuestionCounts(
              tree0.totalSubstrands,
              termOpt
            );
            const qMadeFamiliar = buildFullBookQuestionPool(
              gk,
              subj,
              madeFamiliarCount,
              0,
              termOpt
            );
            const qGradeUp = buildFullBookQuestionPool(
              gk,
              subj,
              gradeUpCount,
              madeFamiliarCount,
              termOpt
            );
            const combined = [...qMadeFamiliar, ...qGradeUp];
            totalQuestionsChecked += combined.length;

            const seenQs = new Set<string>();
            for (const q of combined) {
              const norm = q.prompt.toLowerCase().replace(/\s+/g, ' ').trim();
              if (seenQs.has(norm)) {
                duplicateCount++;
                if (violations.length < 20) {
                  violations.push(`Dup Q in T${termOpt} ${gk} ${subj}: ${q.prompt.slice(0, 80)}`);
                }
              }
              seenQs.add(norm);
            }
          }
        }
      }

      return NextResponse.json({
        termsAudited: termsToAudit,
        totalPairs,
        totalStrandsChecked,
        totalSubstrandsChecked,
        totalNotePointsChecked,
        globalMinSubPoints,
        globalMinStrandPoints,
        missingStrandViolations,
        substrandUnder11Violations,
        strandUnder30Violations,
        missingExampleViolations,
        duplicateNoteCount,
        totalQuestionsChecked,
        duplicateCount,
        violations,
      });
    }

    // DEV QA & INTERNAL BUILDER FOR "JAMO KENYATTA KJSEA EXAM" (20 QUESTIONS, 2 HOURS, ALL STRANDS, 0% REPEAT)
    if (action === 'verify_jamo_kjsea' && process.env.NODE_ENV !== 'production') {
      let totalExams = 0;
      let missingStrands = 0;
      let duplicateQuestions = 0;
      let englishLeakInKiswahili = 0;
      const sampleIssues: string[] = [];

      for (const gk of ALL_GRADE_KEYS) {
        for (const subj of getSubjectsForGradeKey(gk)) {
          totalExams++;
          const exam = buildJamoKenyattaKjseaExam(gk, subj);
          const seen = new Set<string>();
          const coveredStrands = new Set<string>();

          for (const q of exam.sectionA) {
            coveredStrands.add(q.strand);
            const k = q.prompt.toLowerCase().trim();
            if (seen.has(k)) {
              duplicateQuestions++;
              sampleIssues.push(`Dup MCQ in ${gk} ${subj}: ${q.prompt.slice(0, 70)}`);
            }
            seen.add(k);
          }
          for (const sq of exam.sectionB) {
            coveredStrands.add(sq.strand);
            for (const p of [sq.partAPrompt, sq.partBPrompt]) {
              const k = p.toLowerCase().trim();
              if (seen.has(k)) {
                duplicateQuestions++;
                sampleIssues.push(`Dup Struct in ${gk} ${subj}: ${p.slice(0, 70)}`);
              }
              seen.add(k);
            }
            if (
              exam.isKiswahili &&
              /\b(state and explain|distinguish clearly|outline four|candidates make)\b/i.test(
                `${sq.partAPrompt} ${sq.partBPrompt}`
              )
            ) {
              englishLeakInKiswahili++;
              sampleIssues.push(`English leak in ${gk} ${subj}`);
            }
          }

          for (const st of exam.strandsCovered) {
            if (!coveredStrands.has(st)) {
              missingStrands++;
              sampleIssues.push(`Strand not covered in ${gk} ${subj}: ${st}`);
            }
          }
        }
      }

      return NextResponse.json({
        totalExams,
        questionsPerExam: 20,
        duration: '2 HOURS',
        missingStrands,
        duplicateQuestions,
        englishLeakInKiswahili,
        sampleIssues: sampleIssues.slice(0, 20),
      });
    }

    if (action === 'jamo_kjsea_download' && process.env.NODE_ENV !== 'production') {
      const gradeKey = (url.searchParams.get('gradeKey') || '9').trim();
      const subject = (url.searchParams.get('subject') || 'Mathematics').trim();
      const format = (url.searchParams.get('format') || 'pdf').toLowerCase();
      const mode =
        (url.searchParams.get('mode') || 'PAPER').toUpperCase() === 'MARKING_SCHEME'
          ? 'MARKING_SCHEME'
          : 'PAPER';
      if (format === 'docx') {
        const docxBuf = await generateJamoKjseaDocxBuffer({ gradeKey, subject, mode });
        return new NextResponse(new Uint8Array(docxBuf), {
          status: 200,
          headers: {
            'Content-Type':
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          },
        });
      }
      const pdfBytes = await generateJamoKjseaPdfBuffer({ gradeKey, subject, mode });
      return new NextResponse(Buffer.from(pdfBytes), {
        status: 200,
        headers: { 'Content-Type': 'application/pdf' },
      });
    }

    // LIVE PREVIEW FOR "NATIONAL KJSEA EXAMINATION (ALL GRADES)" BUTTON
    if (action === 'kjsea_preview') {
      const gradeKey = (url.searchParams.get('gradeKey') || '9').trim();
      const validSubjects = getSubjectsForGradeKey(gradeKey);
      const requestedSubj = (url.searchParams.get('subject') || '').trim();
      const subject = validSubjects.includes(requestedSubj)
        ? requestedSubj
        : validSubjects[0] || 'Mathematics';

      const exam = buildJamoKenyattaKjseaExam(gradeKey, subject);
      return NextResponse.json({
        examTitle: exam.examTitle,
        paperCode: exam.paperCode,
        durationLabel: exam.durationLabel,
        gradeKey: exam.gradeKey,
        gradeLabel: exam.gradeLabel,
        kiswahiliGradeLabel: exam.kiswahiliGradeLabel,
        subject: exam.subject,
        availableSubjects: validSubjects,
        isKiswahili: exam.isKiswahili,
        strandsCovered: exam.strandsCovered,
        totalQuestions: exam.totalQuestions,
        totalMarks: exam.totalMarks,
        paperPriceKes: 50,
        markingSchemePriceKes: 50,
        sampleMcq: exam.sectionA.slice(0, 2).map((q) => ({
          qNumber: q.qNumber,
          strand: q.strand,
          prompt: q.prompt,
          options: q.options,
          marks: q.marks,
        })),
        sampleStructured: exam.sectionB.slice(0, 1).map((sq) => ({
          qNumber: sq.qNumber,
          strand: sq.strand,
          substrand: sq.substrand,
          partAPrompt: sq.partAPrompt,
          partAMarks: sq.partAMarks,
          partBPrompt: sq.partBPrompt,
          partBMarks: sq.partBMarks,
          totalMarks: sq.totalMarks,
        })),
      });
    }

    // AUTHENTICATED DOWNLOAD FOR "NATIONAL KJSEA EXAMINATION (ALL GRADES)" (PAPER KSH 50 | MARKING SCHEME KSH 50)
    if (action === 'kjsea_authenticated_download') {
      const checkoutRequestId = (url.searchParams.get('checkoutRequestId') || '').trim();
      const gradeKey = (url.searchParams.get('gradeKey') || '9').trim();
      const validSubjects = getSubjectsForGradeKey(gradeKey);
      const requestedSubj = (url.searchParams.get('subject') || '').trim();
      const subject = validSubjects.includes(requestedSubj)
        ? requestedSubj
        : validSubjects[0] || 'Mathematics';
      const format = (url.searchParams.get('format') || 'pdf').toLowerCase();
      const mode =
        (url.searchParams.get('mode') || 'PAPER').toUpperCase() === 'MARKING_SCHEME'
          ? 'MARKING_SCHEME'
          : 'PAPER';

      if (!checkoutRequestId) {
        return NextResponse.json(
          { error: 'M-Pesa payment verification is required to download.' },
          { status: 402 }
        );
      }

      const { order } = await resolveVerifiedBookOrder(checkoutRequestId);
      if (!order || order.status !== 'COMPLETED') {
        return NextResponse.json(
          {
            error:
              'Your KSh 50 M-Pesa payment is not yet confirmed. Please enter your M-Pesa PIN on your phone first.',
          },
          { status: 402 }
        );
      }

      if ((Number(order.amount) || 0) < 50) {
        return NextResponse.json(
          {
            error: `This ${mode === 'MARKING_SCHEME' ? 'Marking Scheme' : 'Question Paper'} requires a KSh 50 payment (received KSh ${order.amount}).`,
          },
          { status: 403 }
        );
      }

      const cleanGrade = formatBookGradeLabel(gradeKey).replace(/\s+/g, '_');
      const cleanSubj = subject.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '');
      const docSlug =
        mode === 'MARKING_SCHEME'
          ? 'KENYA_NATIONAL_KJSEA_TEST_MARKING_SCHEME'
          : 'KENYA_NATIONAL_KJSEA_TEST_QUESTION_PAPER';

      if (format === 'docx') {
        const docxBuf = await generateJamoKjseaDocxBuffer({ gradeKey, subject, mode });
        return new NextResponse(new Uint8Array(docxBuf), {
          status: 200,
          headers: {
            'Content-Type':
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'Content-Disposition': `attachment; filename="${docSlug}_${cleanGrade}_${cleanSubj}.docx"`,
            'Cache-Control': 'no-store',
          },
        });
      }

      const pdfBytes = await generateJamoKjseaPdfBuffer({ gradeKey, subject, mode });
      return new NextResponse(Buffer.from(pdfBytes), {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${docSlug}_${cleanGrade}_${cleanSubj}.pdf"`,
          'Cache-Control': 'no-store',
        },
      });
    }

    // 2. LIVE SAMPLE PREVIEW FOR ANY GRADE + SUBJECT + TERM + BOOK BUTTON
    if (action === 'preview') {
      const bookType = normalizeBookType(url.searchParams.get('bookType'));
      const term = normalizeBookTerm(url.searchParams.get('term') ?? 1);
      const gradeKey = (url.searchParams.get('gradeKey') || '7').trim();
      const validSubjects = getSubjectsForGradeKey(gradeKey);
      const requestedSubj = (url.searchParams.get('subject') || '').trim();
      const subject = validSubjects.includes(requestedSubj)
        ? requestedSubj
        : validSubjects[0] || 'Mathematics';

      const notesTree = buildStructuredSyllabusNotesTree(gradeKey, subject, 0, term);
      const { madeFamiliarCount } = getBookQuestionCounts(
        notesTree.totalSubstrands,
        term
      );
      const sampleQuestions =
        bookType === 'GRADE_UP'
          ? buildFullBookQuestionPool(gradeKey, subject, 6, madeFamiliarCount, term)
          : buildFullBookQuestionPool(gradeKey, subject, 6, 0, term);

      const firstStrand = notesTree.strands[0];
      const firstSub = firstStrand?.substrands[0];
      const priceKes = getBookPriceKes(bookType, term);

      return NextResponse.json({
        bookType,
        seriesTitle: BOOK_SERIES_TITLES[bookType],
        term,
        termLabel: formatBookTermLabel(term),
        gradeKey,
        gradeLabel: formatBookGradeLabel(gradeKey),
        subject,
        availableSubjects: validSubjects,
        priceKes,
        singleTermPriceKes: getBookPriceKes(bookType, 1),
        allTermsPriceKes: getBookPriceKes(bookType, 0),
        totalPages: bookType === 'COMPLETE_BUNDLE' ? 100 : 50,
        coursebookTitle: notesTree.coursebookTitle,
        approvedBooks: notesTree.approvedBooks,
        officialPortalUrl: notesTree.officialPortalUrl,
        totalStrands: notesTree.totalStrands,
        totalSubTopics: notesTree.totalSubstrands,
        totalNotePoints: notesTree.totalPoints,
        minPointsPerSubstrand: notesTree.minPointsPerSubstrand,
        minPointsPerStrand: notesTree.minPointsPerStrand,
        strands: notesTree.strands.map((s) => ({
          strand: s.strandTitle,
          term: s.term,
          subsCount: s.substrands.length,
          totalPoints: s.totalPoints,
          subsPreview: s.substrands.slice(0, 4).map((sub) => sub.substrandTitle),
        })),
        sampleSubTopic: {
          strand: firstStrand?.strandTitle || 'Strand 1',
          subtopicTitle: firstSub?.substrandTitle || 'Sub-strand 1.1',
          pointNotes: firstSub?.points || [],
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

    // 3. INSTANT PAYMENT STATUS POLLING (RETURNS BUYER M-PESA NAME FOR APPRECIATION FLOWER!)
    if (action === 'status') {
      const checkoutRequestId = (url.searchParams.get('checkoutRequestId') || '').trim();
      if (!checkoutRequestId) {
        return NextResponse.json(
          { error: 'checkoutRequestId is required.' },
          { status: 400 }
        );
      }

      const { order, buyerName } = await resolveVerifiedBookOrder(checkoutRequestId);
      if (!order) {
        return NextResponse.json({
          status: 'PENDING',
          amount: 0,
          unlockedTypes: [],
          buyerName: buyerName || null,
        });
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
        buyerName: buyerName || null,
        unlockedTypes,
      });
    }

    // 4. AUTHENTICATED SUBJECT BOOK DOWNLOAD (.PDF OR .DOCX FOR TERM 1, 2, 3 OR ALL TERMS)
    if (action === 'download') {
      const checkoutRequestId = (url.searchParams.get('checkoutRequestId') || '').trim();
      const bookType = normalizeBookType(url.searchParams.get('bookType'));
      const term = normalizeBookTerm(url.searchParams.get('term') ?? 0);
      const gradeKey = (url.searchParams.get('gradeKey') || '7').trim();
      const validSubjects = getSubjectsForGradeKey(gradeKey);
      const requestedSubj = (url.searchParams.get('subject') || '').trim();
      const subject = validSubjects.includes(requestedSubj)
        ? requestedSubj
        : validSubjects[0] || 'Mathematics';
      const format = (url.searchParams.get('format') || 'pdf').toLowerCase();

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

        const { order } = await resolveVerifiedBookOrder(checkoutRequestId);
        const requiredKes = getBookPriceKes(bookType, term);

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
              error: `This ${formatBookTermLabel(term)} book requires a KSh ${requiredKes} payment (received KSh ${order.amount}).`,
            },
            { status: 403 }
          );
        }
      }

      const cleanGrade = formatBookGradeLabel(gradeKey).replace(/\s+/g, '_');
      const cleanSubj = subject.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '');
      const termSlug = term === 0 ? 'All_Terms_1_to_3' : `Term_${term}`;
      const seriesSlug =
        bookType === 'GRADE_UP'
          ? 'CBC_GRADE_UP'
          : bookType === 'MADE_FAMILIAR'
            ? 'SUPER_LIGHT_CBC_COMPILATION'
            : 'SMART_CBC_ALL_SUBJECTS';

      if (format === 'docx') {
        const docxBuf = await generateCbcBookDocxBuffer({
          bookType,
          gradeKey,
          subject,
          term,
        });
        return new NextResponse(new Uint8Array(docxBuf), {
          status: 200,
          headers: {
            'Content-Type':
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'Content-Disposition': `attachment; filename="${seriesSlug}_${cleanGrade}_${cleanSubj}_${termSlug}.docx"`,
            'Cache-Control': 'no-store',
          },
        });
      }

      let pdfBytes: Uint8Array;
      if (bookType === 'GRADE_UP') {
        pdfBytes = await generateCbcGradeUpPdfBuffer({ gradeKey, subject, term });
      } else if (bookType === 'MADE_FAMILIAR') {
        pdfBytes = await generateMadeFamiliarPdfBuffer({ gradeKey, subject, term });
      } else {
        pdfBytes = await generateCompleteCompilationPdfBuffer({ gradeKey, subject, term });
      }

      return new NextResponse(Buffer.from(pdfBytes), {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${seriesSlug}_${cleanGrade}_${cleanSubj}_${termSlug}.pdf"`,
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
