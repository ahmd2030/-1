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

    const systemPrompt = `You are an AI that acts as both a world-class fashion art director AND a precise data-extraction engine.
Analyze the provided clothing image carefully.

Instructions:
1. "extracted_category":
   - Based on the clothing style, size, and gender cues, choose the EXACT ONE matching ID from this list:
     "baby girl" (for 9 months girl), "baby boy" (for 9 months boy),
     "toddler girl" (for 3 years girl), "toddler boy" (for 3 years boy),
     "young girl" (for 6-12 years girl), "young boy" (for 6-12 years boy),
     "teen girl" (for 16 years girl), "teen boy" (for 16 years boy),
     "woman" (for adult females), "man" (for adult males).
2. "prompt":
   - Write a master-level, breathtaking, photorealistic fashion photography prompt for the model wearing this item.
   - STRICT REQUIREMENT: Choose a varied, dynamic, real-world background location (e.g., 'a sun-drenched Italian villa', 'a rainy street in London', 'a luxury cafe in Paris'). DO NOT ALWAYS USE A STUDIO.
   - End with: 'Natural, candid walking pose, smiling'.
3. "extracted_size":
   - Zoom in on any visible tags, labels, or text on the garment.
   - If you see a size (like S, M, L, XL, 3-6M, 4Y, 120cm, etc.), return exactly that string. If nothing is found, return an empty string "".
4. "extracted_sku":
   - Zoom in on any visible text. If you see a product code, item number, or SKU (like DR-7729, ABC-123), return exactly that string. If nothing is found, return "".
5. "marketing_desc":
   - ${generateMarketingDesc ? "Write a short, elegant 2-sentence Arabic marketing description for this item to be placed on a fashion catalogue." : "Leave empty."}

FORMAT: You must respond in pure JSON ONLY. No markdown, no intro.
{
  "extracted_category": "...",
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
      const modelsToTry = ['gemini-3.6-flash', 'gemini-2.5-flash', 'gemini-2.5-pro'];
      
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
      category: parsed.extracted_category || ""
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
