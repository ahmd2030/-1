import { NextResponse } from 'next/server';
import { aiRouter } from '@/lib/ai/router';
import { AIGenerationOptions } from '@/lib/ai/provider';

export const maxDuration = 60; // Allow up to 60 seconds for FASHN API to finish

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const category = formData.get('category') as string;
    const modelType = formData.get('modelType') as string;

    if (!file || !category || !modelType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Convert File to Base64
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64String = buffer.toString('base64');

    // Upload to FreeImage.host (Reliable, no CORS issues, fast)
    const uploadFormData = new URLSearchParams();
    uploadFormData.append('key', '6d207e02198a847aa98d0a2a901485a5');
    uploadFormData.append('action', 'upload');
    uploadFormData.append('source', base64String);
    uploadFormData.append('format', 'json');

    const uploadRes = await fetch('https://freeimage.host/api/1/upload', {
      method: 'POST',
      body: uploadFormData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (!uploadRes.ok) {
      console.error("FreeImage Host error:", await uploadRes.text());
      return NextResponse.json({ error: 'فشل رفع الصورة للخادم الوسيط' }, { status: 500 });
    }

    const uploadData = await uploadRes.json();
    const finalImageUrl = uploadData.image.url;

    console.log("Hosted Image URL:", finalImageUrl);

    // Process via AI Router
    const body: AIGenerationOptions = {
      garmentImage: finalImageUrl,
      category,
      modelType,
    };
    const result = await aiRouter.generateImage(body);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Generation API Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate image' }, { status: 500 });
  }
}
