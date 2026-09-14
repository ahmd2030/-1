const fs = require('fs');
let code = fs.readFileSync('app/(dashboard)/dashboard/products/new/page.tsx', 'utf8');

code = code.replace(/const sizeArray = sizes\.split\(\/\[,\/\|،\\n\]\/\)\.map\(s => s\.trim\(\)\)\.filter\(Boolean\);\n/, '');

fs.writeFileSync('app/(dashboard)/dashboard/products/new/page.tsx', code);
console.log('Fixed redeclaration');
