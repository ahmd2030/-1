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

    const provider = new FashnProvider();
    
    const result = await provider.generate({
      garmentImage, // directly pass base64
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
