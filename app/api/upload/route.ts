import { NextResponse } from 'next';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64String = buffer.toString('base64');

    const uploadFormData = new URLSearchParams();
    uploadFormData.append('key', '6d207e02198a847aa98d0a2a901485a5');
    uploadFormData.append('action', 'upload');
    uploadFormData.append('source', base64String);
    uploadFormData.append('format', 'json');

    const uploadRes = await fetch('https://freeimage.host/api/1/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: uploadFormData,
    });

    if (!uploadRes.ok) {
      const errorText = await uploadRes.text();
      throw new Error(`Upload failed: ${errorText}`);
    }

    const data = await uploadRes.json();
    return NextResponse.json({ url: data.image.url });
  } catch (error: any) {
    console.error('Upload Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
