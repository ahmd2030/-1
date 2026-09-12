import { NextResponse } from 'next/server';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { garmentImage } = await req.json();
    
    if (!process.env.OPENAI_API_KEY) {
      console.log("No OpenAI key, using fallback");
      return NextResponse.json({ suggestion: "Luxury cozy indoor living room, wooden floor, soft window sunlight, decorative plants. Natural, relaxed, candid dynamic pose." });
    }

    console.log("Analyzing garment with GPT-4o-mini...");

    const systemPrompt = `You are a world-class fashion art director and lead photographer for luxury children's brands and high-end fashion magazines (like Vogue or Zara Kids).
Analyze the provided clothing item (fabric, style, season, vibe). 
Write a master-level, highly descriptive background and photography prompt for a photorealistic AI image generator.

Instructions:
1. Environment: Design a visually striking, high-end, breathtaking aesthetic environment that perfectly complements the garment. Use rich, evocative details (e.g., 'minimalist wabi-sabi interior with raw concrete and warm sunlight', or 'sun-drenched luxurious Tuscan villa garden with olive trees and soft shadows'). Avoid generic backgrounds.
2. Lighting & Camera: Include professional photography terms to ensure maximum visual quality (e.g., 'soft volumetric lighting, beautiful golden hour sunlight filtering through window, shot on 35mm lens, delicate soft shadows, cinematic composition, 8k resolution, award-winning photorealistic photography, hyper-detailed').
3. Pose & Vibe: Describe the model's pose as highly natural and candid (e.g., 'Natural, relaxed, candid dynamic lifestyle pose, happy authentic expression, walking or playing naturally, no stiff poses').
4. Format: A continuous comma-separated paragraph. NO introductory text, NO markdown, NO quotes. Just the raw English prompt.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Create a breathtaking, high-end editorial photography prompt for this garment." },
              { type: "image_url", image_url: { url: garmentImage } }
            ]
          }
        ],
        max_tokens: 200,
        temperature: 0.7
      })
    });

    const data = await response.json();
    
    if (data.error) {
      console.error("OpenAI Error:", data.error);
      throw new Error(data.error.message);
    }
    
    const suggestion = data.choices?.[0]?.message?.content?.trim();

    if (!suggestion) {
      throw new Error("No suggestion returned from OpenAI");
    }

    return NextResponse.json({ suggestion });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json({ suggestion: "Luxury elegant minimalist studio, raw texture walls, warm softbox lighting, high-end fashion editorial, 8k resolution, photorealistic. Natural, relaxed, candid dynamic pose." });
  }
}
