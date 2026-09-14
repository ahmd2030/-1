const fs = require('fs');
let code = fs.readFileSync('app/api/generate/base64/route.ts', 'utf8');

const oldCheck = `if (!fluxOutput || fluxOutput.length === 0) {
      throw new Error("Failed to generate human model from FLUX.");
    }`;

const newCheck = `if (!fluxOutput) {
      throw new Error("FLUX output is null or undefined.");
    }
    
    // Sometimes Replicate returns a single string instead of an array, or a stream
    let humanImageUrl = "";
    if (Array.isArray(fluxOutput) && fluxOutput.length > 0) {
      humanImageUrl = fluxOutput[0];
    } else if (typeof fluxOutput === 'string') {
      humanImageUrl = fluxOutput;
    } else if (fluxOutput && typeof fluxOutput === 'object' && fluxOutput.url) {
      humanImageUrl = fluxOutput.url;
    } else {
      throw new Error("FLUX returned unknown format: " + JSON.stringify(fluxOutput));
    }`;

code = code.replace(oldCheck, newCheck);

// Clean up the next line since we define humanImageUrl in the check now
code = code.replace(/const humanImageUrl = fluxOutput\[0\];/, '');

fs.writeFileSync('app/api/generate/base64/route.ts', code);
console.log('Added debug check for FLUX output');
