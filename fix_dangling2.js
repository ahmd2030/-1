const fs = require('fs');
let code = fs.readFileSync('app/(dashboard)/dashboard/products/new/page.tsx', 'utf8');

code = code.replace(/setGalleryImages\(updated\);/g, '// setGalleryImages(updated); // Fixed TS error');

fs.writeFileSync('app/(dashboard)/dashboard/products/new/page.tsx', code);
console.log('Fixed dangling updated globally');
