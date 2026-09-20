const fs = require('fs');

const code = fs.readFileSync('app/(dashboard)/dashboard/products/new/page.tsx', 'utf8');
const lines = code.split('\n');

const applyCatalogueOverlayStart = lines.findIndex(l => l.includes('const applyCatalogueOverlay = (imageUrl: string, customSizes?: string, customCode?: string, customDesc?: string)'));
let applyCatalogueOverlayEnd = -1;
let openBraces = 0;
let started = false;
for (let i = applyCatalogueOverlayStart; i < lines.length; i++) {
    if (lines[i].includes('{')) { openBraces += (lines[i].match(/\{/g) || []).length; started = true; }
    if (lines[i].includes('}')) { openBraces -= (lines[i].match(/\}/g) || []).length; }
    if (started && openBraces === 0) {
        applyCatalogueOverlayEnd = i;
        break;
    }
}

const handleGenerateStart = lines.findIndex(l => l.includes('const handleGenerate = async ()'));
let handleGenerateEnd = -1;
openBraces = 0;
started = false;
for (let i = handleGenerateStart; i < lines.length; i++) {
    if (lines[i].includes('{')) { openBraces += (lines[i].match(/\{/g) || []).length; started = true; }
    if (lines[i].includes('}')) { openBraces -= (lines[i].match(/\}/g) || []).length; }
    if (started && openBraces === 0) {
        handleGenerateEnd = i;
        break;
    }
}

console.log("applyCatalogueOverlay", applyCatalogueOverlayStart, applyCatalogueOverlayEnd);
console.log("handleGenerate", handleGenerateStart, handleGenerateEnd);
