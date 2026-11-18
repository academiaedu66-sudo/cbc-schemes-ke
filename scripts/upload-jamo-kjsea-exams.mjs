import { createClient } from '@supabase/supabase-js';
import {
  GRADES_CURRICULUM_PLAN,
  PREPRIMARY_CURRICULUM_PLAN,
  getSyllabusForGrade,
} from './cbc-syllabus-data.mjs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const BUCKET_NAME = 'cbc-materials';
const LOCAL_BOOKS_API = 'http://localhost:3000/api/books';
const TARGET_CATEGORY = 'NATIONAL KJSEA EXAMINATION (ALL GRADES)';
const CONCURRENCY = 20;

async function fetchAllDbResources() {
  const all = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from('resources')
      .select('id, file_path, title, price, category')
      .order('id', { ascending: true })
      .range(from, from + 999);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < 1000) break;
    from += 1000;
  }
  return all;
}

async function uploadPdfWithRetry(filename, buffer) {
  for (let attempt = 1; attempt <= 4; attempt++) {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filename, buffer, {
        contentType: 'application/pdf',
        upsert: true,
      });
    if (!error) return true;
    await new Promise((r) => setTimeout(r, 500 * attempt));
  }
  return false;
}

async function fetchExamPdfViaLocalApi(gradeKey, subject, mode) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const url = `${LOCAL_BOOKS_API}?action=jamo_kjsea_download&gradeKey=${encodeURIComponent(
        gradeKey
      )}&subject=${encodeURIComponent(subject)}&mode=${encodeURIComponent(
        mode
      )}&format=pdf`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return Buffer.from(await res.arrayBuffer());
    } catch (e) {
      if (attempt === 3) throw e;
      await new Promise((r) => setTimeout(r, 700 * attempt));
    }
  }
}

