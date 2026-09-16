import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.FASHN_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'No API key' });

  const base64Image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

  try {
    const response = await fetch('https://api.fashn.ai/v1/run', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model_name: 'product-to-model',
        inputs: {
          product_image: base64Image,
          category: 'tops',
          prompt: 'A highly detailed fashion photography shot.'
        }
      })
    });
    const text = await response.text();
    return NextResponse.json({ status: response.status, body: text });
  } catch (e: any) {
    return NextResponse.json({ error: e.message });
  }
}
