import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isAdminAuthorized } from '@/lib/admin-auth';
import { triggerAutomaticBackup } from '@/lib/security';

const BUCKET_NAME = 'cbc-materials';

export async function GET(req: NextRequest) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: 'Invalid admin password' }, { status: 401 });
  }

  try {
    const signedForResourceId = req.nextUrl.searchParams.get('signedResourceId');
    if (signedForResourceId) {
      const { data: resource } = await supabaseAdmin
        .from('resources')
        .select('id, title, file_path')
        .eq('id', signedForResourceId)
        .single();

      if (!resource?.file_path) {
        return NextResponse.json({ error: 'Resource file not found' }, { status: 404 });
      }

      const { data: signed, error: signErr } = await supabaseAdmin.storage
        .from(BUCKET_NAME)
        .createSignedUrl(resource.file_path, 24 * 3600, { download: true });

      if (signErr || !signed?.signedUrl) {
        return NextResponse.json({ error: signErr?.message || 'Could not sign link' }, { status: 500 });
      }

      return NextResponse.json({ downloadUrl: signed.signedUrl, title: resource.title });
    }

    const { data: orders, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) throw error;

    const resourceIds = Array.from(
      new Set((orders || []).map((o) => o.resource_id).filter(Boolean))
    );

    const titleById = new Map<string, string>();
    if (resourceIds.length > 0) {
      const { data: resRows } = await supabaseAdmin
        .from('resources')
        .select('id, title')
        .in('id', resourceIds);
      for (const r of resRows || []) {
        titleById.set(r.id, r.title);
      }
    }

    const enriched = (orders || []).map((o) => {
      let fallbackTitle = o.resource_title || 'CBC Material';
      if (!o.resource_id && !o.resource_title) {
        if (Number(o.amount) === 1000) {
          fallbackTitle = 'Learner Holiday / Personal Teacher Booking (KSh 1,000)';
        } else if (Number(o.amount) === 500) {
          fallbackTitle = 'Teacher Holiday / Personal Tuition Registration (KSh 500)';
        } else if (Number(o.amount) === 20) {
          fallbackTitle = 'Gemini Weekly Q&A Pass — 7 Days (KSh 20 Bob)';
        } else if (Number(o.amount) === 10) {
          fallbackTitle = 'CBC Subject Gaming 20-Minute Pass (KSh 10)';
        }
      }
      return {
        ...o,
        resource_title: o.resource_id
          ? titleById.get(o.resource_id) || 'CBC Material'
          : fallbackTitle,
      };
    });

    return NextResponse.json({ orders: enriched });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to load orders';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: 'Invalid admin password' }, { status: 401 });
  }

  try {
    const { id, status } = await req.json();
    if (!id || !['COMPLETED', 'FAILED'].includes(status)) {
      return NextResponse.json({ error: 'Valid order id and status required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
    void triggerAutomaticBackup(`Order ${id} marked ${status}`);
    return NextResponse.json({ message: `Order marked ${status}` });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update order';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