async function main() {
  console.log('1. Running strict 210-subject QA check on KENYA NATIONAL KJSEA TEST...');
  for (let i = 0; i < 20; i++) {
    try {
      const r = await fetch(`${LOCAL_BOOKS_API}?action=catalog`);
      if (r.ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }

  const qaRes = await fetch(`${LOCAL_BOOKS_API}?action=verify_jamo_kjsea`);
  if (!qaRes.ok) {
    throw new Error(`QA endpoint failed: ${qaRes.status} ${await qaRes.text()}`);
  }
  const qa = await qaRes.json();
  console.log('QA AUDIT:', JSON.stringify(qa, null, 2));
  if (
    qa.missingStrands > 0 ||
    qa.duplicateQuestions > 0 ||
    qa.englishLeakInKiswahili > 0
  ) {
    throw new Error('Strict QA violation in KENYA NATIONAL KJSEA TEST!');
  }

  const gradeEntries = [
    ...PREPRIMARY_CURRICULUM_PLAN.map((p) => ({
      gradeKey: p.gradeCode,
      gradeLabel: p.gradeCode,
      dbGrade: p.dbGrade,
      level: p.level,
      subjects: p.subjects,
    })),
    ...GRADES_CURRICULUM_PLAN.map((p) => ({
      gradeKey: String(p.grade),
      gradeLabel: `Grade ${p.grade}`,
      dbGrade: p.grade,
      level: p.level,
      subjects: p.subjects,
    })),
  ];

  const tasks = [];
  for (const g of gradeEntries) {
    for (const subject of g.subjects) {
      const sylArg = g.gradeKey.startsWith('PP') ? g.gradeKey : g.dbGrade;
      const syl = getSyllabusForGrade(sylArg, subject);
      const code = syl.shortCode;
      const gPrefix = g.gradeKey.startsWith('PP') ? g.gradeKey : `G${g.dbGrade}`;
      const isKis =
        subject.toLowerCase().includes('kiswahili') ||
        subject.toLowerCase().includes('fasihi');

      // 1. Question Paper ONLY (KSh 50) — reuses existing file_path so zero orphan rows remain
      const paperFilename = `${gPrefix}_${code}_JAMO_KENYATTA_KJSEA_EXAM_20Q.pdf`;
      const paperTitle = isKis
        ? `${g.gradeLabel} ${subject} — KENYA NATIONAL KJSEA TEST (Karatasi ya Maswali • Maswali 20 • Muda: Saa 2)`
        : `${g.gradeLabel} ${subject} — KENYA NATIONAL KJSEA TEST (Question Paper • 20 Questions • 2 Hours • KNEC Cover)`;

      tasks.push({
        filename: paperFilename,
        mode: 'PAPER',
        gradeKey: g.gradeKey,
        dbGrade: g.dbGrade,
        level: g.level,
        subject,
        title: paperTitle,
        price: 50,
      });

      // 2. Official Marking Scheme ONLY (KSh 50)
      const msFilename = `${gPrefix}_${code}_KENYA_NATIONAL_KJSEA_MARKING_SCHEME_20Q.pdf`;
      const msTitle = isKis
        ? `${g.gradeLabel} ${subject} — KENYA NATIONAL KJSEA TEST — MWONGOZO WA KUSAHIHISHA (Majibu ya Maswali 1–20 • Alama 100)`
        : `${g.gradeLabel} ${subject} — KENYA NATIONAL KJSEA TEST — MARKING SCHEME (Official Answers Q1–Q20 • 100 Marks)`;

      tasks.push({
        filename: msFilename,
        mode: 'MARKING_SCHEME',
        gradeKey: g.gradeKey,
        dbGrade: g.dbGrade,
        level: g.level,
        subject,
        title: msTitle,
        price: 50,
      });
    }
  }

  console.log(
    `2. Generating & uploading ${tasks.length} PDFs (210 Question Papers @ KSh 50 + 210 Marking Schemes @ KSh 50, concurrency ${CONCURRENCY})...`
  );
  let cursor = 0;
  let completed = 0;
  let failed = 0;
  const t0 = Date.now();

  async function worker() {
    while (true) {
      const idx = cursor++;
      if (idx >= tasks.length) break;
      const item = tasks[idx];
      try {
        const buf = await fetchExamPdfViaLocalApi(
          item.gradeKey,
          item.subject,
          item.mode
        );
        const ok = await uploadPdfWithRetry(item.filename, buf);
        if (!ok) failed++;
      } catch (err) {
        console.error(`Failed ${item.filename}:`, err.message);
        failed++;
      }
      completed++;
      if (completed % 60 === 0 || completed === tasks.length) {
        const sec = ((Date.now() - t0) / 1000).toFixed(1);
        console.log(
          `  Uploaded: ${completed} / ${tasks.length} (${sec}s, failed=${failed})`
        );
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  const existingDb = await fetchAllDbResources();
  const dbByFilePath = new Map(existingDb.map((r) => [r.file_path, r]));

  const toInsert = [];
  const toUpdate = [];
  for (const t of tasks) {
    const existing = dbByFilePath.get(t.filename);
    if (!existing) {
      toInsert.push({
        title: t.title,
        grade: t.dbGrade,
        level: t.level,
        category: TARGET_CATEGORY,
        subject: t.subject,
        term: 0,
        format: 'PDF',
        price: t.price,
        file_path: t.filename,
      });
    } else if (
      existing.title !== t.title ||
      existing.price !== t.price ||
      existing.category !== TARGET_CATEGORY
    ) {
      toUpdate.push({
        id: existing.id,
        title: t.title,
        price: t.price,
        category: TARGET_CATEGORY,
      });
    }
  }

  if (toInsert.length > 0) {
    console.log(
      `Inserting ${toInsert.length} Marking Scheme / Exam rows into Supabase (${TARGET_CATEGORY})...`
    );
    for (let i = 0; i < toInsert.length; i += 150) {
      const chunk = toInsert.slice(i, i + 150);
      const { error } = await supabase.from('resources').insert(chunk);
      if (error) throw new Error(`Insert error: ${error.message}`);
    }
  }

  if (toUpdate.length > 0) {
    console.log(`Updating ${toUpdate.length} existing Exam rows to KSh 50 & ${TARGET_CATEGORY}...`);
    for (let i = 0; i < toUpdate.length; i += 25) {
      const batch = toUpdate.slice(i, i + 25);
      await Promise.all(
        batch.map((row) =>
          supabase
            .from('resources')
            .update({
              title: row.title,
              price: row.price,
              category: row.category,
            })
            .eq('id', row.id)
        )
      );
    }
  }

  const finalDb = await fetchAllDbResources();
  const kjseaCount = finalDb.filter((r) => r.category === TARGET_CATEGORY).length;
  console.log(
    `\nNATIONAL KJSEA EXAMINATION SYNC COMPLETE! Uploaded ${
      completed - failed
    }/${tasks.length} PDFs (failed=${failed}). Category "${TARGET_CATEGORY}" items: ${kjseaCount}. Total live items in Admin Store: ${finalDb.length}`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
