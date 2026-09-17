const fs = require('fs');
let code = fs.readFileSync('app/(dashboard)/dashboard/products/new/page.tsx', 'utf8');

// Replace pollStatus signature to support provider
code = code.replace(/async function pollStatus\(id: string\): Promise<any> \{/, 
  'async function pollStatus(id: string, provider: string = \"fashn\"): Promise<any> {');

code = code.replace(/fetch\(\\/api\/generate\/status\?id=\$\{id\}&t=\$\{Date\.now\(\)\}\/g,
  'fetch(/api/generate/status?id=\&provider=\&t=\');

// Rewrite handleGenerate
const newHandleGenerate = \
  const handleGenerate = async () => {
    if (!base64Image) {
      toast.error("ÇáÑÌÇÁ ÑÝÚ ÕæÑÉ ááãäÊÌ ÃæáÇð");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const finalPrompt = garmentDirection === 'back' 
        ? \\\Model is facing backwards, walking away from the camera, showing the BACK of the garment. \\\\
        : stylePrompt;

      let humanUrl = base64ModelImage;
      
      // Step 1: Generate Human Model (if no model provided)
      if (!humanUrl) {
        toast.success("íÊã ÇáÂä ÊÕãíã ÇáÚÇÑÖ ÇáÈÔÑí (ÇáãÑÍáÉ 1 ãä 2)...", { duration: 4000 });
        const fluxRes = await fetch('/api/generate/base64', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            replicateStep: 1,
            modelType,
            style: finalPrompt,
          })
        });
        
        let fluxData = await fluxRes.json();
        if (fluxData.error) throw new Error(fluxData.error);
        
        if (fluxData.id && fluxData.status === 'processing') {
          fluxData = await pollStatus(fluxData.id, fluxData.provider);
        }
        humanUrl = fluxData.imageUrl;
      }
      
      // Step 2: Apply Garment (VTON)
      toast.success("íÊã ÇáÂä ÅáÈÇÓ ÇáÚÇÑÖ æÊØÈíÞ ÇáÅÖÇÁÉ (ÇáãÑÍáÉ 2 ãä 2)...", { duration: 5000 });
      const vtonRes = await fetch('/api/generate/base64', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          replicateStep: 2,
          garmentImage: base64Image,
          humanImageUrl: humanUrl,
          modelType,
          category,
          style: finalPrompt,
        })
      });
      
      let data = await vtonRes.json();
      if (data.error) throw new Error(data.error);
      
      if (data.id && data.status === 'processing') {
        data = await pollStatus(data.id, data.provider);
      }
      
      if (data.imageUrl) {
        toast.success("Êã ÇáÊæáíÏ¡ ÌÇÑí ÊÕãíã ÛáÇÝ ÇáßÊÇáæÌ...");
        // Convert to base64 via proxy to avoid Canvas CORS issues
        const proxyRes = await fetch('/api/proxy-image?url=' + encodeURIComponent(data.imageUrl));
        const proxyData = await proxyRes.json();
        const safeImageUrl = proxyData.base64 || data.imageUrl;
        
        const finalImageUrl = await applyCatalogueOverlay(safeImageUrl, sizes, productCode, marketingDesc);
        
          const firebaseItem = { 
            cleanUrl: safeImageUrl, 
            sizes, 
            sku: productCode, 
            desc: marketingDesc,
            userId: auth?.currentUser?.uid || 'anonymous',
            createdAt: serverTimestamp()
          };
          let docId = Math.random().toString();
          if (db) {
            try {
              const docRef = await addDoc(collection(db, "generated_images"), firebaseItem);
              docId = docRef.id;
            } catch (e) { console.error("Firebase err", e); }
          }
          const finalItem = { id: docId, cleanUrl: safeImageUrl, previewUrl: finalImageUrl, sizes, sku: productCode, desc: marketingDesc, createdAt: new Date() };
          
          setGalleryImages(prev => [finalItem, ...prev]);
          try {
            localStorage.setItem('ai_fashion_generated_images', JSON.stringify([finalItem, ...galleryImages].slice(0, 10)));
          } catch(e) {}
          
          toast.success("Êã ÇáÍÝÙ ÈäÌÇÍ!");
      }
    } catch (e: any) {
      setError(e.message || "ÍÏË ÎØÃ ÛíÑ ãÊæÞÚ");
    } finally {
      setLoading(false);
    }
  };
\;

const startIdx = code.indexOf('const handleGenerate = async () => {');
const endIdx = code.indexOf('const triggerFileInput = () => {');
code = code.substring(0, startIdx) + newHandleGenerate + '\\n  ' + code.substring(endIdx);

fs.writeFileSync('app/(dashboard)/dashboard/products/new/page.tsx', code);
