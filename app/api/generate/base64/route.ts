import { NextResponse } from 'next/server';
import { FashnProvider } from '@/lib/ai/fashn';

export const maxDuration = 60;



export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { garmentImage, modelImage, modelType, style, category, brandName, promoText } = body;

    if (!garmentImage) {
      return NextResponse.json({ error: 'Missing garmentImage' }, { status: 400 });
    }

    const provider = new FashnProvider();
    
    // Pass the base64 images directly to Fashn API, it supports them natively.
    const result = await provider.generate({
      garmentImage: garmentImage,
      modelImage: modelImage,
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
