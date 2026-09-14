const fs = require('fs');
let code = fs.readFileSync('app/(dashboard)/dashboard/products/new/page.tsx', 'utf8');

code = code.replace(/<input\s*type="file"\s*accept="image\/\*"\s*onChange=\{handleFileSelect\}\s*className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"\s*\/>/g, 
`<input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileSelect}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />`);

fs.writeFileSync('app/(dashboard)/dashboard/products/new/page.tsx', code);
console.log('Fixed empty state upload input');
