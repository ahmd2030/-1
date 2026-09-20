import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiKey = process.env.FASHN_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 400 });
    }

    const res = await fetch('https://api.fashn.ai/v1/credits', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      cache: 'no-store'
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Failed to fetch credits: ${err}`);
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
