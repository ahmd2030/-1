const fs = require('fs');
let code = fs.readFileSync('app/(dashboard)/dashboard/products/new/page.tsx', 'utf8');

code = code.replace(/const res = await fetch\('\/api\/analyze-garment', \{[\s\S]*?body: JSON\.stringify\(\{ garmentImage: optimizedImage, generateMarketingDesc \}\)\n\s*\}\);\n\s*const text = await res\.text\(\);\n\s*let data;\n\s*try \{\n\s*data = JSON\.parse\(text\);\n\s*\} catch\(err\) \{\n\s*console\.error\("Server returned non-JSON:", text\);\n\s*throw new Error\(".*?\"\);\n\s*\}/,
`const res = await fetch('/api/analyze-garment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ garmentImage: optimizedImage, generateMarketingDesc })
        });
        
        let data;
        try {
          data = await res.json();
        } catch(err) {
          throw new Error("فشل الاتصال بمحلل الصور.");
        }
        
        if (!res.ok || data.error) {
          throw new Error(data.error || "حدث خطأ أثناء تحليل الصورة.");
        }`);

fs.writeFileSync('app/(dashboard)/dashboard/products/new/page.tsx', code);
console.log('Fixed analyzeGarment error handling');
