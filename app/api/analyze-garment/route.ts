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
   - Describe this environment with professional lighting terms (cinematic, golden hour, 8k, photorealistic).
   - CRITICAL: End the prompt with "Model is STANDING UPRIGHT, walking or posing naturally on their feet. Full body is visible." NEVER suggest sitting, kneeling, or crawling.
   
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

    let base64Data = garmentImage;
    let mimeType = 'image/jpeg';
    
    if (garmentImage.includes(',')) {
      const parts = garmentImage.split(',');
      base64Data = parts[1];
      mimeType = parts[0].split(';')[0].split(':')[1] || 'image/jpeg';
    }

    const payload = {
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
        temperature: 0.9
      }
    };

    const modelsToTry = ['gemini-flash-latest', 'gemini-3.5-flash', 'gemini-2.5-flash'];
    let data: any = null;
    let lastError = "";

    for (const model of modelsToTry) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      data = await response.json();
      
      if (response.ok) {
        lastError = "";
        break; 
      } else {
        lastError = data.error?.message || `HTTP ${response.status}`;
        if (!lastError.includes("not found")) {
          break; 
        }
      }
    }

    if (lastError) {
      return NextResponse.json({ suggestion: lastError, size: "API Error", sku: "Model Error" });
    }

    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!resultText) throw new Error("No suggestion returned");

    let cleanJson = resultText.trim();
    if (cleanJson.startsWith('```json')) cleanJson = cleanJson.replace(/```json/g, '').replace(/```/g, '').trim();
    if (cleanJson.startsWith('```')) cleanJson = cleanJson.replace(/```/g, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(cleanJson);
    } catch(e) {
      const extractedSize = cleanJson.match(/"extracted_size":\s*"([^"]+)"/)?.[1] || "";
      const extractedSku = cleanJson.match(/"extracted_sku":\s*"([^"]+)"/)?.[1] || "";
      parsed = {
        prompt: cleanJson,
        extracted_size: extractedSize,
        extracted_sku: extractedSku
      };
    }

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
      sku: "Error"
    });
  }
}
