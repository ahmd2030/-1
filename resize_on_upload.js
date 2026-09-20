const fs = require('fs');
let code = fs.readFileSync('app/(dashboard)/dashboard/products/new/page.tsx', 'utf8');

// The file uses \r\n line endings (Windows CRLF)
const oldHandler = "       if (event.target?.result) {\r\n          const b64 = event.target.result as string;\r\n          setBase64Image(b64);\r\n          analyzeGarment(b64);\r\n        }";

const newHandler = "       if (event.target?.result) {\r\n          const b64 = event.target.result as string;\r\n          // Resize to max 1200px to prevent 413 Request Entity Too Large on Vercel\r\n          const resized = await resizeImageForAnalysis(b64);\r\n          setBase64Image(resized);\r\n          analyzeGarment(resized);\r\n        }";

if (code.includes(oldHandler)) {
  code = code.replace(oldHandler, newHandler);
  console.log('Front handler patched!');
} else {
  console.log('CRLF pattern not found, trying LF...');
  const oldLF = "       if (event.target?.result) {\n          const b64 = event.target.result as string;\n          setBase64Image(b64);\n          analyzeGarment(b64);\n        }";
  const newLF = "       if (event.target?.result) {\n          const b64 = event.target.result as string;\n          const resized = await resizeImageForAnalysis(b64);\n          setBase64Image(resized);\n          analyzeGarment(resized);\n        }";
  if (code.includes(oldLF)) {
    code = code.replace(oldLF, newLF);
    console.log('LF pattern patched!');
  } else {
    // Try with just the critical line
    code = code.replace('setBase64Image(b64);\r\n          analyzeGarment(b64);', 'const resized = await resizeImageForAnalysis(b64);\r\n          setBase64Image(resized);\r\n          analyzeGarment(resized);');
    console.log('Single line replaced');
  }
}

fs.writeFileSync('app/(dashboard)/dashboard/products/new/page.tsx', code);
console.log('Saved');
