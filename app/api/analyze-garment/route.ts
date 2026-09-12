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

    const systemPrompt = `You are an AI that acts as both a world-class fashion art director AND a precise text-extraction engine.
Analyze the provided clothing image carefully.

Instructions:
1. "prompt": 
   - First, determine the SEASON (Summer, Winter, Fall, Spring) and VIBE (formal, casual, sleepwear, outdoor, etc.) of the clothing.
   - Second, invent a breathtaking, rich, immersive, real-world photography background that LOGICALLY MATCHES the clothing's season and vibe. (e.g., Do NOT put a heavy winter coat on a sunny beach, and do NOT put a summer dress in a snowy cabin).
   - Third, ensure massive CREATIVE VARIETY. If it's summer, do not always use a beach (use a Tuscan villa garden, a luxury yacht, a sunny botanical greenhouse, a European fruit market, etc.). If it's winter, use a cozy ski lodge, a snowy forest with pine trees, a magical holiday street, etc.
   - Describe this environment with professional lighting terms (cinematic, golden hour, 8k, photorealistic) and end with a candid natural lifestyle pose.
   
2. "extracted_size": Read the text from the image. Extract ONLY the clothing size or age (e.g., "S.M.L", "2-5", "10-12"). If there is no text indicating size, output "".
3. "extracted_sku": Read the text from the image. Extract ONLY the product code or model number (e.g., "566-13B", "A123"). If none, output "".

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
        temperature: 0.9 // high temp for maximum creative variety
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
      size: "",
      sku: ""
    });
  }
}
