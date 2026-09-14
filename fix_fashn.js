const fs = require('fs');
let code = fs.readFileSync('lib/ai/fashn.ts', 'utf8');

code = code.replace(/inputs\.negative_prompt = "plastic, doll, artificial, smooth, 3d render, cgi, ugly, distorted, deformed, poorly drawn face, poorly drawn eyes, bad anatomy";/, '');

fs.writeFileSync('lib/ai/fashn.ts', code);
console.log('Removed negative_prompt');
