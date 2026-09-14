const fs = require('fs');
let code = fs.readFileSync('app/api/generate/base64/route.ts', 'utf8');

code = code.replace(/"stability-ai\/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b"/g, '"stability-ai/sdxl"');
code = code.replace(/"yisol\/idm-vton:c02d9fac2614730240a50eda629ff2d109bb10bc4ce87c4850fa15fbe8e121b6"/g, '"yisol/idm-vton"');

fs.writeFileSync('app/api/generate/base64/route.ts', code);
console.log('Removed hashes');
