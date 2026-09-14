const fs = require('fs');

let gemini = fs.readFileSync('app/api/analyze-garment/route.ts', 'utf8');

const oldSystemPrompt = `const systemPrompt = \`You are an AI that acts as both a world-class fashion art director AND a precise data-extraction engine.
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
   
\${generateMarketingDesc ? \`4. "marketing_desc":
   - Write a short, highly engaging, elegant 1-2 sentence marketing description in ARABIC (e.g., "أناقة لا تضاهى...").
   - Do NOT use emojis.
\` : \`4. "marketing_desc":
   - Return an empty string "".\`}

FORMAT: You must respond in pure JSON.
{
  "prompt": "...",
  "extracted_size": "...",
  "extracted_sku": "...",
  "marketing_desc": "..."
}\`;`;

const newSystemPrompt = `const systemPrompt = \`You are an AI that acts as both a world-class fashion art director AND a precise data-extraction engine.
Analyze the provided clothing image carefully.

Instructions:
1. "extracted_category":
   - Based on the clothing style, size, and gender cues, choose the EXACT ONE matching ID from this list:
     "baby girl" (for 9 months girl), "baby boy" (for 9 months boy),
     "toddler girl" (for 3 years girl), "toddler boy" (for 3 years boy),
     "young girl" (for 6-12 years girl), "young boy" (for 6-12 years boy),
     "teen girl" (for 16 years girl), "teen boy" (for 16 years boy),
     "woman" (for adult females), "man" (for adult males).
   - If the gender is ambiguous, default to the female variant.

2. "prompt": 
   - CRITICAL: IGNORE the original background in the image. Focus 100% on the CLOTHING.
   - Act as a master color-theory expert. Analyze the clothing color/style and invent a highly creative, RANDOM background setting (e.g., Parisian street cafe, sunny beautiful beach, magical winter forest, luxury indoor studio, royal castle garden, aesthetic bedroom).
   - ALWAYS pick a background that contrasts and complements the clothing color.
   - Be extremely descriptive about the environment, weather, and lighting.
   - CRITICAL: End the prompt with: "Model is STANDING UPRIGHT, walking or posing naturally on their feet. Full body is visible." NEVER suggest sitting or kneeling.
   
3. "extracted_size": 
   - Look closely at ALL text written on the image (top left, tags, etc).
   - Extract the exact clothing size (e.g., "3M", "0-12M", "S", "3 Years", "16").
   - If there is NO text, GUESS the appropriate size based on proportions.

4. "extracted_sku": 
   - Look closely at ALL text written on the image (top left, tags, etc).
   - Extract the exact product code (e.g., "V6118", "BR-123").
   - If there is NO text, INVENT a random creative SKU.
   
\${generateMarketingDesc ? \`5. "marketing_desc":
   - Write a short, highly engaging, elegant 1-2 sentence marketing description in ARABIC.
\` : \`5. "marketing_desc":
   - Return an empty string "".\`}

FORMAT: You must respond in pure JSON.
{
  "extracted_category": "...",
  "prompt": "...",
  "extracted_size": "...",
  "extracted_sku": "...",
  "marketing_desc": "..."
}\`;`;

gemini = gemini.replace(/const systemPrompt = `You are an AI[^]*?\}\`;/, newSystemPrompt);

const oldResponse = `return NextResponse.json({ 
      suggestion: parsed.prompt || "A beautiful luxury indoor studio setup, elegant decor, professional studio lighting. Natural candid walking pose, smiling.", 
      size: parsed.extracted_size || "", 
      sku: parsed.extracted_sku || "",
      marketing_desc: parsed.marketing_desc || ""
    });`;

const newResponse = `return NextResponse.json({ 
      suggestion: parsed.prompt || "A beautiful luxury indoor studio setup, elegant decor, professional studio lighting. Natural candid walking pose, smiling.", 
      size: parsed.extracted_size || "", 
      sku: parsed.extracted_sku || "",
      marketing_desc: parsed.marketing_desc || "",
      category: parsed.extracted_category || ""
    });`;

gemini = gemini.replace(oldResponse, newResponse);

fs.writeFileSync('app/api/analyze-garment/route.ts', gemini);
console.log("Updated Gemini Prompt");
