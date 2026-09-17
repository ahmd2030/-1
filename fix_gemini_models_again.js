const fs = require('fs');
let code = fs.readFileSync('app/api/analyze-garment/route.ts', 'utf8');

const target = `const modelsToTry = ['gemini-1.5-pro-latest', 'gemini-1.5-flash-latest', 'gemini-pro-vision'];`;
const replacement = `const modelsToTry = ['gemini-1.5-pro']; // Only use the stable model to surface the exact error`;

code = code.replace(target, replacement);

fs.writeFileSync('app/api/analyze-garment/route.ts', code);
console.log('Fixed Gemini model names');
