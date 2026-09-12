import { NextResponse } from 'next/server';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { garmentImage } = await req.json();
    
    const apiKey = process.env.GEMINI_API_KEY || process.env.GEMINI;
    
    if (!apiKey) {
      return NextResponse.json({ 
        suggestion: "A beautiful cobblestone street in Paris, blurred cafe tables in the background, autumn leaves falling, soft cinematic sunlight. Natural candid walking pose, smiling.",
        size: "No Gemini Key",
        sku: "Add GEMINI_API_KEY"
      });
    }

    const systemPrompt = `You are an AI that acts as both a world-class fashion art director AND a precise data-extraction engine.
Analyze the provided clothing image carefully.

Instructions:
1. "prompt": 
   - Determine the SEASON and VIBE of the clothing.
   - Invent a breathtaking, rich, immersive, real-world photography background that logically matches the clothing.
   - Ensure massive CREATIVE VARIETY. Do not repeat generic backgrounds.
   - Describe this environment with professional lighting terms (cinematic, golden hour, 8k, photorealistic) and end with a candid natural lifestyle pose.
   
2. "extracted_size": 
   - Look closely at ALL text written on the image (top left, tags, etc).
   - Extract the exact clothing size or age (e.g., "0-12M", "S", "2-5").
   - If there is NO text, GUESS the appropriate age based on proportions.

3. "extracted_sku": 
   - Look closely at ALL text written on the image (top left, tags, etc).
   - Extract the exact product code (e.g., "V6118", "BR-123").
   - If there is NO text, INVENT a random SKU.

FORMAT: You must respond in pure JSON.
{
  "prompt": "...",
  "extracted_size": "...",
  "extracted_sku": "..."
}`;

    // Extract base64 and mime type
    let base64Data = garmentImage;
    let mimeType = 'image/jpeg';
    
    if (garmentImage.includes(',')) {
      const parts = garmentImage.split(',');
      base64Data = parts[1];
      mimeType = parts[0].split(';')[0].split(':')[1] || 'image/jpeg';
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: systemPrompt },
              {
                inlineData: {
                  mimeType: mimeType,
                  data: base64Data
                }
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.9,
          responseMimeType: "application/json"
        }
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || `HTTP Error ${response.status}`);
    }

    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!resultText) throw new Error("No suggestion returned");

    // Clean up just in case
    let cleanJson = resultText.trim();
    if (cleanJson.startsWith('```json')) cleanJson = cleanJson.replace(/```json/g, '').replace(/```/g, '').trim();
    if (cleanJson.startsWith('```')) cleanJson = cleanJson.replace(/```/g, '').trim();

    const parsed = JSON.parse(cleanJson);
    return NextResponse.json({ 
      suggestion: parsed.prompt || "", 
      size: parsed.extracted_size || "", 
      sku: parsed.extracted_sku || "" 
    });
  } catch (error: any) {
    console.error('Analysis error:', error);
    return NextResponse.json({ 
      suggestion: "A stunning natural lifestyle shot in a beautiful outdoor environment, perfect lighting, candid pose.",
      size: "Gemini Error",
      sku: error.message ? error.message : "Unknown Error"
    });
  }
}
