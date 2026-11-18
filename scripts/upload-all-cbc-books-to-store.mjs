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
const CONCURRENCY = 22;
const FORCE_OVERWRITE = process.argv.includes('--force');
const REBRAND_2_3 = process.argv.includes('--rebrand-2-3');

async function fetchAllDbResources() {
  const all = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from('resources')
      .select('id, file_path, title, price')
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

async function listAllBucketFiles() {
  const names = new Set();
  let offset = 0;
  while (true) {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list('', { limit: 1000, offset });
    if (error) throw error;
    if (!data || data.length === 0) break;
    for (const f of data) names.add(f.name);
    if (data.length < 1000) break;
    offset += 1000;
  }
  return names;
}

async function uploadWithRetry(filename, buffer) {
  for (let attempt = 1; attempt <= 4; attempt++) {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filename, buffer, {
        contentType: 'application/pdf',
        upsert: true,
      });
    if (!error) return true;
    await new Promise((r) => setTimeout(r, 600 * attempt));
  }
  return false;
}

async function generateBookBytesViaLocalApi(bookType, gradeKey, subject, term = 0) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const url = `${LOCAL_BOOKS_API}?action=download&checkoutRequestId=LOCAL_QA_VERIFY_50_PAGES&bookType=${encodeURIComponent(
        bookType
      )}&gradeKey=${encodeURIComponent(gradeKey)}&subject=${encodeURIComponent(
        subject
      )}&term=${term}&format=pdf`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return Buffer.from(await res.arrayBuffer());
    } catch (e) {
      if (attempt === 3) throw e;
      await new Promise((r) => setTimeout(r, 800 * attempt));
    }
  }
}

