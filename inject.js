const fs = require('fs');
let code = fs.readFileSync('app/(dashboard)/dashboard/products/new/page.tsx', 'utf8');

// 1. Add imports
code = code.replace(/import \{ ([^}]+) \} from 'lucide-react';/, "import { $1, FileArchive } from 'lucide-react';");

if (!code.includes('import JSZip')) {
  code = code.replace(/import React/, "import JSZip from 'jszip';\nimport { saveAs } from 'file-saver';\nimport React");
}

// 2. Add states
code = code.replace(/const \[isAnalyzing, setIsAnalyzing\] = useState\(false\);/, 
`const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [generateMarketingDesc, setGenerateMarketingDesc] = useState(false);
  const [marketingDesc, setMarketingDesc] = useState('');`);

// 3. Pass generateMarketingDesc to analyzeGarment
code = code.replace(/const response = await fetch\('\/api\/analyze-garment', \{\s*method: 'POST',\s*headers: \{ 'Content-Type': 'application\/json' \},\s*body: JSON.stringify\(\{ garmentImage: base64 \}\),/g,
`const response = await fetch('/api/analyze-garment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ garmentImage: base64, generateMarketingDesc }),`);

// 4. Update analyzeGarment response handling
code = code.replace(/setExtractedSku\(data\.sku \|\| ''\);/g, 
`setExtractedSku(data.sku || '');
      setMarketingDesc(data.marketing_desc || '');`);

// 5. Update canvas drawing to include marketing description
const canvasDrawOld = `ctx.fillText(extractedSize || 'SIZE', 48, canvas.height - 100);
      }`;
const canvasDrawNew = `ctx.fillText(extractedSize || 'SIZE', 48, canvas.height - 100);
      }
      
      if (marketingDesc) {
        ctx.font = 'bold 36px "Tajawal", "Cairo", sans-serif';
        ctx.fillStyle = '#1e293b';
        ctx.textAlign = 'center';
        ctx.direction = 'rtl';
        
        // Simple word wrap for Arabic
        const words = marketingDesc.split(' ');
        let line = '';
        let y = canvas.height - 150;
        
        ctx.shadowColor = 'rgba(255, 255, 255, 0.9)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + ' ';
          const metrics = ctx.measureText(testLine);
          if (metrics.width > canvas.width - 100 && n > 0) {
            ctx.fillText(line, canvas.width / 2, y);
            line = words[n] + ' ';
            y += 50;
          } else {
            line = testLine;
          }
        }
        ctx.fillText(line, canvas.width / 2, y);
        ctx.shadowColor = 'transparent';
      }`;
code = code.replace(canvasDrawOld, canvasDrawNew);

// 6. Add ZIP function
const zipFunc = `  const downloadAllAsZip = async () => {
    if (galleryImages.length === 0) return;
    const zip = new JSZip();
    
    for (let i = 0; i < galleryImages.length; i++) {
      const url = galleryImages[i];
      const response = await fetch(url);
      const blob = await response.blob();
      zip.file(\`catalogue-\${i+1}.jpg\`, blob);
    }
    
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, 'Fashion-Catalogue.zip');
  };`;
code = code.replace(/const printGalleryAsCatalogue = \(\) => \{/, zipFunc + '\n\n  const printGalleryAsCatalogue = () => {');

// 7. Add Marketing Toggle to UI
const toggleUI = `              <div className="flex items-center justify-between bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 mb-6 mt-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="relative">
                    <input type="checkbox" className="sr-only" checked={generateMarketingDesc} onChange={(e) => setGenerateMarketingDesc(e.target.checked)} />
                    <div className={\`block w-10 h-6 rounded-full transition-colors \${generateMarketingDesc ? 'bg-emerald-600' : 'bg-slate-300'}\`}></div>
                    <div className={\`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform \${generateMarketingDesc ? 'translate-x-4' : ''}\`}></div>
                  </div>
                  <span className="text-sm font-bold text-emerald-900">توليد وصف تسويقي آلي (العربية) على الصورة</span>
                </label>
              </div>`;
code = code.replace(/<label className="block text-sm font-bold text-slate-700 mb-3">عمر وجنس العارض/, toggleUI + '\n\n                <label className="block text-sm font-bold text-slate-700 mb-3">عمر وجنس العارض');

// 8. Add ZIP button to Gallery
const zipButton = `<button 
                onClick={downloadAllAsZip}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 py-3 rounded-xl font-bold text-sm transition-colors mt-2"
              >
                <FileArchive className="w-4 h-4" />
                تحميل جميع الصور (ZIP)
              </button>`;
code = code.replace(/<Printer className="w-4 h-4" \/>\s*تحميل الكتالوج كـ PDF\s*<\/button>/, '<Printer className="w-4 h-4" />\n                تحميل الكتالوج كـ PDF\n              </button>\n              ' + zipButton);

fs.writeFileSync('app/(dashboard)/dashboard/products/new/page.tsx', code);
console.log('Successfully injected features into page.tsx');
