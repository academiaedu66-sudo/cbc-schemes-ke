// src/app/api/admin/start-dev/route.ts
import { NextResponse } from 'next/server';
import { exec } from 'child_process';

export async function POST() {
  exec('npm run dev', (error, stdout, stderr) => {
    if (error) console.error('Dev server error:', error);
    console.log('Dev stdout:', stdout);
    console.error('Dev stderr:', stderr);
  });
  return NextResponse.json({ success: true, message: 'Dev server start triggered' });
}
