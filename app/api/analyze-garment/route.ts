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

    const themes = [
      "Bustling European street cafe in autumn",
      "Luxurious sun-drenched Mediterranean villa",
      "Enchanted magical forest with glowing lights",
      "High-end minimalist wabi-sabi interior",
      "Royal vintage children's playroom",
      "Sunny blooming spring garden",
      "Cozy winter cabin with a fireplace",
      "Modern art gallery with dramatic lighting",
      "Beautiful sandy beach resort at golden hour",
      "Luxury London storefront with elegant window displays"
    ];
    const randomTheme = themes[Math.floor(Math.random() * themes.length)];

    const systemPrompt = `You are an AI that acts as both a world-class fashion art director AND a precise text-extraction engine.
Analyze the provided clothing image carefully.

Instructions:
1. "prompt": Create a breathtaking, rich, immersive photography prompt for this garment. The environment MUST be strongly inspired by this exact theme: "${randomTheme}". Include professional lighting terms and a candid natural pose.
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
        model: "gpt-4o", // Upgraded to gpt-4o for flawless OCR
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
        temperature: 0.8 // high temp for creative prompts
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