async function main() {
  // Wait for local dev server readiness
  for (let i = 0; i < 20; i++) {
    try {
      const r = await fetch(`${LOCAL_BOOKS_API}?action=catalog`);
      if (r.ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
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

  const bookDefs = [
    {
      bookType: 'GRADE_UP',
      category: 'CBC GRADE UP (50-Page Books)',
      price: 600, // +20% All Terms Together (Single Term = KSh 500)
      filePrefix: 'BOOK1_CBC_GRADE_UP_50P',
      buildTitle: (gradeLabel, subject) =>
        `${gradeLabel} ${subject} — CBC GRADE UP (All Terms 1-3: Detailed Point-Form Notes + Valid Examples + Q&A + Marking Schemes)`,
    },
    {
      bookType: 'MADE_FAMILIAR',
      category: 'SUPER-LIGHT CBC COMPILATION (50p)',
      price: 900, // +20% All Terms Together (Single Term = KSh 750)
      filePrefix: 'BOOK2_MADE_FAMILIAR_50P',
      buildTitle: (gradeLabel, subject) =>
        `${gradeLabel} ${subject} — SUPER-LIGHT CBC COMPILATION (All Terms 1-3: Detailed Point-Form Notes + Valid Examples + Immediate Q&A)`,
    },
    {
      bookType: 'COMPLETE_BUNDLE',
      category: 'SMART CBC ALL SUBJECTS (100p)',
      price: 1800, // +20% All Terms Together (Single Term = KSh 1,500)
      filePrefix: 'BOOK3_COMPLETE_COMPILATION_100P',
      buildTitle: (gradeLabel, subject) =>
        `${gradeLabel} ${subject} — SMART CBC ALL SUBJECTS (All Terms 1-3: Master Compilation + Valid Examples + Marking Schemes)`,
    },
  ];

  const tasks = [];
  for (const g of gradeEntries) {
    for (const subject of g.subjects) {
      const sylArg = g.gradeKey.startsWith('PP') ? g.gradeKey : g.dbGrade;
      const syl = getSyllabusForGrade(sylArg, subject);
      const code = syl.shortCode;
      const gPrefix = g.gradeKey.startsWith('PP') ? g.gradeKey : `G${g.dbGrade}`;

      for (const bd of bookDefs) {
        const filename = `${gPrefix}_${code}_${bd.filePrefix}.pdf`;
        tasks.push({
          filename,
          bookType: bd.bookType,
          gradeKey: g.gradeKey,
          dbGrade: g.dbGrade,
          level: g.level,
          subject,
          category: bd.category,
          price: bd.price,
          title: bd.buildTitle(g.gradeLabel, subject),
        });
      }
    }
  }

  console.log(`Prepared ${tasks.length} Official 50-Page & 100-Page Books for Admin Store & Supabase!`);

  const existingFiles = FORCE_OVERWRITE ? new Set() : await listAllBucketFiles();
  const toUpload = REBRAND_2_3
    ? tasks.filter((t) => t.bookType !== 'GRADE_UP')
    : FORCE_OVERWRITE
    ? tasks
    : tasks.filter((t) => !existingFiles.has(t.filename));
  console.log(`Uploading ${toUpload.length} book PDF(s) to Supabase Storage (concurrency ${CONCURRENCY})...`);

  let cursor = 0;
  let completed = 0;
  let failed = 0;
  const t0 = Date.now();

  async function worker() {
    while (true) {
      const idx = cursor++;
      if (idx >= toUpload.length) break;
      const item = toUpload[idx];
      try {
        const buf = await generateBookBytesViaLocalApi(
          item.bookType,
          item.gradeKey,
          item.subject
        );
        const ok = await uploadWithRetry(item.filename, buf);
        if (!ok) failed++;
      } catch (err) {
        console.error(`Failed ${item.filename}:`, err.message);
        failed++;
      }
      completed++;
      if (completed % 60 === 0 || completed === toUpload.length) {
        const sec = ((Date.now() - t0) / 1000).toFixed(1);
        console.log(`  Books uploaded: ${completed} / ${toUpload.length} (${sec}s, failed=${failed})`);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  const existingDb = await fetchAllDbResources();
  const dbByFilePath = new Map(existingDb.map((r) => [r.file_path, r]));

  const toInsert = [];
  const toUpdate = [];
  for (const t of tasks) {
    const existingRow = dbByFilePath.get(t.filename);
    if (!existingRow) {
      toInsert.push({
        title: t.title,
        grade: t.dbGrade,
        level: t.level,
        category: t.category,
        subject: t.subject,
        term: 0,
        format: 'PDF',
        price: t.price,
        file_path: t.filename,
      });
    } else if (existingRow.title !== t.title || existingRow.price !== t.price) {
      toUpdate.push({
        id: existingRow.id,
        title: t.title,
        category: t.category,
        price: t.price,
      });
    }
  }

  if (toUpdate.length > 0) {
    console.log(`Updating ${toUpdate.length} rebranded book rows in Supabase "resources" table...`);
    let uIdx = 0;
    async function updWorker() {
      while (true) {
        const i = uIdx++;
        if (i >= toUpdate.length) break;
        const row = toUpdate[i];
        await supabase
          .from('resources')
          .update({ title: row.title, category: row.category, price: row.price })
          .eq('id', row.id);
      }
    }
    await Promise.all(Array.from({ length: 20 }, () => updWorker()));
  }

  if (toInsert.length > 0) {
    console.log(`Inserting ${toInsert.length} book rows into Supabase "resources" table...`);
    for (let i = 0; i < toInsert.length; i += 150) {
      const chunk = toInsert.slice(i, i + 150);
      const { error } = await supabase.from('resources').insert(chunk);
      if (error) throw new Error(`Insert error at ${i}: ${error.message}`);
    }
  }

  const finalDb = await fetchAllDbResources();
  console.log(
    `\nBOOKS ADMIN STORE SYNC COMPLETE! Uploaded ${completed - failed}/${toUpload.length} book PDFs (failed=${failed}). Total live items in Admin Store ("resources" table): ${finalDb.length}`
  );
}

main().catch((err) => {
  console.error('Fatal books upload error:', err);
  process.exit(1);
});
