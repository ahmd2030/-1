import { NextResponse } from 'next/server';
import Replicate from 'replicate';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const apiKey = process.env.REPLICATE_API_TOKEN;
    if (!apiKey) throw new Error('No API key');
    
    const replicate = new Replicate({ auth: apiKey });
    const predictions = await replicate.predictions.list();
    
    const logs = predictions.results.slice(0, 10).map(p => ({
      id: p.id,
      model: p.model,
      status: p.status,
      error: p.error,
      created_at: p.created_at,
      completed_at: p.completed_at
    }));
    
    return NextResponse.json(logs);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
