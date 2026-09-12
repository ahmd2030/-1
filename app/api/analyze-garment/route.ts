import { NextResponse } from 'next/server';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { garmentImage } = await req.json();
    
    if (!process.env.OPENAI_API_KEY) {
      console.log("No OpenAI key, using fallback");
      return NextResponse.json({ 
        suggestion: "A beautiful cobblestone street in Paris, blurred cafe tables in the background, autumn leaves falling, soft cinematic sunlight. Natural candid walking pose, smiling.",
        size: "",
        sku: ""
      });
    }

    console.log("Analyzing garment with GPT-4o-mini...");

    const systemPrompt = `You are an AI that acts as both a world-class fashion art director AND a text-extraction engine.
Analyze the provided clothing image.

Instructions:
1. "prompt": Create a breathtaking, rich, immersive, real-world high-end editorial photography prompt for this garment (e.g., Parisian street, magical forest, luxury playroom). NO plain walls. Include professional lighting terms and a natural candid pose.
2. "extracted_size": Look closely at the image. Is there any text indicating the size or age range? (e.g., 'S.M.L', '2-5', '3-6 months'). If yes, extract it exactly. If no, leave as an empty string "".
3. "extracted_sku": Look closely at the image. Is there any text indicating a product code, model number, or SKU? (e.g., '566-13B', 'BR-2024'). If yes, extract it exactly. If no, leave as an empty string "".

FORMAT REQUIRED: You MUST respond ONLY with a raw JSON object. Do not include markdown formatting like \`\`\`json. Just the raw JSON.
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
        model: "gpt-4o-mini",
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
        temperature: 0.2
      })
    });

    const data = await response.json();
    
    if (data.error) {
      console.error("OpenAI Error:", data.error);
      throw new Error(data.error.message);
    }
    
    let resultText = data.choices?.[0]?.message?.content?.trim();
    if (!resultText) throw new Error("No suggestion returned from OpenAI");

    // Clean up potential markdown formatting if the model disobeys
    if (resultText.startsWith("```json")) {
      resultText = resultText.replace(/```json/g, "").replace(/```/g, "").trim();
    } else if (resultText.startsWith("```")) {
      resultText = resultText.replace(/```/g, "").trim();
    }

    try {
      const parsed = JSON.parse(resultText);
      return NextResponse.json({ 
        suggestion: parsed.prompt || "", 
        size: parsed.extracted_size || "", 
        sku: parsed.extracted_sku || "" 
      });
    } catch (e) {
      console.error("Failed to parse JSON from OpenAI:", resultText);
      return NextResponse.json({ suggestion: resultText, size: "", sku: "" });
    }
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json({ 
      suggestion: "A beautiful cobblestone street in Paris, blurred cafe tables in the background, autumn leaves falling, soft cinematic sunlight. Natural candid walking pose, smiling.",
      size: "",
      sku: ""
    });
  }
}
