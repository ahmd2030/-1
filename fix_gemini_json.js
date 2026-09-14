const fs = require('fs');
let code = fs.readFileSync('app/api/analyze-garment/route.ts', 'utf8');

const target = `    let parsed;
    try {
      parsed = JSON.parse(resultText);
    } catch(e) {
      console.error("JSON Parse Error:", resultText);
      return NextResponse.json({ error: "Format Error from Gemini" }, { status: 500 });
    }`;

const replacement = `    let parsed;
    try {
      let cleanText = resultText.replace(/\`\`\`json/gi, '').replace(/\`\`\`/g, '').trim();
      parsed = JSON.parse(cleanText);
    } catch(e) {
      console.error("JSON Parse Error:", resultText);
      return NextResponse.json({ error: "Format Error from Gemini" }, { status: 500 });
    }`;

code = code.replace(target, replacement);
fs.writeFileSync('app/api/analyze-garment/route.ts', code);
console.log('Fixed JSON stripping');
