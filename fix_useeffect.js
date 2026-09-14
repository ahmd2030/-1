const fs = require('fs');
let code = fs.readFileSync('app/(dashboard)/dashboard/products/new/page.tsx', 'utf8');

code = code.replace(/setGalleryImages\(normalized\);\n\s*\} catch\(e\) \{\}\n\s*\}, \[showGallery\]\);/, 
`setGalleryImages(normalized);
    } catch(e) {}
  }, []); // Fixed race condition that erased RAM images when storage is full`);

fs.writeFileSync('app/(dashboard)/dashboard/products/new/page.tsx', code);
console.log('Fixed useEffect dependency');
