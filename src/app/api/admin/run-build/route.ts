// src/app/api/admin/run-build/route.ts
import { NextResponse } from 'next/server';
import { exec } from 'child_process';

export async function POST() {
  // Trigger a build in a background child process
  exec('npm run build', (error, stdout, stderr) => {
    // Log output for debugging – not returned directly
    if (error) console.error('Build error:', error);
    console.log('Build stdout:', stdout);
    console.error('Build stderr:', stderr);
  });
  return NextResponse.json({ success: true, message: 'Build started' });
}
