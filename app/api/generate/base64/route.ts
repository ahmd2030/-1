import { NextResponse } from 'next/server';
import { FashnProvider } from '@/lib/ai/fashn';

export const maxDuration = 60; // 60 seconds

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { garmentImage, modelType, style, brandName, promoText } = body;

    if (!garmentImage) {
      return NextResponse.json({ error: 'Missing garmentImage' }, { status: 400 });
    }

    // FASHN API requires a valid HTTP URL. We must upload the base64 data URI to an image host first.
    // garmentImage is a Data URI: "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
    const base64Data = garmentImage.split(',')[1];
    
    const uploadFormData = new URLSearchParams();
    uploadFormData.append('key', '6d207e02198a847aa98d0a2a901485a5'); // Freeimage.host public API key
    uploadFormData.append('action', 'upload');
    uploadFormData.append('source', base64Data);
    uploadFormData.append('format', 'json');

    const uploadRes = await fetch('https://freeimage.host/api/1/upload', {
      method: 'POST',
      body: uploadFormData,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    if (!uploadRes.ok) {
      throw new Error('فشل في رفع الصورة إلى الخادم المؤقت');
    }

    const uploadData = await uploadRes.json();
    const hostedImageUrl = uploadData.image.url;

    const provider = new FashnProvider();
    
    const result = await provider.generate({
      garmentImage: hostedImageUrl, // Pass the HTTP URL instead of base64
      category: 'tops',
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
