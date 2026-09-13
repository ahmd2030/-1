import { NextResponse } from 'next/server';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { garmentImage } = await req.json();
    
    const apiKey = process.env.GEMINI_API_KEY || process.env.GEMINI;
    
    if (!apiKey) {
      return NextResponse.json({ 
        suggestion: "A beautiful luxury indoor studio setup, elegant decor, professional studio lighting. Natural candid walking pose, smiling. Wearing stylish shoes.",
        size: "No Gemini Key",
        sku: "Add GEMINI_API_KEY"
      });
    }

    const systemPrompt = `You are a world-class AI Fashion Art Director and Master Prompt Engineer for Vogue Magazine.
Analyze the provided clothing image carefully.

Instructions:
1. "prompt": 
   - Analyze the CLOTHING ONLY. You MUST COMPLETELY IGNORE the background, furniture, or setting of the uploaded image. Do not copy its lighting or vibe.
   - Invent an ULTRA-DETAILED, breathtaking, high-end INDOOR photography set. 
   - You MUST describe specific architectural details, interior design elements, and decor (e.g., "luxury Parisian apartment with ornate moldings, herringbone wood floor, and a vintage Persian rug", "modern aesthetic studio with soft sheer curtains and minimalist furniture").
   - Describe lighting with expert photography terms (e.g., "soft diffuse morning sunlight streaming through a large window", "cinematic volumetric lighting", "professional studio lighting", "8k, photorealistic").
   - Describe a DYNAMIC, realistic fashion pose (e.g., "walking confidently towards the camera", "standing casually in a high-fashion pose").
   - CRITICAL: End the prompt with "Model is STANDING UPRIGHT. The model is WEARING STYLISH MATCHING SHOES. Full body is visible from head to toe." DO NOT suggest sitting, kneeling, or being barefoot.
   - The output must be highly descriptive, rich in adjectives, and at least 3-4 sentences long to guarantee a masterpiece.
   
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
        temperature: 1.0 // Increased for maximum creativity
      },
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
      ]
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
      return NextResponse.json({ 
        suggestion: lastError, 
        size: "Error", 
        sku: lastError.substring(0, 40)
      });
    }

    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!resultText) {
      const finishReason = data.candidates?.[0]?.finishReason;
      if (finishReason) {
         return NextResponse.json({ suggestion: `Blocked by safety: ${finishReason}`, size: "Error", sku: finishReason });
      }
      throw new Error("No suggestion returned");
    }

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
      suggestion: "A stunning natural lifestyle shot in a luxury indoor environment, perfect lighting, candid pose.",
      size: "Gemini Error",
      sku: error.message ? error.message.substring(0, 40) : "Error"
    });
  }
}
