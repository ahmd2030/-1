const fs = require('fs');
let code = fs.readFileSync('app/(dashboard)/dashboard/products/new/page.tsx', 'utf8');

// We have the resize function: resizeImageForAnalysis
// Let's use it directly in handleFileSelect
const oldFileSelect = `        const reader = new FileReader();
        reader.onload = async (event) => {
          if (event.target?.result) {
            const b64 = event.target.result as string;
            setBase64Image(b64);
            analyzeGarment(b64);
          }
        };
        reader.readAsDataURL(selectedFile);`;

const newFileSelect = `        const reader = new FileReader();
        reader.onload = async (event) => {
          if (event.target?.result) {
            const b64 = event.target.result as string;
            // Compress immediately to prevent Vercel 4.5MB payload limit
            const compressed = await resizeImageForAnalysis(b64);
            setBase64Image(compressed);
            analyzeGarment(compressed);
          }
        };
        reader.readAsDataURL(selectedFile);`;

code = code.replace(oldFileSelect, newFileSelect);

// Same for handleModelFileSelect
const oldModelSelect = `      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setBase64ModelImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(e.target.files[0]);`;

const newModelSelect = `      const reader = new FileReader();
      reader.onload = async (event) => {
        if (event.target?.result) {
          const b64 = event.target.result as string;
          const compressed = await resizeImageForAnalysis(b64);
          setBase64ModelImage(compressed);
        }
      };
      reader.readAsDataURL(e.target.files[0]);`;

code = code.replace(oldModelSelect, newModelSelect);

fs.writeFileSync('app/(dashboard)/dashboard/products/new/page.tsx', code);
console.log('Fixed upload compression');
