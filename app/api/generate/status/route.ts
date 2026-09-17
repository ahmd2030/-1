import { NextResponse } from 'next/server';
import { fal } from '@fal-ai/client';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawId = searchParams.get('id');
  const provider = searchParams.get('provider') || 'fashn';

  if (!rawId) {
    return NextResponse.json({ error: 'Missing generation ID' }, { status: 400 });
  }

  try {
    if (provider === 'fal') {
      const parts = rawId.split('|');
      const requestId = parts[0];
      const modelEndpoint = parts[1] || 'fal-ai/flux/schnell'; // Default if missing

      const status = await fal.queue.status(modelEndpoint as any, { requestId, logs: true });
      
      if (status.status === 'COMPLETED') {
        const result = await fal.queue.result(modelEndpoint as any, { requestId });
        let outputUrl = null;
        
        if (result.data?.images && result.data.images.length > 0) {
            outputUrl = result.data.images[0].url;
        } else if (result.data?.image?.url) {
            outputUrl = result.data.image.url;
        }

        if (outputUrl) {
           return NextResponse.json({
             id: rawId,
             imageUrl: outputUrl,
             status: 'completed'
           });
        }
      } else if (status.status === 'IN_PROGRESS' || status.status === 'IN_QUEUE') {
        return NextResponse.json({
          id: rawId,
          status: 'processing'
        });
      } else {
        return NextResponse.json({
          id: rawId,
          status: 'failed',
          error: 'Fal prediction failed or was canceled'
        });
      }
    }

    if (provider === 'replicate') {
      // Fallback for old requests that are still polling
      const apiKey = process.env.REPLICATE_API_TOKEN;
      if (!apiKey) throw new Error('REPLICATE_API_TOKEN missing');
      
      const res = await fetch(`https://api.replicate.com/v1/predictions/${rawId}`, {
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
          id: rawId,
          imageUrl: outputUrl,
          status: 'completed'
        });
      } else if (prediction.status === 'failed' || prediction.status === 'canceled') {
        return NextResponse.json({
          id: rawId,
          status: 'failed',
          error: prediction.error ? String(prediction.error) : 'Replicate prediction failed'
        });
      }
      
      return NextResponse.json({
        id: rawId,
        status: 'processing'
      });
    }

    // Default to Fashn...
    const { FashnProvider } = await import('@/lib/ai/fashn');
    const fashn = new FashnProvider();
    const result = await fashn.getStatus(rawId);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Status Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to check status' }, { status: 500 });
  }
}
