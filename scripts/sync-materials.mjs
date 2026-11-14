import fs from 'node:fs/promises';
import path from 'node:path';
import mammoth from 'mammoth';
import { createClient } from '@supabase/supabase-js';

const BUCKET_NAME = 'cbc-materials';

const DEFAULT_PRICES = {
  'Schemes of Work': 50,
  'Lesson Plans': 70,
  "Teachers' Notes": 100,
  'Revision Papers & Exams': 100,
};

function getLevelForGrade(grade) {
  if (grade <= 3) return 'Lower Primary';
  if (grade <= 6) return 'Upper Primary';
  if (grade <= 9) return 'Junior Secondary';
  return 'Senior School';
}

const KNOWN_SUBJECTS = [
  'Agriculture & Nutrition',
  'Creative Arts & Sports',
  'Science & Technology',
  'Integrated Science',
  'Pre-Technical Studies',
  'Christian Religious Education',
  'Islamic Religious Education',
  'Social Studies',
  'Environmental Activities',
  'English Literature',
  'Computer Studies',
  'Business Studies',
  'Home Science',
  'Mathematics',
  'Kiswahili',
  'English',
  'Biology',
  'Chemistry',
  'Physics',
  'Geography',
  'History',
  'Agriculture',
  'Creative Arts',
  'Science',
];

