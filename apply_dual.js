const fs = require('fs');
const path = 'app/(dashboard)/dashboard/products/new/page.tsx';
let code = fs.readFileSync(path, 'utf8');
const lines = code.split('\n');

const applyOverlayStart = 199;
const applyOverlayEnd = 326;
const applyOverlayNew = `  const applyCatalogueOverlay = (frontUrl: string, backUrl?: string, customSizes?: string, customCode?: string, customDesc?: string): Promise<string> => {
    return new Promise((resolve) => {
      if (!canvasRef.current) return resolve(frontUrl);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(frontUrl);

      const isDual = !!backUrl;
      const requiresText = catalogueMode;

      if (!isDual && !requiresText) {
        return resolve(frontUrl);
      }

      const imgFront = new Image();
      imgFront.crossOrigin = "anonymous";
      imgFront.onerror = () => resolve(frontUrl);

      imgFront.onload = () => {
        if (!isDual) {
          // Single Image Text Overlay
          canvas.width = imgFront.width;
          canvas.height = imgFront.height;
          ctx.drawImage(imgFront, 0, 0);
          drawText(ctx, canvas, imgFront.width, customSizes, customCode, customDesc);
          drawLogoAndResolve(ctx, canvas, resolve, frontUrl);
        } else {
          // Dual Image Collage (Front + Back)
          const imgBack = new Image();
          imgBack.crossOrigin = "anonymous";
          imgBack.onerror = () => {
            // Fallback to single if back fails
            canvas.width = imgFront.width;
            canvas.height = imgFront.height;
            ctx.drawImage(imgFront, 0, 0);
            if (requiresText) drawText(ctx, canvas, imgFront.width, customSizes, customCode, customDesc);
            if (requiresText) drawLogoAndResolve(ctx, canvas, resolve, frontUrl);
            else resolve(canvas.toDataURL('image/jpeg', 0.95));
          };
          imgBack.onload = () => {
            // Create a gorgeous 1080x1350 template (Instagram portrait ratio)
            canvas.width = 1080;
            canvas.height = 1350;
            
            // Background
            ctx.fillStyle = "#f8fafc";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Left side (Front model) - Large
            // Right side (Back model) - Smaller inset + original elements
            
            // Draw Front Model (Left 65%)
            const splitX = canvas.width * 0.65;
            // Source aspect ratio
            const frontRatio = imgFront.width / imgFront.height;
            let sxFront = 0, syFront = 0, swFront = imgFront.width, shFront = imgFront.height;
            // Calculate cover crop for 65% width
            const targetFrontRatio = splitX / canvas.height;
            if (frontRatio > targetFrontRatio) {
               swFront = shFront * targetFrontRatio;
               sxFront = (imgFront.width - swFront) / 2;
            } else {
               shFront = swFront / targetFrontRatio;
               syFront = (imgFront.height - shFront) / 2;
            }
            ctx.drawImage(imgFront, sxFront, syFront, swFront, shFront, 0, 0, splitX, canvas.height);

            // Draw shadow separator
            ctx.shadowColor = 'rgba(0,0,0,0.2)';
            ctx.shadowBlur = 30;
            ctx.shadowOffsetX = -10;
            ctx.fillRect(splitX, 0, canvas.width - splitX, canvas.height);
            ctx.shadowColor = 'transparent'; // reset

            // Right side background
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(splitX, 0, canvas.width - splitX, canvas.height);

            // Draw Back Model (Right side, center vertically, smaller)
            const rightWidth = canvas.width - splitX;
            const backHeight = canvas.height * 0.4;
            const backWidth = rightWidth * 0.9;
            const bx = splitX + (rightWidth - backWidth) / 2;
            const by = (canvas.height - backHeight) / 2;
            
            // Draw rounded rect mask for Back image
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(bx, by, backWidth, backHeight, 20);
            ctx.clip();
            ctx.drawImage(imgBack, 0, 0, imgBack.width, imgBack.height, bx, by, backWidth, backHeight);
            ctx.restore();

            // Outline for Back image
            ctx.strokeStyle = "#e2e8f0";
            ctx.lineWidth = 4;
            ctx.stroke();

            // Text
            if (requiresText) {
              // Custom text drawing for collage layout
              const padding = 40;
              ctx.fillStyle = "#1e293b"; 
              ctx.font = \`bold 40px Arial, sans-serif\`;
              ctx.textAlign = "right";
              ctx.textBaseline = "top";
              if (customCode || productCode) {
                 ctx.fillText(customCode || productCode, canvas.width - padding, padding + 100);
              }
              
              ctx.fillStyle = "#475569"; 
              ctx.font = \`bold 30px Arial, sans-serif\`;
              if (customSizes || sizes) {
                 const sizeArray = (customSizes || sizes).split(/[,/|،\\n]/).map(s => s.trim()).filter(Boolean);
                 let sizeY = padding + 160;
                 sizeArray.forEach(sizeLine => {
                    ctx.fillText(sizeLine, canvas.width - padding, sizeY);
                    sizeY += 40;
                 });
              }

              if (customDesc || marketingDesc) {
                  ctx.font = \`bold 35px "Tajawal", "Cairo", sans-serif\`;
                  ctx.fillStyle = '#1e293b';
                  ctx.textAlign = 'center';
                  ctx.direction = 'rtl';
                  const words = (customDesc || marketingDesc).split(' ');
                  let line = '';
                  let y = canvas.height - 150;
                  const maxW = canvas.width - 100;
                  
                  ctx.shadowColor = 'rgba(255, 255, 255, 0.9)';
                  ctx.shadowBlur = 15;
                  
                  for (let n = 0; n < words.length; n++) {
                    const testLine = line + words[n] + ' ';
                    const metrics = ctx.measureText(testLine);
                    if (metrics.width > maxW && n > 0) {
                      ctx.fillText(line, canvas.width / 2, y);
                      line = words[n] + ' ';
                      y += 45;
                    } else {
                      line = testLine;
                    }
                  }
                  ctx.fillText(line, canvas.width / 2, y);
                  ctx.shadowColor = 'transparent';
              }
              drawLogoAndResolve(ctx, canvas, resolve, frontUrl, canvas.width - 40 - 150, 40, 150);
            } else {
              resolve(canvas.toDataURL('image/jpeg', 0.95));
            }
          };
          imgBack.src = '/api/proxy-image?url=' + encodeURIComponent(backUrl);
        }
      };
      imgFront.src = '/api/proxy-image?url=' + encodeURIComponent(frontUrl);
    });
  };

  const drawText = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, imgWidth: number, customSizes?: string, customCode?: string, customDesc?: string) => {
    const padding = imgWidth * 0.05;
    ctx.fillStyle = "#1e293b"; 
    ctx.font = \`bold \${imgWidth * 0.05}px Arial, sans-serif\`;
    ctx.textAlign = "right";
    ctx.textBaseline = "top";
    if (customCode || productCode) ctx.fillText(customCode || productCode, imgWidth - padding, padding);
    
    ctx.fillStyle = "#475569"; 
    ctx.font = \`bold \${imgWidth * 0.035}px Arial, sans-serif\`;
    if (customSizes || sizes) {
        const sizeArray = (customSizes || sizes).split(/[,/|،\\n]/).map(s => s.trim()).filter(Boolean);
        let sizeY = padding + (imgWidth * 0.06);
        sizeArray.forEach(sizeLine => {
          ctx.fillText(sizeLine, imgWidth - padding, sizeY);
          sizeY += (imgWidth * 0.045);
        });
    }
    
    if (customDesc || marketingDesc) {
        ctx.font = \`bold \${imgWidth * 0.04}px "Tajawal", "Cairo", sans-serif\`;
        ctx.fillStyle = '#1e293b';
        ctx.textAlign = 'center';
        ctx.direction = 'rtl';
        const words = (customDesc || marketingDesc).split(' ');
        let line = '';
        let y = canvas.height - (imgWidth * 0.15);
        
        ctx.shadowColor = 'rgba(255, 255, 255, 0.9)';
        ctx.shadowBlur = 15;
        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + ' ';
          const metrics = ctx.measureText(testLine);
          if (metrics.width > canvas.width - (padding * 2) && n > 0) {
            ctx.fillText(line, canvas.width / 2, y);
            line = words[n] + ' ';
            y += (imgWidth * 0.05);
          } else {
            line = testLine;
          }
        }
        ctx.fillText(line, canvas.width / 2, y);
        ctx.shadowColor = 'transparent';
    }
  };

  const drawLogoAndResolve = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, resolve: any, fallbackUrl: string, lx?: number, ly?: number, lw?: number) => {
    if (base64Logo) {
      const logoImg = new Image();
      logoImg.crossOrigin = "anonymous";
      logoImg.onload = () => {
        const logoWidth = lw || canvas.width * 0.2;
        const logoHeight = logoImg.height * (logoWidth / logoImg.width);
        const x = lx !== undefined ? lx : padding;
        const y = ly !== undefined ? ly : padding;
        
        ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
        ctx.shadowBlur = 20;
        ctx.drawImage(logoImg, x, y, logoWidth, logoHeight);
        ctx.shadowColor = 'transparent';
        resolve(canvas.toDataURL('image/jpeg', 0.95));
      };
      logoImg.onerror = () => resolve(canvas.toDataURL('image/jpeg', 0.95));
      logoImg.src = base64Logo;
    } else if (brandName) {
      const padding = lx !== undefined ? 40 : canvas.width * 0.05;
      ctx.fillStyle = "#0f172a";
      ctx.font = \`bold \${canvas.width * 0.06}px "Tajawal", "Cairo", sans-serif\`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.shadowColor = 'rgba(255, 255, 255, 0.9)';
      ctx.shadowBlur = 10;
      ctx.fillText(brandName, lx !== undefined ? 40 : padding, ly !== undefined ? ly : padding);
      ctx.shadowColor = 'transparent';
      resolve(canvas.toDataURL('image/jpeg', 0.95));
    } else {
      resolve(canvas.toDataURL('image/jpeg', 0.95));
    }
  };`;

