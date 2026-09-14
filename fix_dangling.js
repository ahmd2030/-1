const fs = require('fs');
let code = fs.readFileSync('app/(dashboard)/dashboard/products/new/page.tsx', 'utf8');

const target = `            const existing = JSON.parse(localStorage.getItem('ai_fashion_generated_images') || '[]');
            localStorage.setItem('ai_fashion_generated_images', JSON.stringify([finalItem, ...existing].slice(0, 10)));
          } catch(e) {}
          setGalleryImages(updated);`;

const replacement = `            const existing = JSON.parse(localStorage.getItem('ai_fashion_generated_images') || '[]');
            localStorage.setItem('ai_fashion_generated_images', JSON.stringify([finalItem, ...existing].slice(0, 10)));
          } catch(e) {}`;

code = code.replace(target, replacement);
fs.writeFileSync('app/(dashboard)/dashboard/products/new/page.tsx', code);
console.log('Fixed dangling updated');
