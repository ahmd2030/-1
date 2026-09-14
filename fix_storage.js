const fs = require('fs');
let code = fs.readFileSync('app/(dashboard)/dashboard/products/new/page.tsx', 'utf8');

code = code.replace(/localStorage\.setItem\('ai_fashion_generated_images', JSON\.stringify\(currentGallery\)\);/g, 
`try {
            localStorage.setItem('ai_fashion_generated_images', JSON.stringify(currentGallery));
          } catch(e) {
            console.warn("Storage full, kept in RAM");
          }`);

code = code.replace(/localStorage\.setItem\('ai_fashion_generated_images', JSON\.stringify\(updated\)\);/g, 
`try {
          localStorage.setItem('ai_fashion_generated_images', JSON.stringify(updated));
        } catch(e) {
          console.warn("Storage full, kept in RAM");
        }`);

code = code.replace(/localStorage\.setItem\('ai_fashion_generated_images', JSON\.stringify\(updatedGallery\)\);/g, 
`try {
                    localStorage.setItem('ai_fashion_generated_images', JSON.stringify(updatedGallery));
                  } catch(e) {}`);

fs.writeFileSync('app/(dashboard)/dashboard/products/new/page.tsx', code);
console.log('Fixed storage limits');
