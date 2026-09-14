const fs = require('fs');
let code = fs.readFileSync('app/api/generate/base64/route.ts', 'utf8');

const target = `const humanImageUrl = fluxOutput[0];
    } else if (typeof fluxOutput === 'string') {`;

const replacement = `const humanImageUrl = fluxOutput[0];
    } else if (typeof fluxOutput === 'string') {`;

const oldIDM = `console.log('Applying garment using IDM-VTON...');`;
const newIDM = `console.log('Applying garment using IDM-VTON...');
    // Add a 3 second delay to prevent Replicate's 429 Too Many Requests (burst limit)
    await new Promise(resolve => setTimeout(resolve, 3000));`;

code = code.replace(oldIDM, newIDM);
fs.writeFileSync('app/api/generate/base64/route.ts', code);
console.log('Added delay between Replicate calls');
