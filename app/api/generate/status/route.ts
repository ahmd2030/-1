import { NextResponse } from 'next/server';
import { FashnProvider } from '@/lib/ai/fashn';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing generation ID' }, { status: 400 });
  }

  try {
    const provider = new FashnProvider();
    const result = await provider.getStatus(id);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Status Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to check status' }, { status: 500 });
  }
}
