import { NextResponse } from 'next/server';
import Replicate from 'replicate';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const provider = searchParams.get('provider') || 'fashn';

  if (!id) {
    return NextResponse.json({ error: 'Missing generation ID' }, { status: 400 });
  }

  try {
    if (provider === 'replicate') {
      const apiKey = process.env.REPLICATE_API_TOKEN;
      if (!apiKey) throw new Error('REPLICATE_API_TOKEN missing');
      
      const res = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        cache: 'no-store'
      });
      const prediction = await res.json();
      
      if (prediction.status === 'succeeded') {
        const outputUrl = typeof prediction.output === 'string' ? prediction.output : (prediction.output?.[0] || prediction.output);
        return NextResponse.json({
          id,
          imageUrl: outputUrl,
          status: 'completed'
        });
      } else if (prediction.status === 'failed' || prediction.status === 'canceled') {
        return NextResponse.json({
          id,
          status: 'failed',
          error: prediction.error ? String(prediction.error) : 'Replicate prediction failed'
        });
      }
      
      return NextResponse.json({
        id,
        status: 'processing'
      });
    }

    // Default to Fashn...
    // (I will keep Fashn getStatus logic intact for fallback)
    const { FashnProvider } = await import('@/lib/ai/fashn');
    const fashn = new FashnProvider();
    const result = await fashn.getStatus(id);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Status Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to check status' }, { status: 500 });
  }
}
