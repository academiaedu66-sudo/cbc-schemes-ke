import { NextRequest, NextResponse } from 'next/server';
import mammoth from 'mammoth';
import { supabaseAdmin } from '@/lib/supabase';
import { triggerAutomaticBackup } from '@/lib/security';
import { getLevelForGrade, normalizeCategory } from '@/lib/material-utils';
import { isAdminAuthorized } from '@/lib/admin-auth';

const BUCKET_NAME = 'cbc-materials';

function isAuthorized(req: NextRequest): boolean {
  return isAdminAuthorized(req);
}

function sanitizeStorageFilename(name: string): string {
  return name
    .trim()
    .replace(/[^a-zA-Z0-9._ -]/g, '')
    .replace(/\s+/g, '-');
}

async function fetchAllResourcesAdmin() {
  const all = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabaseAdmin
      .from('resources')
      .select('*')
      .order('grade', { ascending: true })
      .order('term', { ascending: true })
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

async function fetchAllStorageNames() {
  const names = new Set<string>();
  let offset = 0;
  while (true) {
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .list('', { limit: 1000, offset });
    if (error) throw error;
    if (!data || data.length === 0) break;
    for (const f of data) {
      if (f.name !== '_meta' && f.name !== '.emptyFolderPlaceholder') {
        names.add(f.name);
      }
    }
    if (data.length < 1000) break;
    offset += 1000;
  }
  return names;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Invalid admin password' }, { status: 401 });
  }

  try {
    const downloadId = req.nextUrl.searchParams.get('downloadId');
    if (downloadId) {
      const { data: resItem, error: itemErr } = await supabaseAdmin
        .from('resources')
        .select('file_path, title')
        .eq('id', downloadId)
        .single();
      if (itemErr || !resItem?.file_path) {
        return NextResponse.json({ error: 'File not found' }, { status: 404 });
      }
      const { data: signed, error: sErr } = await supabaseAdmin.storage
        .from(BUCKET_NAME)
        .createSignedUrl(resItem.file_path, 3600, { download: true });
      if (sErr || !signed?.signedUrl) {
        return NextResponse.json({ error: sErr?.message || 'Could not sign URL' }, { status: 500 });
      }
      return NextResponse.json({ downloadUrl: signed.signedUrl });
    }

    const [resources, storageSet] = await Promise.all([
      fetchAllResourcesAdmin(),
      fetchAllStorageNames(),
    ]);

    const enriched = resources.map((r) => ({
      ...r,
      hasStorageFile: Boolean(r.file_path && storageSet.has(r.file_path)),
    }));

    return NextResponse.json({
      resources: enriched,
      storageFilesCount: storageSet.size,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch admin resources';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Invalid admin password' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'A .docx, .doc, or .pdf file is required' }, { status: 400 });
    }

    const storageFilename = sanitizeStorageFilename(file.name);
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const title = String(formData.get('title') || file.name).trim();
    const grade = Math.min(12, Math.max(1, Number(formData.get('grade') || 7)));
    const level = String(formData.get('level') || getLevelForGrade(grade)).trim();
    const category = normalizeCategory(String(formData.get('category') || 'Schemes of Work'));
    const subject = String(formData.get('subject') || 'Mathematics').trim();
    const rawTerm = Number(formData.get('term') ?? 1);
    const term = Math.min(3, Math.max(0, Number.isNaN(rawTerm) ? 1 : rawTerm));
    const ext = storageFilename.split('.').pop()?.toLowerCase() || 'docx';
    const format = ext === 'pdf' ? 'PDF' : 'DOCX';
    const price = Math.max(1, Number(formData.get('price') || 50));

    const description = String(formData.get('description') || '').trim();
    const strandsRaw = String(formData.get('strands') || '').trim();
    const strands = strandsRaw
      ? strandsRaw
          .split(/\r?\n|,/)
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
    let sampleExcerpt = String(formData.get('sampleExcerpt') || '').trim();

    const contentType =
      file.type ||
      (ext === 'pdf'
        ? 'application/pdf'
        : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');

    const { error: uploadErr } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(storageFilename, buffer, {
        contentType,
        upsert: true,
      });

    if (uploadErr) {
      throw new Error(`Storage upload failed: ${uploadErr.message}`);
    }

    if (description || strands.length > 0 || sampleExcerpt) {
      if (!sampleExcerpt && ext === 'docx') {
        try {
          const extracted = await mammoth.extractRawText({ buffer });
          const cleaned = extracted.value.replace(/\r/g, '').replace(/\n{3,}/g, '\n\n').trim();
          if (cleaned) {
            sampleExcerpt =
              cleaned.slice(0, 650) +
              (cleaned.length > 650 ? '\n\n[... Purchase via M-Pesa to unlock full document ...]' : '');
          }
        } catch {
          // ignore
        }
      }

      await supabaseAdmin.storage
        .from(BUCKET_NAME)
        .upload(
          `_meta/${storageFilename}.json`,
          Buffer.from(
            JSON.stringify(
              {
                description: description || undefined,
                strands: strands.length > 0 ? strands : undefined,
                fileSizeKb: Math.max(1, Math.round(buffer.byteLength / 1024)),
                sampleExcerpt: sampleExcerpt || undefined,
                updatedAt: new Date().toISOString(),
              },
              null,
              2
            )
          ),
          { contentType: 'application/json', upsert: true }
        );
    }

    const { data: existing } = await supabaseAdmin
      .from('resources')
      .select('id')
      .eq('file_path', storageFilename)
      .maybeSingle();

    const rowData = {
      title,
      grade,
      level,
      category,
      subject,
      term,
      format,
      price,
      file_path: storageFilename,
    };

    let savedResource;
    if (existing?.id) {
      const { data, error } = await supabaseAdmin
        .from('resources')
        .update(rowData)
        .eq('id', existing.id)
        .select('*')
        .single();
      if (error) throw error;
      savedResource = data;
    } else {
      const { data, error } = await supabaseAdmin
        .from('resources')
        .insert(rowData)
        .select('*')
        .single();
      if (error) throw error;
      savedResource = data;
    }

    void triggerAutomaticBackup(`Uploaded material: ${title}`);

    return NextResponse.json({
      message: 'Material uploaded and published!',
      resource: savedResource,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Upload failed';
    console.error('Admin upload error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Invalid admin password' }, { status: 401 });
  }

  try {
    const id = req.nextUrl.searchParams.get('id');
    const deleteFile = req.nextUrl.searchParams.get('deleteFile') === 'true';

    if (!id) {
      return NextResponse.json({ error: 'Resource id is required' }, { status: 400 });
    }

    const { data: resource } = await supabaseAdmin
      .from('resources')
      .select('file_path')
      .eq('id', id)
      .maybeSingle();

    const { error: delErr } = await supabaseAdmin.from('resources').delete().eq('id', id);
    if (delErr) throw delErr;

    if (deleteFile && resource?.file_path) {
      await supabaseAdmin.storage
        .from(BUCKET_NAME)
        .remove([resource.file_path, `_meta/${resource.file_path}.json`]);
    }

    void triggerAutomaticBackup(`Deleted material ID ${id}`);

    return NextResponse.json({ message: 'Material deleted' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Delete failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
