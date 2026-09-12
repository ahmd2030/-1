import { NextResponse } from 'next/server';
import { FashnProvider } from '@/lib/ai/fashn';

export const maxDuration = 60;

async function uploadToHost(base64Image: string) {
  const base64Data = base64Image.split(',')[1];
  const uploadFormData = new URLSearchParams();
  uploadFormData.append('key', '6d207e02198a847aa98d0a2a901485a5');
  uploadFormData.append('action', 'upload');
  uploadFormData.append('source', base64Data);
  uploadFormData.append('format', 'json');

  const uploadRes = await fetch('https://freeimage.host/api/1/upload', {
    method: 'POST',
    body: uploadFormData,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  if (!uploadRes.ok) {
    throw new Error('Failed to upload image to temporary host');
  }

  const uploadData = await uploadRes.json();
  return uploadData.image.url;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { garmentImage, modelImage, modelType, style, category, brandName, promoText } = body;

    if (!garmentImage) {
      return NextResponse.json({ error: 'Missing garmentImage' }, { status: 400 });
    }

    const hostedGarmentUrl = await uploadToHost(garmentImage);
    let hostedModelUrl = undefined;

    if (modelImage) {
      hostedModelUrl = await uploadToHost(modelImage);
    }

    const provider = new FashnProvider();
    
    const result = await provider.generate({
      garmentImage: hostedGarmentUrl,
      modelImage: hostedModelUrl,
      category: category || 'tops',
      modelType,
      style,
    });

    return NextResponse.json({
      status: 'success',
      imageUrl: result.imageUrl,
      brandName,
      promoText,
    });
  } catch (error: any) {
    console.error('Base64 Generation Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate image' }, { status: 500 });
  }
}
