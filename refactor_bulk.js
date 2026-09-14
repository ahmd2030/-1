const fs = require('fs');
let code = fs.readFileSync('app/(dashboard)/dashboard/products/new/page.tsx', 'utf8');

// 1. Change file input to multiple
code = code.replace(/<input type="file" accept="image\/\*" onChange=\{handleImageUpload\} className="hidden" \/>/,
`<input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />`);

// 2. Add queue states
const statesAdd = `
  const [queue, setQueue] = useState<File[]>([]);
  const [processingIndex, setProcessingIndex] = useState<number>(-1);
  const [isBulkMode, setIsBulkMode] = useState<boolean>(false);
`;
code = code.replace(/const \[file, setFile\] = useState<File \| null>\(null\);/, `const [file, setFile] = useState<File | null>(null);${statesAdd}`);

// 3. Modify handleImageUpload to handle multiple
const handleUploadOld = `const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const b64 = event.target.result as string;
        setBase64Image(b64);
        analyzeGarment(b64);
      }
    };
    reader.readAsDataURL(selectedFile);
  };`;
const handleUploadNew = `const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    if (e.target.files.length > 1) {
      setIsBulkMode(true);
      setQueue(Array.from(e.target.files));
      setFile(e.target.files[0]);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) setBase64Image(event.target.result as string);
      };
      reader.readAsDataURL(e.target.files[0]);
      toast.success(\`تم إضافة \${e.target.files.length} صور للقائمة\`);
    } else {
      setIsBulkMode(false);
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const b64 = event.target.result as string;
          setBase64Image(b64);
          analyzeGarment(b64);
        }
      };
      reader.readAsDataURL(selectedFile);
    }
  };`;
code = code.replace(handleUploadOld, handleUploadNew);

// 4. Update applyCatalogueOverlay to accept parameters instead of reading state
const overlayOld = `const applyCatalogueOverlay = (imageUrl: string): Promise<string> => {`;
const overlayNew = `const applyCatalogueOverlay = (imageUrl: string, customSizes?: string, customCode?: string, customDesc?: string): Promise<string> => {`;
code = code.replace(overlayOld, overlayNew);

code = code.replace(/if \(productCode\) ctx\.fillText\(productCode,/g, `if (customCode || productCode) ctx.fillText(customCode || productCode,`);
code = code.replace(/if \(sizes\) \{/g, `if (customSizes || sizes) {
              const sizeArray = (customSizes || sizes).split(/[,/|،\\n]/).map(s => s.trim()).filter(Boolean);`);
code = code.replace(/if \(marketingDesc\) \{/g, `if (customDesc || marketingDesc) {`);
code = code.replace(/const words = marketingDesc\.split\(' '\);/g, `const words = (customDesc || marketingDesc).split(' ');`);

// 5. Add processQueue function
const processQueueFunc = `
  const processQueue = async () => {
    if (queue.length === 0) return;
    setLoading(true);
    setProcessingIndex(0);
    setShowGallery(true);
    
    let currentGallery = [...galleryImages];
    
    for (let i = 0; i < queue.length; i++) {
      setProcessingIndex(i);
      try {
        const currentFile = queue[i];
        
        // 1. Read file to Base64
        const b64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(currentFile);
        });
        
        // 2. Analyze Garment
        const optB64 = await resizeImageForAnalysis(b64);
        const analyzeRes = await fetch('/api/analyze-garment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ garmentImage: optB64, generateMarketingDesc })
        });
        const analyzeData = await analyzeRes.json();
        
        let genSizes = '';
        let genSku = '';
        let genDesc = '';
        let genPrompt = stylePrompt; // Default fallback
        
        if (analyzeRes.ok && !analyzeData.error) {
          if (analyzeData.size) genSizes = analyzeData.size;
          if (analyzeData.sku) genSku = analyzeData.sku;
          if (analyzeData.marketing_desc) genDesc = analyzeData.marketing_desc;
          if (analyzeData.suggestion) genPrompt = analyzeData.suggestion;
        }

        const finalPrompt = garmentDirection === 'back' 
          ? \`Model is facing backwards, walking away from the camera, showing the BACK of the garment. \${genPrompt}\`
          : genPrompt;
          
        // 3. Generate Image
        const genRes = await fetch('/api/generate/base64', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'ready_to_generate',
            garmentImage: b64,
            modelImage: base64ModelImage,
            modelType,
            category,
            style: finalPrompt,
          })
        });
        
        const genData = await genRes.json();
        if (genData.imageUrl) {
          const finalImageUrl = await applyCatalogueOverlay(genData.imageUrl, genSizes, genSku, genDesc);
          currentGallery = [finalImageUrl, ...currentGallery];
          localStorage.setItem('ai_fashion_generated_images', JSON.stringify(currentGallery));
          setGalleryImages([...currentGallery]); // trigger re-render
        }
      } catch (err) {
        console.error("Error processing item", i, err);
      }
    }
    
    setLoading(false);
    setProcessingIndex(-1);
    setIsBulkMode(false);
    setQueue([]);
    toast.success("تم الانتهاء من التوليد الجماعي!");
  };
`;

code = code.replace(/const handleGenerate = async \(\) => \{/, processQueueFunc + '\n  const handleGenerate = async () => {');

// 6. Fix handleGenerate's overlay call
code = code.replace(/const finalImageUrl = await applyCatalogueOverlay\(data\.imageUrl\);/, `const finalImageUrl = await applyCatalogueOverlay(data.imageUrl, sizes, productCode, marketingDesc);`);

// 7. Change button in UI based on isBulkMode
const btnOld = `<button
              onClick={handleGenerate}
              disabled={loading || !base64Image || isAnalyzing}`;
const btnNew = `<button
              onClick={isBulkMode ? processQueue : handleGenerate}
              disabled={loading || !base64Image || isAnalyzing}`;
code = code.replace(btnOld, btnNew);

const spanOld = `<span>بدء التصميم وإنشاء صفحة الكتالوج!</span>`;
const spanNew = `<span>{isBulkMode ? \`بدء التوليد الجماعي لـ \${queue.length} صور 🚀\` : 'بدء التصميم وإنشاء صفحة الكتالوج!'}</span>`;
code = code.replace(spanOld, spanNew);

const statusOld = `<span>جاري التوليد والتصميم (قد يستغرق 30 ثانية)...</span>`;
const statusNew = `<span>{isBulkMode && processingIndex >= 0 ? \`جاري معالجة الصورة \${processingIndex + 1} من \${queue.length}...\` : 'جاري التوليد والتصميم (قد يستغرق 30 ثانية)...'}</span>`;
code = code.replace(statusOld, statusNew);

fs.writeFileSync('app/(dashboard)/dashboard/products/new/page.tsx', code);
console.log('Successfully injected Bulk Generation!');
