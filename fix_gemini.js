const fs = require('fs');
let code = fs.readFileSync('app/api/analyze-garment/route.ts', 'utf8');

code = code.replace(/const modelsToTry = \['gemini-1\.5-flash-latest', 'gemini-1\.5-flash', 'gemini-1\.5-pro'\];/, "const modelsToTry = ['gemini-1.5-pro', 'gemini-1.5-flash'];");

code = code.replace(/if \(\!lastError\.includes\("not found"\)\) \{\s*break;\s*\}/g, `// Keep trying other models if one fails\n          console.log("Gemini Error with " + model + ":", lastError);`);

fs.writeFileSync('app/api/analyze-garment/route.ts', code);
console.log('Fixed Gemini model priority and retry logic');
