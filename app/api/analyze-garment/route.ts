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
            content: "You are an expert fashion art director. Analyze the provided clothing item. Based on its style, fabric, season, and vibe, write a highly descriptive background and pose prompt for an AI image generator. The background should perfectly complement the clothing (e.g., winter coat -> snowy background or cozy cabin; summer dress -> sunny beach or bright garden; elegant evening wear -> luxury studio or ballroom). Keep it concise, comma-separated. Only output the English prompt string, no markdown, no quotes, no extra text. End with: 'Natural, relaxed, candid dynamic lifestyle pose, happy expression'."
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Suggest the perfect background and pose for this item." },
              { type: "image_url", image_url: { url: garmentImage } }
            ]
          }
        ],
        max_tokens: 150
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
    return NextResponse.json({ suggestion: "Luxury cozy indoor living room, wooden floor, soft window sunlight, decorative plants. Natural, relaxed, candid dynamic pose." });
  }
}
