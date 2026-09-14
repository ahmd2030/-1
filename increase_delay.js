const fs = require('fs');
let code = fs.readFileSync('app/api/generate/base64/route.ts', 'utf8');

code = code.replace(/setTimeout\(resolve, 3000\)/, 'setTimeout(resolve, 6000)');

fs.writeFileSync('app/api/generate/base64/route.ts', code);
console.log('Increased delay to 6s');
