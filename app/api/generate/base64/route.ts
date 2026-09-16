import { NextResponse } from 'next/server';
import { ReplicateProvider } from '@/lib/ai/replicate';

export const maxDuration = 60;

async function uploadToHost(base64Image: string) {
  const base64Data = base64Image.split(',')[1];
  const uploadFormData = new URLSearchParams();
  uploadFormData.append('key', '6d207e02198a847aa98d0a2a901485a5');
  uploadFormData.append('action', 'upload');
  uploadFormData.append('source', base64Data);
  uploadFormData.append('format', 'json');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); 

  try {
    const uploadRes = await fetch('https://freeimage.host/api/1/upload', {
      method: 'POST',
      body: uploadFormData,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    if (!uploadRes.ok) throw new Error('Failed to upload image');
    const uploadData = await uploadRes.json();
    return uploadData.image.url;
  } catch (error) {
    clearTimeout(timeoutId);
    throw new Error('Image upload to host timed out or failed');
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { garmentImage, modelImage, modelType, style, category, brandName, promoText } = body;

    if (!garmentImage) {
      return NextResponse.json({ error: 'Missing garmentImage' }, { status: 400 });
    }

    const provider = new ReplicateProvider();
    let result;
    
    try {
      result = await provider.generate({
        garmentImage: garmentImage,
        modelImage: modelImage,
        category: category || 'tops',
        modelType,
        style,
        returnIdOnly: false // Replicate is sync, we don't need polling
      });
    } catch (fastPathError: any) {
      console.warn("Fast path failed (Replicate might not support this base64), falling back to freeimage.host:", fastPathError);
      const hostedGarmentUrl = await uploadToHost(garmentImage);
      let hostedModelUrl = undefined;
      if (modelImage) {
        hostedModelUrl = await uploadToHost(modelImage);
      }
      
      result = await provider.generate({
        garmentImage: hostedGarmentUrl,
        modelImage: hostedModelUrl,
        category: category || 'tops',
        modelType,
        style,
        returnIdOnly: false
      });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Base64 Generation Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate image' }, { status: 500 });
  }
}
