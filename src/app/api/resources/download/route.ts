import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { checkoutRequestId } = await req.json();

    if (!checkoutRequestId) {
      return NextResponse.json({ error: 'checkoutRequestId is required' }, { status: 400 });
    }

    // Check order status
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('status, resource_id')
      .eq('checkout_request_id', checkoutRequestId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.status !== 'COMPLETED') {
      return NextResponse.json({ status: order.status, message: 'Processing' }, { status: 200 });
    }

    // Fetch resource
    const { data: resource, error: resourceError } = await supabaseAdmin
      .from('resources')
      .select('*')
      .eq('id', order.resource_id)
      .single();

    if (resourceError || !resource) {
      return NextResponse.json({ error: 'Resource missing' }, { status: 404 });
    }

    // Deliver file URL: checks file_url, download_url, file_path, or falls back to sample
    const downloadUrl =
      resource.file_url ||
      resource.download_url ||
      resource.file_path ||
      '/sample-scheme.pdf';

    return NextResponse.json({
      status: 'COMPLETED',
      downloadUrl: downloadUrl,
    });
  } catch (err: any) {
    console.error('Download route crash:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}