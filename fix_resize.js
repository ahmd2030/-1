const fs = require('fs');
let code = fs.readFileSync('app/(dashboard)/dashboard/products/new/page.tsx', 'utf8');

code = code.replace(/const MAX_SIZE = 512;/, 'const MAX_SIZE = 1200; // Increased to preserve text readability for Gemini');

fs.writeFileSync('app/(dashboard)/dashboard/products/new/page.tsx', code);
console.log("Fixed MAX_SIZE");
