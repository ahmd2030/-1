const fs = require('fs');
let code = fs.readFileSync('app/(dashboard)/dashboard/products/new/page.tsx', 'utf8');

// Replace all inline onChange for front image with handleFileSelect
const regexFront = /<input type="file" accept="image\/\*" onChange=\{\(e\) => \{\s*const file = e\.target\.files\?\.\[0\];\s*if \(file\) \{\s*const reader = new FileReader\(\);\s*reader\.onload = \(ev\) => setBase64Image\(ev\.target\?\.result as string\);\s*reader\.readAsDataURL\(file\);\s*\}\s*\}\} className="hidden" \/>/g;

const matchCount = (code.match(regexFront) || []).length;
console.log(`Found ${matchCount} inline front inputs`);

code = code.replace(regexFront, '<input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />');

// Let's also check the Back Image inline handler just in case, but it doesn't need auto-split, it just needs resize.
// We'll leave the Back Image alone for now, since auto-split populates it automatically.

fs.writeFileSync('app/(dashboard)/dashboard/products/new/page.tsx', code);