const handleGenerateStart = 534;
const handleGenerateEnd = 607;
const handleGenerateNew = `  const handleGenerate = async () => {
    if (!base64Image) {
      toast.error("الرجاء رفع صورة للمنتج من الأمام أولاً");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // 1. Generate Front Image
      const frontPrompt = \`Model is facing forward, natural candid pose, smiling. \${stylePrompt}\`;
      let frontUrl = "";
      
      const resFront = await fetch('/api/generate/base64', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'ready_to_generate',
          garmentImage: base64Image,
          modelImage: base64ModelImage,
          modelType,
          category,
          style: frontPrompt,
        })
      });
      
      let dataFront = await resFront.json();
      if (dataFront.id && dataFront.status === 'processing') {
        toast.success("تم بدء توليد صورة الأمام، يرجى الانتظار...", { duration: 5000 });
        dataFront = await pollStatus(dataFront.id);
      }
      
      if (dataFront.error) throw new Error(dataFront.error);
      frontUrl = dataFront.imageUrl;

      // 2. Generate Back Image (if provided)
      let backUrl = "";
      if (base64BackImage) {
        toast.success("تم توليد الأمام، جاري توليد الخلف...", { duration: 5000 });
        const backPrompt = \`Model is facing backwards, walking away from the camera, showing the BACK of the garment. \${stylePrompt}\`;
        const resBack = await fetch('/api/generate/base64', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'ready_to_generate',
            garmentImage: base64BackImage,
            modelImage: base64ModelImage,
            modelType,
            category,
            style: backPrompt,
          })
        });
        
        let dataBack = await resBack.json();
        if (dataBack.id && dataBack.status === 'processing') {
          dataBack = await pollStatus(dataBack.id);
        }
        if (dataBack.error) throw new Error(dataBack.error);
        backUrl = dataBack.imageUrl;
      }

      // 3. Assemble and Overlay
      toast.success("تم التوليد! جاري تجميع التصميم النهائي...");
      const finalImageUrl = await applyCatalogueOverlay(frontUrl, backUrl, sizes, productCode, marketingDesc);
      
      const firebaseItem = { 
        cleanUrl: frontUrl,
        backUrl: backUrl || null,
        sizes, 
        sku: productCode, 
        desc: marketingDesc,
        userId: auth?.currentUser?.uid || 'anonymous',
        createdAt: serverTimestamp()
      };
      let docId = Math.random().toString();
      if (db) {
        try {
          addDoc(collection(db, "generated_images"), firebaseItem).catch(e => console.error("Firebase err", e));
        } catch (e) { console.error("Firebase err", e); }
      }
      
      const finalItem = { id: docId, cleanUrl: frontUrl, backUrl, previewUrl: finalImageUrl, sizes, sku: productCode, desc: marketingDesc, createdAt: new Date() };
      
      setGalleryImages(prev => [finalItem, ...prev]);
      try {
        const existing = JSON.parse(localStorage.getItem('ai_fashion_generated_images') || '[]');
        localStorage.setItem('ai_fashion_generated_images', JSON.stringify([finalItem, ...existing].slice(0, 10)));
      } catch(e) {}
      
      toast.success("تم التوليد والتصميم بنجاح! 🚀");
      setShowGallery(true);
      
    } catch (e: any) {
      setError(e.message || "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };`;

lines.splice(handleGenerateStart, handleGenerateEnd - handleGenerateStart + 1, handleGenerateNew);
lines.splice(applyOverlayStart, applyOverlayEnd - applyOverlayStart + 1, applyOverlayNew);

fs.writeFileSync('app/(dashboard)/dashboard/products/new/page.tsx', lines.join('\n'));
console.log("Rewrote functions successfully");
