const fs = require('fs');
let code = fs.readFileSync('app/api/generate/base64/route.ts', 'utf8');

code = code.replace(/as string\[\]/g, 'as any');
code = code.replace(/as string/g, 'as any');

fs.writeFileSync('app/api/generate/base64/route.ts', code);
console.log('Fixed route typings');
