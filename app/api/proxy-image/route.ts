import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('url');

  if (!imageUrl) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  try {
    const res = await fetch(imageUrl);
    if (!res.ok) throw new Error('Failed to fetch image');

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': res.headers.get('content-type') || 'image/jpeg',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to proxy image' }, { status: 500 });
  }
}
