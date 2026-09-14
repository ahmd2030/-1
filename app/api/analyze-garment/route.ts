import { NextResponse } from 'next/server';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { garmentImage, generateMarketingDesc } = await req.json();
    
    const apiKey = process.env.GEMINI_API_KEY || process.env.GEMINI;
    
    if (!apiKey) {
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
1. "prompt": 
   - CRITICAL: IGNORE the original background in the image (wood, carpets, hangers). Focus 100% on the CLOTHING item itself.
   - Act as a master color-theory expert. Analyze the color and style of the clothing, and invent a background setting with CONTRASTING or COMPLEMENTARY colors to make the clothing pop. (e.g., If the clothing is dark/black, design a bright beige/white room. If the clothing is plain, use rich colorful decor).
   - Invent a breathtaking, rich, immersive high-end indoor background (luxury nurseries, aesthetic bedrooms) that highlights the beauty of the model and outfit.
   - Describe the decor, props, and lighting beautifully and simply. DO NOT suggest plain backgrounds.
   - DO NOT use complex camera jargon. Keep it focused on the location.
   - CRITICAL: End the prompt with "Model is STANDING UPRIGHT, walking or posing naturally on their feet. Full body is visible." NEVER suggest sitting, kneeling, or crawling.
   
2. "extracted_size": 
   - Look closely at ALL text written on the image (top left, tags, etc).
   - Extract the exact clothing size or age (e.g., "0-12M", "S", "2-5").
   - If there is NO text, GUESS the appropriate age based on proportions.

3. "extracted_sku": 
   - Look closely at ALL text written on the image (top left, tags, etc).
   - Extract the exact product code (e.g., "V6118", "BR-123").
   - If there is NO text, INVENT a random SKU.
   
${generateMarketingDesc ? `4. "marketing_desc":
   - Write a short, highly engaging, elegant 1-2 sentence marketing description in ARABIC (e.g., "طقم أنيق يمنح طفلك إطلالة ساحرة ومريحة...").
   - Do NOT use emojis.
` : `4. "marketing_desc":
   - Return an empty string "".`}

FORMAT: You must respond in pure JSON.
{
  "prompt": "...",
  "extracted_size": "...",
  "extracted_sku": "...",
  "marketing_desc": "..."
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
        temperature: 0.2, 
        responseMimeType: "application/json" 
      },
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
      ]
    };

    const modelsToTry = ['gemini-1.5-pro', 'gemini-1.5-flash'];
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
        // Keep trying other models if one fails
          console.log("Gemini Error with " + model + ":", lastError);
      }
    }

    if (lastError) {
      return NextResponse.json({ error: lastError }, { status: 503 });
    }

    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!resultText) {
      const finishReason = data.candidates?.[0]?.finishReason;
      if (finishReason) {
         return NextResponse.json({ error: `Blocked by safety: ${finishReason}` }, { status: 400 });
      }
      return NextResponse.json({ error: "No suggestion returned from Gemini" }, { status: 500 });
    }

    let parsed;
    try {
      parsed = JSON.parse(resultText);
    } catch(e) {
      console.error("JSON Parse Error:", resultText);
      return NextResponse.json({ error: "Format Error from Gemini" }, { status: 500 });
    }

    return NextResponse.json({ 
      suggestion: parsed.prompt || "A beautiful luxury indoor studio setup, elegant decor, professional studio lighting. Natural candid walking pose, smiling.", 
      size: parsed.extracted_size || "", 
      sku: parsed.extracted_sku || "",
      marketing_desc: parsed.marketing_desc || ""
    });
  } catch (error: any) {
    console.error('Analysis error:', error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