function parseFilename(filename) {
  const extMatch = filename.match(/\.([^.]+)$/);
  const ext = (extMatch ? extMatch[1] : 'docx').toLowerCase();
  const format = ext === 'pdf' ? 'PDF' : 'DOCX';

  const clean = filename
    .replace(/\.[^.]+$/, '')
    .replace(/www\.[a-z0-9.-]+/gi, '')
    .replace(/teacher\.co_?\.ke_?/gi, '')
    .replace(/schemes\.co\.ke/gi, '')
    .replace(/SCH\d+/gi, '')
    .replace(/202[3-9]/g, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  let grade = 7;
  const gradeMatch = clean.match(/\bgrade\s*(\d{1,2})\b/i);
  const formMatch = clean.match(/\bform\s*([1-4])\b/i);
  if (gradeMatch) {
    grade = Math.min(12, Math.max(1, parseInt(gradeMatch[1], 10)));
  } else if (formMatch) {
    grade = 8 + parseInt(formMatch[1], 10);
  } else if (/\bkpsea\b/i.test(clean)) {
    grade = 6;
  } else if (/\bkjsea\b/i.test(clean)) {
    grade = 9;
  } else if (/\bkcse\b/i.test(clean)) {
    grade = 12;
  }

  let term = 1;
  const termMatch = clean.match(/\bterm\s*([1-3])\b/i);
  if (termMatch) {
    term = parseInt(termMatch[1], 10);
  }

  let category = 'Schemes of Work';
  if (/\blesson\s*plan/i.test(clean)) {
    category = 'Lesson Plans';
  } else if (/\b(exam|mock|kpsea|kjsea|kcse|revision|assessment|test|prediction|trial|west)\b/i.test(clean)) {
    category = 'Revision Papers & Exams';
  } else if (/\b(note|notes|booklet|strand)\b/i.test(clean)) {
    category = "Teachers' Notes";
  } else if (/\bscheme/i.test(clean)) {
    category = 'Schemes of Work';
  }

  let subject = 'General CBC';
  const normalizedForSubj = clean
    .replace(/\band\b/gi, '&')
    .replace(/agriculture\s+nutrition/i, 'Agriculture & Nutrition')
    .replace(/creative\s+arts\s*&?\s*sports/i, 'Creative Arts & Sports')
    .replace(/science\s*&?\s*technology/i, 'Science & Technology')
    .replace(/pre\s+technical\s+studies/i, 'Pre-Technical Studies');

  for (const candidate of KNOWN_SUBJECTS) {
    const pattern = new RegExp(`\\b${candidate.replace('&', '(?:&|and)')}\\b`, 'i');
    if (pattern.test(normalizedForSubj)) {
      subject = candidate === 'Science' && grade >= 7 ? 'Integrated Science' : candidate;
      break;
    }
  }
  if (subject === 'General CBC' && /\bmath/i.test(clean)) {
    subject = 'Mathematics';
  }

  const titleWords = clean
    .split(' ')
    .filter(Boolean)
    .map((w) => {
      const upper = w.toUpperCase();
      if (['CBC', 'KPSEA', 'KJSEA', 'KCSE', 'JSS', 'CRE', 'IRE', 'STEM', 'II', 'III'].includes(upper)) {
        return upper;
      }
      if (['and', 'of', 'in', 'to', 'for'].includes(w.toLowerCase())) {
        return w.toLowerCase();
      }
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    });

  let title = titleWords.join(' ');
  if (title.length > 0) {
    title = title.charAt(0).toUpperCase() + title.slice(1);
  }
  if (!title.toLowerCase().includes('grade')) {
    title = `Grade ${grade} ${title}`;
  }

  const level = getLevelForGrade(grade);
  const price = DEFAULT_PRICES[category] || 50;

  return { title, grade, level, category, subject, term, format, price };
}

async function extractDocxExcerpt(buffer) {
  try {
    const res = await mammoth.extractRawText({ buffer });
    const cleaned = res.value.replace(/\r/g, '').replace(/\n{3,}/g, '\n\n').trim();
    if (cleaned.length > 0) {
      return (
        cleaned.slice(0, 650) +
        (cleaned.length > 650 ? '\n\n[... Purchase via M-Pesa to unlock full document ...]' : '')
      );
    }
  } catch {
    // ignore
  }
  return undefined;
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Optional custom directory flag: node scripts/sync-materials.mjs --dir "C:\path\to\folder"
  const dirArgIdx = process.argv.indexOf('--dir');
  const inboxDir =
    dirArgIdx !== -1 && process.argv[dirArgIdx + 1]
      ? path.resolve(process.argv[dirArgIdx + 1])
      : path.resolve(process.cwd(), 'materials-inbox');

  await fs.mkdir(inboxDir, { recursive: true });
  const localMetaDir = path.join(inboxDir, '_meta');

  // 1. Upload all local files from inboxDir to Supabase Storage
  const entries = await fs.readdir(inboxDir, { withFileTypes: true });
  const docFiles = entries.filter(
    (e) => e.isFile() && /\.(docx|doc|pdf)$/i.test(e.name)
  );

  console.log(`Found ${docFiles.length} local document(s) in ${inboxDir}...`);

  const localMetaByFilename = new Map();

  for (const entry of docFiles) {
    const filePath = path.join(inboxDir, entry.name);
    const buffer = await fs.readFile(filePath);
    const ext = entry.name.split('.').pop().toLowerCase();
    const contentType =
      ext === 'pdf'
        ? 'application/pdf'
        : ext === 'doc'
        ? 'application/msword'
        : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    const { error: upErr } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(entry.name, buffer, { contentType, upsert: true });

    if (upErr) {
      console.error(`  [!] Failed uploading ${entry.name}: ${upErr.message}`);
      continue;
    }

    // Check for companion _meta/<filename>.json
    let customMeta = {};
    try {
      const rawMeta = await fs.readFile(path.join(localMetaDir, `${entry.name}.json`), 'utf8');
      customMeta = JSON.parse(rawMeta);
      localMetaByFilename.set(entry.name, customMeta);
    } catch {
      // no local meta file
    }

    let sampleExcerpt = customMeta.sampleExcerpt;
    if (!sampleExcerpt && ext === 'docx') {
      sampleExcerpt = await extractDocxExcerpt(buffer);
    }

    const storageMetaPayload = {
      description: customMeta.description,
      strands: customMeta.strands,
      pageCount: customMeta.pageCount,
      fileSizeKb: Math.max(1, Math.round(buffer.byteLength / 1024)),
      sampleExcerpt,
      updatedAt: new Date().toISOString(),
    };

    await supabase.storage
      .from(BUCKET_NAME)
      .upload(`_meta/${entry.name}.json`, Buffer.from(JSON.stringify(storageMetaPayload, null, 2)), {
        contentType: 'application/json',
        upsert: true,
      });

    console.log(`  [+] Uploaded to cbc-materials: ${entry.name}`);
  }

  // 2. List all real files currently inside Supabase cbc-materials bucket
  const { data: bucketFiles, error: listErr } = await supabase.storage
    .from(BUCKET_NAME)
    .list('', { limit: 500 });

  if (listErr) throw listErr;

  const realStorageFiles = (bucketFiles || []).filter(
    (f) => f.name !== '_meta' && f.name !== '.emptyFolderPlaceholder' && /\.(docx|doc|pdf)$/i.test(f.name)
  );
  const realFileSet = new Set(realStorageFiles.map((f) => f.name));

  // 3. Inspect existing DB rows & remove broken placeholder rows whose file_path isn't in Storage
  const { data: existingRows, error: dbErr } = await supabase.from('resources').select('*');
  if (dbErr) throw dbErr;

  const rowsByFilePath = new Map();
  for (const row of existingRows || []) {
    if (!row.file_path || !realFileSet.has(row.file_path)) {
      console.log(`  [-] Removing unlinked placeholder row: "${row.title}" (${row.file_path})`);
      await supabase.from('resources').delete().eq('id', row.id);
    } else {
      rowsByFilePath.set(row.file_path, row);
    }
  }

  // 4. Ensure every real storage file has an accurate row in `resources` (and _meta if missing)
  let syncedCount = 0;
  for (const fileObj of realStorageFiles) {
    const filename = fileObj.name;
    const parsed = parseFilename(filename);
    const customMeta = localMetaByFilename.get(filename) || {};

    const payload = {
      title: customMeta.title || parsed.title,
      grade: customMeta.grade || parsed.grade,
      level: customMeta.level || parsed.level,
      category: customMeta.category || parsed.category,
      subject: customMeta.subject || parsed.subject,
      term: customMeta.term || parsed.term,
      format: parsed.format,
      price: customMeta.price || parsed.price,
      file_path: filename,
    };

    const existing = rowsByFilePath.get(filename);
    if (existing) {
      const { error } = await supabase.from('resources').update(payload).eq('id', existing.id);
      if (error) console.error(`  [!] Update failed for ${filename}:`, error.message);
      else syncedCount++;
    } else {
      const { error } = await supabase.from('resources').insert(payload);
      if (error) console.error(`  [!] Insert failed for ${filename}:`, error.message);
      else {
        console.log(`  [*] Linked storage file to catalog: "${payload.title}" (KES ${payload.price})`);
        syncedCount++;
      }
    }
  }

  console.log(`\nSync complete! ${syncedCount} real curriculum materials are now live in Supabase.`);
}

main().catch((err) => {
  console.error('Sync failed:', err);
  process.exit(1);
});
