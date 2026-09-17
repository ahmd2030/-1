const fs = require('fs');
let code = fs.readFileSync('app/api/analyze-garment/route.ts', 'utf8');

const target = `const modelsToTry = ['gemini-1.5-pro', 'gemini-1.5-flash'];`;
const replacement = `const modelsToTry = ['gemini-1.5-pro-latest', 'gemini-1.5-flash-latest', 'gemini-pro-vision'];`;

code = code.replace(target, replacement);
fs.writeFileSync('app/api/analyze-garment/route.ts', code);
console.log('Fixed Gemini model names');
