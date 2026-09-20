import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { garmentImage, generateMarketingDesc } = await req.json();
    
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GEMINI;
    const openaiKey = process.env.OPENAI_API_KEY;
    
    if (!geminiKey && !openaiKey) {
      return NextResponse.json({ 
        suggestion: "A beautiful luxury indoor studio setup, elegant decor, professional studio lighting. Natural candid walking pose, smiling.",
        size: "",
        sku: "",
        marketing_desc: ""
      });
    }

    const systemPrompt = `You are a world-class fashion art director and precise data-extraction engine.
Analyze the clothing image VERY CAREFULLY.

Instructions:
1. "model_type":
   - Look at the garment's size and style. You MUST classify the exact age group correctly.
   - Choose EXACTLY ONE from this list:
     "baby girl" (0-24 months girl, onesies, baby rompers),
     "baby boy" (0-24 months boy, onesies, baby rompers),
     "toddler girl" (2-5 years girl), "toddler boy" (2-5 years boy),
     "young girl" (6-12 years girl), "young boy" (6-12 years boy),
     "teen girl" (13-17 years girl), "teen boy" (13-17 years boy),
     "woman" (adult females), "man" (adult males).
   - If the label says "0-12M" or it is a baby onesie, YOU MUST CHOOSE "baby boy" or "baby girl". DO NOT CHOOSE TODDLER.

2. "garment_category":
   - Choose EXACTLY ONE from this list:
     "tops" (shirts, jackets, hoodies),
     "bottoms" (pants, skirts),
     "one-pieces" (dresses, jumpsuits, baby onesies, rompers).

3. "prompt":
   - Write a master-level, photorealistic fashion photography prompt for the model wearing this item.
   - CRITICAL REQUIREMENT: The background environment MUST BE 100% LOGICAL for the garment type.
     * If it is a baby onesie, pajamas, sleepwear, or underwear, the background MUST be an "indoor cozy bedroom" or "nursery room". DO NOT put pajamas or baby onesies on a street or outdoors!
     * If it is swimwear, it MUST be a beach or pool.
     * If it is a winter coat, it MUST be snowy outdoors.
     * Otherwise, choose a fitting luxury location.
   - End with: 'Natural candid pose, smiling'.

4. "extracted_size":
   - Zoom in on tags/text. Extract the exact size string (e.g., "0-12M", "M", "3-4Y"). If none, return "".

5. "extracted_sku":
   - Zoom in on tags/text. Extract product code (e.g., "V6119"). If none, return "".

6. "marketing_desc":
   - ${generateMarketingDesc ? "Write a short, elegant 2-sentence Arabic marketing description." : "Leave empty."}

FORMAT: You must respond in pure JSON ONLY.
{
  "model_type": "...",
  "garment_category": "...",
  "prompt": "...",
  "extracted_size": "...",
  "extracted_sku": "...",
  "marketing_desc": "..."
}`;

    let base64Data = garmentImage;
    let mimeType = 'image/jpeg';
    if (garmentImage.includes('base64,')) {
      const parts = garmentImage.split('base64,');
      base64Data = parts[1];
      mimeType = parts[0].split(';')[0].split(':')[1] || 'image/jpeg';
    }

    let resultText = "";
    let geminiSuccess = false;
    let allErrors = [];

    // 1. Try Gemini First
    if (geminiKey) {
      const genAI = new GoogleGenerativeAI(geminiKey);
      const modelsToTry = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro-vision'];
      
      for (const m of modelsToTry) {
        try {
          const model = genAI.getGenerativeModel({ model: m });
          const result = await model.generateContent([
            systemPrompt,
            { inlineData: { data: base64Data, mimeType: mimeType } }
          ]);
          const response = await result.response;
          resultText = response.text();
          geminiSuccess = true;
          break;
        } catch (e: any) {
          allErrors.push("Gemini " + m + ": " + (e.message || "error"));
        }
      }
    }

    // 2. Fallback to OpenAI if Gemini failed or wasn't provided
    if (!geminiSuccess && openaiKey) {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiKey}`
          },
          body: JSON.stringify({
            model: "gpt-4o",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: [
                  { type: "text", text: "Analyze this image and return the JSON." },
                  { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Data}` } }
                ]
              }
            ],
            response_format: { type: "json_object" },
            max_tokens: 500,
            temperature: 0.2
          })
        });
        
        const data = await response.json();
        if (data.error) throw new Error(data.error.message);
        resultText = data.choices[0].message.content;
      } catch (e: any) {
        allErrors.push("OpenAI: " + (e.message || "error"));
      }
    }

    // 3. Fallback to Replicate Llava-13b if both Gemini and OpenAI failed
    if (!resultText && process.env.REPLICATE_API_TOKEN) {
      try {
        const Replicate = (await import('replicate')).default;
        const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
        
        const prediction = await replicate.predictions.create({
          version: "b5f621afbfedfa16f0ca582f3a61c4728f32ac171b3052a654949a263690d565",
          input: {
            image: `data:${mimeType};base64,${base64Data}`,
            prompt: systemPrompt
          }
        });
        
        let finalPrediction = prediction;
        while (finalPrediction.status !== 'succeeded' && finalPrediction.status !== 'failed' && finalPrediction.status !== 'canceled') {
          await new Promise(r => setTimeout(r, 2000));
          finalPrediction = await replicate.predictions.get(prediction.id);
        }
        
        if (finalPrediction.status === 'succeeded' && finalPrediction.output) {
          resultText = Array.isArray(finalPrediction.output) ? finalPrediction.output.join("") : finalPrediction.output;
        } else {
          allErrors.push("Replicate: " + finalPrediction.error);
        }
      } catch (e: any) {
        allErrors.push("Replicate: " + (e.message || "error"));
      }
    }

    if (!resultText) {
      return NextResponse.json({ error: "All AI models failed. Errors: " + allErrors.join(" | ") }, { status: 500 });
    }

    let parsed;
    try {
      let cleanText = resultText;
      const jsonMatch = resultText.match(/\{[\s\S]*\}/);
      if (jsonMatch) cleanText = jsonMatch[0];
      parsed = JSON.parse(cleanText);
    } catch(e) {
      return NextResponse.json({ error: "Format Error from AI" }, { status: 500 });
    }

    return NextResponse.json({ 
      suggestion: parsed.prompt || "A beautiful luxury indoor studio setup, elegant decor, professional studio lighting. Natural candid walking pose, smiling.", 
      size: parsed.extracted_size || "", 
      sku: parsed.extracted_sku || "",
      marketing_desc: parsed.marketing_desc || "",
      model_type: parsed.model_type || "",
      garment_category: parsed.garment_category || ""
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
