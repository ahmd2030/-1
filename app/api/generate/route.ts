import { NextResponse } from 'next/server';
import { aiRouter } from '@/lib/ai/router';
import { AIGenerationOptions } from '@/lib/ai/provider';

export async function POST(request: Request) {
  try {
    const body: AIGenerationOptions = await request.json();

    // Basic Validation
    if (!body.garmentImage || !body.category || !body.modelType) {
      return NextResponse.json(
        { error: 'Missing required fields (garmentImage, category, modelType)' },
        { status: 400 }
      );
    }

    // Process via AI Router
    const result = await aiRouter.generateImage(body);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Generation API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate image' },
      { status: 500 }
    );
  }
}
