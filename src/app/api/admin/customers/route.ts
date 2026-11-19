import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthorized } from '@/lib/admin-auth';
import {
  deleteRegisteredCustomerById,
  getAllRegisteredCustomers,
} from '@/lib/customer-accounts';

export async function GET(req: NextRequest) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const customers = await getAllRegisteredCustomers();
  const todayPrefix = new Date().toISOString().slice(0, 10);
  const todayCount = customers.filter((c) =>
    (c.createdAt || '').startsWith(todayPrefix)
  ).length;

  return NextResponse.json({
    ok: true,
    totalCount: customers.length,
    todayCount,
    customers: customers.map(({ passwordHash: _pw, ...safe }) => {
      void _pw;
      return safe;
    }),
  });
}

export async function DELETE(req: NextRequest) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = (searchParams.get('id') || '').trim();
  if (!id) {
    return NextResponse.json({ error: 'Missing customer id' }, { status: 400 });
  }

  const removed = await deleteRegisteredCustomerById(id);
  return NextResponse.json({ ok: true, removed });
}
