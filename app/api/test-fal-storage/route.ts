import { NextResponse } from 'next/server';
import { fal } from '@fal-ai/client';

export async function GET(request: Request) {
  try {
    const b64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
    const parts = b64.split(';');
    const mime = parts[0].split(':')[1];
    const b64Data = parts[1].split(',')[1];
    const buffer = Buffer.from(b64Data, 'base64');
    const blob = new Blob([buffer], { type: mime });
    const file = new File([blob], 'test.png', { type: mime });
    
    const url = await fal.storage.upload(file);
    return NextResponse.json({ url });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || String(e) }, { status: 500 });
  }
}
