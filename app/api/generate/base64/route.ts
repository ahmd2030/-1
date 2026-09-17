import { NextResponse } from 'next/server';
import { FashnProvider } from '@/lib/ai/fashn';
import { fal } from '@fal-ai/client';

export const maxDuration = 60;

async function uploadToFal(base64Image: string): Promise<string> {
  const parts = base64Image.split(';');
  let mime = 'image/jpeg';
  let b64Data = base64Image;
  
  if (parts.length > 1 && parts[0].startsWith('data:')) {
    mime = parts[0].split(':')[1];
    b64Data = parts[1].split(',')[1];
  } else if (base64Image.includes(',')) {
    b64Data = base64Image.split(',')[1];
  }
  
  const buffer = Buffer.from(b64Data, 'base64');
  const blob = new Blob([buffer], { type: mime });
  
  // Create a file-like object required by fal client
  const file = new File([blob], `image-${Date.now()}.${mime.split('/')[1] || 'jpg'}`, { type: mime });
  
  const url = await fal.storage.upload(file);
  return url;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { garmentImage, modelImage, modelType, style, category, brandName, promoText } = body;

    if (!garmentImage) {
      return NextResponse.json({ error: 'Missing garmentImage' }, { status: 400 });
    }

    // Fashn API silently crashes or hangs on 10MB base64 payloads. 
    // We must upload to a CDN first and pass the URL.
    const hostedGarmentUrl = await uploadToFal(garmentImage);
    let hostedModelUrl = undefined;

    if (modelImage) {
      hostedModelUrl = await uploadToFal(modelImage);
    }

    const provider = new FashnProvider();
    
    const result = await provider.generate({
      garmentImage: hostedGarmentUrl,
      modelImage: hostedModelUrl,
      category: category || 'tops',
      modelType,
      style,
      returnIdOnly: true
    });

    return NextResponse.json({
      id: result.id,
      provider: 'fashn',
      status: 'processing'
    });

  } catch (error: any) {
    console.error('Base64 Generation Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate image' }, { status: 500 });
  }
}
