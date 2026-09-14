const fs = require('fs');
let code = fs.readFileSync('app/(dashboard)/dashboard/products/new/page.tsx', 'utf8');

code = code.replace(/error: err\.message \|\|/g, `error: (err as Error).message ||`);

fs.writeFileSync('app/(dashboard)/dashboard/products/new/page.tsx', code);
console.log('Fixed err type');
