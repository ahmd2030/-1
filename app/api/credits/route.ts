import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiKey = process.env.FASHN_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ credits: -1, reason: 'no_key' });
    }

    const res = await fetch('https://api.fashn.ai/v1/credits', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      cache: 'no-store'
    });

    const raw = await res.json();
    
    // Handle all possible field names Fashn might use
    const credits = 
      raw.total_credits ?? 
      raw.credits ?? 
      raw.balance ?? 
      raw.remaining ?? 
      null;
    
    if (credits !== null) {
      return NextResponse.json({ credits: Number(credits) });
    }

    // Return raw data so we can debug in browser
    return NextResponse.json({ credits: -1, reason: 'unknown_format', raw });
    
  } catch (error: any) {
    return NextResponse.json({ credits: -1, reason: error.message });
  }
}
