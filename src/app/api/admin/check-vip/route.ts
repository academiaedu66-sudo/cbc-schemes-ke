// src/app/api/admin/check-vip/route.ts
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_PRODUCTION_URL || 'http://localhost:3000'}/api/vip/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId: 'test-user',
        period: 'annual',
        phoneNumber: '254712345678',
      }),
    });
    const data = await res.json();
    return NextResponse.json({ success: true, vipResponse: data });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Error checking VIP endpoint' }, { status: 500 });
  }
}
