const fs = require('fs');
let code = fs.readFileSync('app/(dashboard)/dashboard/products/new/page.tsx', 'utf8');

const targetStr = `          // Resize to max 1200px to prevent 413 Request Entity Too Large on Vercel
          const resized = await resizeImageForAnalysis(b64);
          setBase64Image(resized);
          analyzeGarment(resized);`;

const newHandler = `          if (dualMode === 'two-colors' && autoSplit) {
            // MAGIC AUTO-SPLIT BEHIND THE SCENES
            const img = new Image();
            img.onload = async () => {
              const canvas1 = document.createElement('canvas');
              const canvas2 = document.createElement('canvas');
              canvas1.width = img.width / 2;
              canvas1.height = img.height;
              canvas2.width = img.width / 2;
              canvas2.height = img.height;
              
              const ctx1 = canvas1.getContext('2d');
              const ctx2 = canvas2.getContext('2d');
              
              if (ctx1 && ctx2) {
                ctx1.drawImage(img, 0, 0, img.width / 2, img.height, 0, 0, img.width / 2, img.height);
                ctx2.drawImage(img, img.width / 2, 0, img.width / 2, img.height, 0, 0, img.width / 2, img.height);
                
                const b64Left = canvas1.toDataURL('image/jpeg', 0.95);
                const b64Right = canvas2.toDataURL('image/jpeg', 0.95);
                
                const resizedLeft = await resizeImageForAnalysis(b64Left);
                const resizedRight = await resizeImageForAnalysis(b64Right);
                
                setBase64Image(resizedLeft);
                setBase64BackImage(resizedRight); // Automatically fill the second box
                
                toast.success('تم قص الصورة خلف الكواليس بنجاح! ✂️', { duration: 4000 });
                analyzeGarment(resizedLeft);
              }
            };
            img.src = b64;
          } else {
            const resized = await resizeImageForAnalysis(b64);
            setBase64Image(resized);
            analyzeGarment(resized);
          }`;

if (code.includes(targetStr)) {
  code = code.replace(targetStr, newHandler);
  console.log('Successfully injected auto-split logic!');
  fs.writeFileSync('app/(dashboard)/dashboard/products/new/page.tsx', code);
} else {
  // Try CRLF
  const crlfStr = "          // Resize to max 1200px to prevent 413 Request Entity Too Large on Vercel\r\n          const resized = await resizeImageForAnalysis(b64);\r\n          setBase64Image(resized);\r\n          analyzeGarment(resized);";
  if (code.includes(crlfStr)) {
    code = code.replace(crlfStr, newHandler);
    console.log('Successfully injected auto-split logic! (CRLF)');
    fs.writeFileSync('app/(dashboard)/dashboard/products/new/page.tsx', code);
  } else {
    console.log('Still could not find the target string!');
  }
}
