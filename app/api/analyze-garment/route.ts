import { NextResponse } from 'next/server';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { garmentImage } = await req.json();
    
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ 
        suggestion: "A beautiful cobblestone street in Paris, blurred cafe tables in the background, autumn leaves falling, soft cinematic sunlight. Natural candid walking pose, smiling.",
        size: "",
        sku: ""
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
   - Look for any text on the image indicating size (e.g., S, M, L, or 2-5).
   - If you FIND text, extract it. 
   - If there is NO text, GUESS the appropriate age or size for this child's garment based on its proportions (e.g., "2-5 Years", "6-12 Years", or "Baby 3-6M"). Do NOT leave it empty.

3. "extracted_sku": 
   - Look for any text indicating a product code.
   - If you FIND text, extract it.
   - If there is NO text, INVENT a professional-looking random product SKU for it (e.g., "BR-8492", "FW24-105", "KIDS-A77"). Do NOT leave it empty.

FORMAT: You must respond in pure JSON.
{
  "prompt": "...",
  "extracted_size": "...",
  "extracted_sku": "..."
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o", 
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Analyze the image and return the JSON object." },
              { type: "image_url", image_url: { url: garmentImage } }
            ]
          }
        ],
        max_tokens: 300,
        temperature: 0.9 
      })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    
    const resultText = data.choices?.[0]?.message?.content?.trim();
    if (!resultText) throw new Error("No suggestion returned");

    const parsed = JSON.parse(resultText);
    return NextResponse.json({ 
      suggestion: parsed.prompt || "", 
      size: parsed.extracted_size || "", 
      sku: parsed.extracted_sku || "" 
    });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json({ 
      suggestion: "A stunning natural lifestyle shot in a beautiful outdoor environment, perfect lighting, candid pose.",
      size: "2-5 Years",
      sku: "BR-" + Math.floor(Math.random() * 9000 + 1000)
    });
  }
}
