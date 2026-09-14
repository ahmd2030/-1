const fs = require('fs');

// 1. Fix Gemini Prompt
let route = fs.readFileSync('app/api/analyze-garment/route.ts', 'utf8');
const oldGeminiPrompt = `- Determine the SEASON and VIBE of the clothing.
   - Invent a breathtaking, rich, immersive background that logically matches the clothing.
   - STRONGLY PREFER beautifully decorated, high-end indoor locations (luxury children's bedrooms with aesthetic decor, elegant living rooms with rich furniture). 
   - DO NOT suggest plain, empty, or minimalist backgrounds. The background must be rich and detailed.
   - Describe the architecture, decor, and lighting beautifully and simply (e.g., "A luxury aesthetic nursery with a wooden crib, vintage rug, and soft morning sunlight").`;

const newGeminiPrompt = `- CRITICAL: IGNORE the original background in the image (wood, carpets, hangers). Focus 100% on the CLOTHING item itself.
   - Act as a master color-theory expert. Analyze the color and style of the clothing, and invent a background setting with CONTRASTING or COMPLEMENTARY colors to make the clothing pop. (e.g., If the clothing is dark/black, design a bright beige/white room. If the clothing is plain, use rich colorful decor).
   - Invent a breathtaking, rich, immersive high-end indoor background (luxury nurseries, aesthetic bedrooms) that highlights the beauty of the model and outfit.
   - Describe the decor, props, and lighting beautifully and simply. DO NOT suggest plain backgrounds.`;

route = route.replace(oldGeminiPrompt, newGeminiPrompt);
fs.writeFileSync('app/api/analyze-garment/route.ts', route);


// 2. Fix FASHN Prompt
let fashn = fs.readFileSync('lib/ai/fashn.ts', 'utf8');
const oldFashnPrompt = `const promptText = \`ENVIRONMENT AND BACKGROUND: \${options.style || 'High-end indoor studio'}. 
      SUBJECT: A highly detailed, professional FULL-BODY fashion photography shot of \${subjectPrompt} \${categoryText}. 
      CRITICAL INSTRUCTIONS:`;

const newFashnPrompt = `const promptText = \`SUBJECT: A highly detailed, professional FULL-BODY fashion photography shot of \${subjectPrompt} \${categoryText}. 
      ENVIRONMENT AND SETTING: \${options.style || 'High-end indoor studio'}. 
      CRITICAL INSTRUCTIONS:`;

fashn = fashn.replace(oldFashnPrompt, newFashnPrompt);
fs.writeFileSync('lib/ai/fashn.ts', fashn);

console.log('Fixed prompts');
