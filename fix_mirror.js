const fs = require('fs');
let code = fs.readFileSync('lib/ai/fashn.ts', 'utf8');

const oldInst = `CRITICAL INSTRUCTIONS: The model MUST BE STANDING UPRIGHT on their feet.`;
const newInst = `CRITICAL INSTRUCTIONS: DO NOT MIRROR OR FLIP THE GARMENT. Any text, numbers, or logos on the clothing MUST remain exactly as they appear in the original image (un-mirrored). The model MUST BE STANDING UPRIGHT on their feet.`;

code = code.replace(oldInst, newInst);
fs.writeFileSync('lib/ai/fashn.ts', code);
console.log('Fixed mirroring instruction');
