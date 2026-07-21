import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ circuit: string }> }
) {
  const { circuit } = await params;
  
  // Strip any contract prefix (e.g. "ghost#spend" -> "spend")
  const filename = decodeURIComponent(circuit).replace(/^.*#/, '');
  
  const keysDir = path.join(process.cwd(), 'public');
  const filePath = path.join(keysDir, filename);
  
  if (!fs.existsSync(filePath)) {
    return new NextResponse(`ZKIR file not found: ${filename}`, { status: 404 });
  }
  
  const fileBuffer = fs.readFileSync(filePath);
  
  return new NextResponse(fileBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/octet-stream',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
