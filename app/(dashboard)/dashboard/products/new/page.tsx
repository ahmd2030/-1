"use client";

import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import React, { useState, useEffect, useRef } from "react";
import { Upload, Image as ImageIcon, Loader2, Sparkles, X, UserSquare2, Type, Download, ExternalLink, RefreshCw, Camera, Printer, FileArchive , Edit3, Columns} from 'lucide-react';
import { toast } from "sonner";
import { db, auth } from "@/lib/firebase/config";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function AIStudioPage() {
  const [file, setFile] = useState<File | null>(null);
  const [queue, setQueue] = useState<File[]>([]);
  const [queueStatus, setQueueStatus] = useState<{status: string, error?: string}[]>([]);
  const [processingIndex, setProcessingIndex] = useState<number>(-1);
  const [isBulkMode, setIsBulkMode] = useState<boolean>(false);

  const [base64Image, setBase64Image] = useState<string | null>(null);
  
  const [modelFile, setModelFile] = useState<File | null>(null);
  const [base64ModelImage, setBase64ModelImage] = useState<string | null>(null);

  const [modelType, setModelType] = useState<string>("toddler boy");
  const [category, setCategory] = useState<string>("tops");
  const [garmentDirection, setGarmentDirection] = useState<string>("front");
  
  const [stylePrompt, setStylePrompt] = useState<string>("A beautiful cobblestone street in Paris, blurred cafe tables in the background, autumn leaves falling, soft cinematic sunlight. Natural candid walking pose, smiling.");
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [generateMarketingDesc, setGenerateMarketingDesc] = useState<boolean>(false);
  const [marketingDesc, setMarketingDesc] = useState<string>('');
  
  const [catalogueMode, setCatalogueMode] = useState<boolean>(true);
  const [brandName, setBrandName] = useState<string>("Baby Rose");
  const [base64Logo, setBase64Logo] = useState<string | null>(null);
  
  const [productCode, setProductCode] = useState<string>("");
  const [sizes, setSizes] = useState<string>("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [showGallery, setShowGallery] = useState(false);
  const [galleryImages, setGalleryImages] = useState<any[]>([]);
  const [editingItem, setEditingItem] = useState<any>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('ai_fashion_generated_images') || '[]');
      const normalized = stored.map((item: any) => {
        if (typeof item === 'string') {
          return { id: Math.random().toString(), cleanUrl: item, previewUrl: item, sizes: '', sku: '', desc: '' };
        }
        return item;
      });
      setGalleryImages(normalized);
    } catch(e) {}
  }, []); // Fixed race condition that erased RAM images when storage is full

  const resizeImageForAnalysis = (dataUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 1200; // Increased to preserve text readability for Gemini
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        } catch (e) {
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    if (e.target.files.length > 1) {
      setIsBulkMode(true);
      setQueue(Array.from(e.target.files));
        setQueueStatus(Array.from(e.target.files).map(() => ({ status: 'waiting' })));
      setFile(e.target.files[0]);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) setBase64Image(event.target.result as string);
      };
      reader.readAsDataURL(e.target.files[0]);
      toast.success(`تم إضافة ${e.target.files.length} صور للطابور. اضغط زر التوليد الجماعي للبدء!`);
    } else {
      setIsBulkMode(false);
      setQueue([]);
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      const reader = new FileReader();
      reader.onload = async (event) => {
        if (event.target?.result) {
          const b64 = event.target.result as string;
          setBase64Image(b64);
          analyzeGarment(b64);
        }
      };
      reader.readAsDataURL(selectedFile);
    }
  };
  
  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setBase64Logo(event.target.result as string);
        toast.success("تم رفع الشعار بنجاح! سيتم ختمه على جميع الصور.");
      }
    };
    reader.readAsDataURL(e.target.files[0]);
  };
  
  const analyzeGarment = async (b64: string) => {
    setIsAnalyzing(true);
    setStylePrompt("جاري تحليل القطعة بالذكاء الاصطناعي لاستخراج البيانات وابتكار خلفية (يستغرق بضع ثوان)...");
    setError(null);
    try {
      const optimizedImage = await resizeImageForAnalysis(b64);
      
      const res = await fetch('/api/analyze-garment', {
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
        }

      if (data.suggestion) {
        setStylePrompt(data.suggestion);
        if (data.size && data.size.trim().length > 0) setSizes(data.size);
        if (data.sku && data.sku.trim().length > 0) setProductCode(data.sku);
        if (data.marketing_desc && data.marketing_desc.trim().length > 0) setMarketingDesc(data.marketing_desc);
        toast.success("تم ابتكار خلفية جديدة واستخراج البيانات بنجاح!");
      }
    } catch(e: any) {
      console.error(e);
      setStylePrompt("A beautiful cobblestone street in Paris, blurred cafe tables in the background, autumn leaves falling, soft cinematic sunlight. Natural candid walking pose, smiling.");
      toast.error("خطأ: " + (e.message || "تعذر التحليل"));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleModelFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const selectedFile = e.target.files[0];
    setModelFile(selectedFile);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) setBase64ModelImage(event.target.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  const applyCatalogueOverlay = (imageUrl: string, customSizes?: string, customCode?: string, customDesc?: string): Promise<string> => {
    return new Promise((resolve) => {
      if (!catalogueMode || !canvasRef.current) {
        resolve(imageUrl);
        return;
      }
      
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(imageUrl);
      
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          
          const padding = img.width * 0.05;
          
          const finishDrawingText = () => {
            try {
              ctx.fillStyle = "#1e293b"; 
              ctx.font = `bold ${img.width * 0.05}px Arial, sans-serif`;
              ctx.textAlign = "right";
              ctx.textBaseline = "top";
              ctx.shadowBlur = 0; 
              if (customCode || productCode) ctx.fillText(customCode || productCode, img.width - padding, padding);
              
              ctx.fillStyle = "#475569"; 
              ctx.font = `bold ${img.width * 0.035}px Arial, sans-serif`;
              if (customSizes || sizes) {
                  const sizeArray = (customSizes || sizes).split(/[,/|،\n]/).map(s => s.trim()).filter(Boolean);
                                let sizeY = padding + (img.width * 0.06);
                  sizeArray.forEach(sizeLine => {
                    ctx.fillText(sizeLine, img.width - padding, sizeY);
                    sizeY += (img.width * 0.045);
                  });
                }
                
                if (customDesc || marketingDesc) {
                  ctx.font = `bold ${img.width * 0.04}px "Tajawal", "Cairo", sans-serif`;
                  ctx.fillStyle = '#1e293b';
                  ctx.textAlign = 'center';
                  ctx.direction = 'rtl';
                  
                  // Word wrap for Arabic
                  const words = (customDesc || marketingDesc).split(' ');
                  let line = '';
                  let y = canvas.height - (img.width * 0.15); // Bottom margin
                  
                  ctx.shadowColor = 'rgba(255, 255, 255, 0.9)';
                  ctx.shadowBlur = 15;
                  ctx.shadowOffsetX = 0;
                  ctx.shadowOffsetY = 0;

                  for (let n = 0; n < words.length; n++) {
                    const testLine = line + words[n] + ' ';
                    const metrics = ctx.measureText(testLine);
                    if (metrics.width > canvas.width - (padding * 2) && n > 0) {
                      ctx.fillText(line, canvas.width / 2, y);
                      line = words[n] + ' ';
                      y += (img.width * 0.05);
                    } else {
                      line = testLine;
                    }
                  }
                  ctx.fillText(line, canvas.width / 2, y);
                  ctx.shadowColor = 'transparent';
                }
              
              resolve(canvas.toDataURL('image/jpeg', 0.95));
            } catch(e) {
              console.error("Canvas CORS/Text issue", e);
              resolve(imageUrl); 
            }
          };
          
          if (base64Logo) {
            const logoImg = new Image();
            logoImg.onload = () => {
              try {
                const logoWidth = img.width * 0.20; 
                const aspect = logoImg.height / logoImg.width;
                const logoHeight = logoWidth * aspect;
                
                ctx.shadowColor = "rgba(255,255,255,0.7)";
                ctx.shadowBlur = 15;
                ctx.drawImage(logoImg, padding, padding, logoWidth, logoHeight);
                ctx.shadowBlur = 0;
                
                finishDrawingText();
              } catch(e) { finishDrawingText(); }
            };
            logoImg.onerror = () => {
              finishDrawingText();
            };
            logoImg.src = base64Logo;
          } else {
            try {
              ctx.fillStyle = "#ff6b81"; 
              ctx.font = `italic bold ${img.width * 0.08}px Georgia, serif`;
              ctx.textAlign = "left";
              ctx.textBaseline = "top";
              ctx.shadowColor = "rgba(255,255,255,0.8)";
              ctx.shadowBlur = 10;
              if (brandName) ctx.fillText(brandName, padding, padding);
              
              finishDrawingText();
            } catch(e) { finishDrawingText(); }
          }
        } catch (e) {
          console.error("Canvas outer issue", e);
          resolve(imageUrl);
        }
      };
      
      img.onerror = () => resolve(imageUrl);
      img.src = imageUrl;
    });
  };

  
  const processQueue = async () => {
    if (queue.length === 0) return;
    setLoading(true);
    setProcessingIndex(0);
    setShowGallery(true);
    
    let currentGallery = [...galleryImages];
    
    for (let i = 0; i < queue.length; i++) {
      setProcessingIndex(i);
        setQueueStatus(prev => prev.map((s, idx) => idx === i ? { status: 'analyzing' } : s));
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
          ? `Model is facing backwards, walking away from the camera, showing the BACK of the garment. ${genPrompt}`
          : genPrompt;
          
        setQueueStatus(prev => prev.map((s, idx) => idx === i ? { status: 'generating' } : s));
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
        
        let genData = await genRes.json();
        
        if (genData.id && genData.status === 'processing') {
          genData = await pollStatus(genData.id);
        }

        if (genData.imageUrl) {
          const finalImageUrl = await applyCatalogueOverlay(genData.imageUrl, genSizes, genSku, genDesc);
            const firebaseItem = { 
              cleanUrl: genData.imageUrl, 
              sizes: genSizes, 
              sku: genSku, 
              desc: genDesc,
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
            const finalItem = { id: docId, cleanUrl: genData.imageUrl, previewUrl: finalImageUrl, sizes: genSizes, sku: genSku, desc: genDesc, createdAt: new Date() };
            currentGallery = [finalItem, ...currentGallery];
            setGalleryImages([...currentGallery]);
            try {
              localStorage.setItem('ai_fashion_generated_images', JSON.stringify(currentGallery.slice(0, 10)));
            } catch(e) {}
            setQueueStatus(prev => prev.map((s, idx) => idx === i ? { status: 'done' } : s));
          } else if (genData.error) {
            throw new Error(genData.error);
          }
      } catch (err) {
        console.error("Error processing item", i, err);
          setQueueStatus(prev => prev.map((s, idx) => idx === i ? { status: 'error', error: (err as Error).message || "فشلت العملية" } : s));
        }
    }
    
    setLoading(false);
    setProcessingIndex(-1);
    setIsBulkMode(false);
    setQueue([]);
    toast.success("تم الانتهاء من التوليد الجماعي!");
  };

  
  const createCollage = async () => {
    if (galleryImages.length < 2) {
      toast.error("يجب أن يكون لديك صورتين على الأقل في المعرض لدمجهما!");
      return;
    }
    toast.info("جاري دمج أول صورتين...");
    try {
      const img1Obj = galleryImages[0];
      const img2Obj = galleryImages[1];
      
      const url1 = typeof img1Obj === 'string' ? img1Obj : img1Obj.previewUrl;
      const url2 = typeof img2Obj === 'string' ? img2Obj : img2Obj.previewUrl;
      
      const loadImage = (src: string): Promise<HTMLImageElement> => {
        return new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => resolve(img);
          img.src = src;
        });
      };
      
      const i1 = await loadImage(url1);
      const i2 = await loadImage(url2);
      
      const canvas = document.createElement('canvas');
      canvas.width = i1.width + i2.width;
      canvas.height = Math.max(i1.height, i2.height);
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(i1, 0, 0, i1.width, i1.height);
      ctx.drawImage(i2, i1.width, 0, i2.width, i2.height);
      
      const finalBase64 = canvas.toDataURL('image/jpeg', 0.9);
      
      const newItem = {
        id: Math.random().toString(),
        cleanUrl: finalBase64,
        previewUrl: finalBase64,
        sizes: typeof img1Obj === 'string' ? '' : img1Obj.sizes,
        sku: typeof img1Obj === 'string' ? '' : img1Obj.sku,
        desc: typeof img1Obj === 'string' ? '' : img1Obj.desc
      };
      
      const updatedGallery = [newItem, ...galleryImages];
      setGalleryImages(updatedGallery);
      try {
        localStorage.setItem('ai_fashion_generated_images', JSON.stringify(updatedGallery));
      } catch(e) {}
      
      toast.success("تم دمج الصورتين بنجاح!");
    } catch(err) {
      console.error(err);
      toast.error("فشل دمج الصورتين");
    }
  };

  async function pollStatus(id: string, provider: string = "fashn"): Promise<any> {
    let attempts = 0;
    let lastError = '';
    while (attempts < 120) { // 6 minutes maximum
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      if (attempts === 15) {
        toast("لا زال التوليد مستمراً، الخوادم مزدحمة قليلاً اليوم...", { icon: '⏳', duration: 4000 });
      } else if (attempts === 30) {
        toast("الرجاء الانتظار، الذكاء الاصطناعي يقوم ببناء تفاصيل واقعية جداً...", { icon: '🎨', duration: 4000 });
      } else if (attempts === 60) {
        toast("التوليد يأخذ وقتاً أطول من المعتاد بسبب الضغط على السيرفرات العالمية...", { icon: '🌍', duration: 4000 });
      }

      try {
        const statusRes = await fetch(`/api/generate/status?id=${id}&provider=${provider}&t=${Date.now()}`, { cache: 'no-store' });
        if (!statusRes.ok) {
          const text = await statusRes.text();
          console.error("Status route failed:", text);
          throw new Error(`Server Error: ${statusRes.status}`);
        }
        
        const data = await statusRes.json();
        if (data.status === 'completed' && data.imageUrl) {
          return data;
        }
        if (data.status === 'failed' || data.error) {
          throw new Error(data.error || 'Generation failed'); // Throwing here allows the caller's try-catch to show the error
        }
      } catch (err: any) {
        if (err.message && err.message !== 'Generation failed' && !err.message.includes('Server Error')) {
            throw err;
        }
        lastError = err.message;
        console.warn("Poll attempt failed, retrying...", err);
      }
      attempts++;
    }
    throw new Error(lastError || "Generation timed out after 6 minutes.");
  }

  const handleGenerate = async () => {
    if (!base64Image) {
      toast.error("الرجاء رفع صورة للمنتج أولاً");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const finalPrompt = garmentDirection === 'back' 
        ? `Model is facing backwards, walking away from the camera, showing the BACK of the garment. ${stylePrompt}`
        : stylePrompt;

      let humanUrl = base64ModelImage;
      
      // Step 1: Generate Human Model (if no model provided)
      if (!humanUrl) {
        toast.success("يتم الآن تصميم العارض البشري (المرحلة 1 من 2)...", { duration: 4000 });
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
      toast.success("يتم الآن إلباس العارض وتطبيق الإضاءة (المرحلة 2 من 2)... قد يستغرق الأمر بضع دقائق إذا كان الخادم في وضع السكون.", { duration: 8000 });
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
        toast.success("تم التوليد، جاري تصميم غلاف الكتالوج...");
        // Replicate sometimes returns URLs that cause Canvas CORS issues, proxy it
        let safeImageUrl = data.imageUrl;
        try {
           // We can just use the original URL, if it fails canvas error handler will catch it
        } catch(e) {}
        
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
          
          let currentGallery = galleryImages || [];
          currentGallery = [finalItem, ...currentGallery];
          setGalleryImages([...currentGallery]);
          try {
            localStorage.setItem('ai_fashion_generated_images', JSON.stringify(currentGallery.slice(0, 10)));
          } catch(e) {}
          
          toast.success("تم الحفظ بنجاح!");
      }
    } catch (e: any) {
      setError(e.message || "حدث خطأ غير متوقع");
      toast.error("فشل التوليد");
    } finally {
      setLoading(false);
    }
  };

    const downloadAllAsZip = async () => {
    if (galleryImages.length === 0) return;
    const zip = new JSZip();
    
    for (let i = 0; i < galleryImages.length; i++) {
      const url = typeof galleryImages[i] === 'string' ? galleryImages[i] : galleryImages[i].previewUrl;
      const response = await fetch(url);
      const blob = await response.blob();
      zip.file(`catalogue-${i+1}.jpg`, blob);
    }
    
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, 'Fashion-Catalogue.zip');
  };

  const printGalleryAsCatalogue = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const htmlContent = `
      <html>
        <head>
          <title>كتالوج المبيعات - ${new Date().toLocaleDateString()}</title>
          <style>
            body { font-family: sans-serif; margin: 0; padding: 20px; background: white; }
            .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
            img { width: 100%; height: auto; border-radius: 8px; break-inside: avoid; margin-bottom: 20px; }
            @media print {
              .no-print { display: none; }
              @page { size: A4 portrait; margin: 1cm; }
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="text-align:center; padding: 20px; background: #f8fafc; margin-bottom: 20px;">
            <button onclick="window.print()" style="padding: 10px 20px; font-size: 18px; font-weight: bold; background: #4f46e5; color: white; border: none; border-radius: 8px; cursor: pointer;">
              🖨️ اضغط هنا للطباعة أو الحفظ كـ PDF
            </button>
          </div>
          <div class="grid">
            ${galleryImages.map(img => `<img src="${typeof img === 'string' ? img : img.previewUrl}" />`).join('')}
          </div>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="flex relative min-h-[calc(100vh-5rem)] max-w-6xl mx-auto rounded-2xl overflow-hidden border bg-white shadow-lg">
      
      <canvas ref={canvasRef} className="hidden" />

      <div className="flex flex-col flex-1 relative min-w-0 bg-slate-50">
        
        <div className="bg-slate-900 text-white px-6 py-5 flex flex-row-reverse justify-between items-center z-10 shadow-md">
          <div className="flex items-center gap-3">
            <div className="text-right">
              <h2 className="font-bold text-xl">استوديو الماركة (إصدار المبيعات)</h2>
              <p className="text-sm text-slate-400 mt-1">ذكاء اصطناعي فائق + إدارة الكتالوج</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-indigo-300" />
            </div>
          </div>
          <div className="flex items-center gap-3 flex-row-reverse">
            <button 
              onClick={() => setShowGallery(!showGallery)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm font-bold transition-all shadow-sm"
            >
              <ImageIcon className="w-5 h-5" />
              <span>معرض المبيعات</span>
              {galleryImages.length > 0 && (
                <span className="bg-indigo-500 text-white text-xs px-2 py-0.5 rounded-full">{galleryImages.length}</span>
              )}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 flex justify-center">
          <div className="max-w-2xl w-full space-y-8">
            
            <div className="bg-white p-6 rounded-2xl border shadow-sm">
              <h3 className="font-bold text-lg text-slate-800 text-right mb-4 flex items-center justify-end gap-2">
                <span>الصورة الأصلية للمنتج</span>
                <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm">1</span>
              </h3>
              
              {!base64Image ? (
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-10 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative">
                  <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileSelect}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  <Upload className="w-10 h-10 text-slate-400 mb-3" />
                  <p className="font-medium text-slate-600">اضغط هنا لرفع صورة المنتج</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative rounded-xl overflow-hidden border group">
                    <img src={base64Image} alt="Uploaded product" className="w-full h-64 object-contain bg-slate-50" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <label className="bg-white text-slate-900 px-4 py-2 rounded-lg font-bold cursor-pointer hover:bg-slate-200">
                        تغيير الصورة
                        <input type="file" accept="image/*" multiple onChange={handleFileSelect} className="hidden" />
                      </label>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setGarmentDirection('back')}
                        className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${garmentDirection === 'back' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border'}`}
                      >
                        من الخلف (ظهر)
                      </button>
                      <button 
                        onClick={() => setGarmentDirection('front')}
                        className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${garmentDirection === 'front' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border'}`}
                      >
                        من الأمام
                      </button>
                    </div>
                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      زاوية القطعة
                      <Camera className="w-4 h-4 text-slate-400" />
                    </label>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-2xl border border-indigo-100 shadow-sm relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl"></div>
              
              <div className="flex items-center justify-between mb-6 flex-row-reverse relative z-10">
                <h3 className="font-bold text-lg text-indigo-900 flex items-center gap-2">
                  <span>ختم الهوية وتصميم الكتالوج</span>
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm"><Type className="w-3 h-3" /></span>
                </h3>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={catalogueMode} onChange={e => setCatalogueMode(e.target.checked)} className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
              
              {catalogueMode && (
                <div className="space-y-4 text-right relative z-10 animate-in fade-in slide-in-from-top-4">
                  <p className="text-sm text-indigo-700/80 mb-4">أضف شعارك الرسمي. سيقوم النظام باستخراج المقاس ورقم المنتج تلقائياً من الصورة (إن وجد).</p>
                  
                  <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm flex flex-row-reverse items-center justify-between">
                    <div className="text-right">
                      <label className="block text-sm font-bold text-slate-800 mb-1">الشعار الرسمي (Logo)</label>
                      <p className="text-xs text-slate-500">ارفع ملف PNG ليتم وضعه كعلامة مائية</p>
                    </div>
                    {base64Logo ? (
                      <div className="flex items-center gap-3">
                        <img src={base64Logo} className="h-10 object-contain" alt="Logo" />
                        <button onClick={() => setBase64Logo(null)} className="text-xs text-red-500 font-bold bg-red-50 px-2 py-1 rounded">حذف</button>
                      </div>
                    ) : (
                      <label className="cursor-pointer bg-indigo-100 text-indigo-700 hover:bg-indigo-200 px-4 py-2 rounded-lg text-sm font-bold transition-colors">
                        رفع الشعار
                        <input type="file" accept="image/png,image/jpeg" onChange={handleLogoSelect} className="hidden" />
                      </label>
                    )}
                  </div>

                  {!base64Logo && (
                    <div className="mt-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">اسم الماركة (يظهر بخط أنيق)</label>
                      <input type="text" value={brandName} onChange={e=>setBrandName(e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-300 text-left" dir="ltr" />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">المقاسات (مستخرج آلياً)</label>
                      <textarea value={sizes} onChange={e=>setSizes(e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-300 text-left resize-none h-[42px] focus:h-24 transition-all" dir="ltr" placeholder="S.M.L 
2-5 Years" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">رمز المنتج (مستخرج آلياً)</label>
                      <input type="text" value={productCode} onChange={e=>setProductCode(e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-300 text-left" dir="ltr" placeholder="BR-2024" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white p-6 rounded-2xl border shadow-sm">
              <h3 className="font-bold text-lg text-slate-800 text-right mb-4 flex items-center justify-end gap-2">
                <span>(اختياري) وضع العارض المطابق للكتالوج</span>
                <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-sm"><UserSquare2 className="w-4 h-4" /></span>
              </h3>
              
              {!base64ModelImage ? (
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleModelFileSelect}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <UserSquare2 className="w-8 h-8 text-slate-400 mb-2" />
                  <p className="font-medium text-slate-600">ارفع صورة العارض (من الكتالوج المرجعي الخاص بك)</p>
                </div>
              ) : (
                <div className="relative rounded-xl overflow-hidden border group">
                  <img src={base64ModelImage} alt="Model Reference" className="w-full h-64 object-contain bg-slate-50" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                    <button onClick={() => setBase64ModelImage(null)} className="bg-red-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-red-600">
                      إزالة الصورة
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className={`bg-white p-6 rounded-2xl border shadow-sm transition-opacity ${base64ModelImage ? 'opacity-50 pointer-events-none' : ''}`}>
              <h3 className="font-bold text-lg text-slate-800 text-right mb-4 flex items-center justify-end gap-2">
                <span>إعدادات العارض والذكاء الاصطناعي</span>
                <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm">3</span>
              </h3>
              
              <div className="space-y-6 text-right">
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-3">نوع القطعة المرفوعة</label>
                  <div className="flex flex-row-reverse gap-3">
                    {[
                      { id: 'tops', label: 'قطعة علوية / جاكيت' },
                      { id: 'bottoms', label: 'بنطلون / تنورة' },
                      { id: 'one-pieces', label: 'فستان / طقم كامل' }
                    ].map(type => (
                      <button
                        key={type.id}
                        onClick={() => setCategory(type.id)}
                        className={`flex-1 py-3 rounded-xl border-2 font-medium transition-all ${
                          category === type.id 
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                            : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                                <div className="flex items-center justify-between bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 mb-6 mt-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="relative">
                    <input type="checkbox" className="sr-only" checked={generateMarketingDesc} onChange={(e) => setGenerateMarketingDesc(e.target.checked)} />
                    <div className={`block w-10 h-6 rounded-full transition-colors ${generateMarketingDesc ? 'bg-emerald-600' : 'bg-slate-300'}`}></div>
                    <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${generateMarketingDesc ? 'translate-x-4' : ''}`}></div>
                  </div>
                  <span className="text-sm font-bold text-emerald-900">توليد وصف تسويقي آلي (العربية) على الصورة</span>
                </label>
              </div>

                <label className="block text-sm font-bold text-slate-700 mb-3">عمر وجنس العارض (مهم جداً)</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3" dir="rtl">
                    {[
                        { id: 'baby girl', label: 'طفلة (9 أشهر)' },
                        { id: 'baby boy', label: 'طفل (9 أشهر)' },
                        { id: 'toddler girl', label: 'بنت صغيرة (3 سنوات)' },
                        { id: 'toddler boy', label: 'ولد صغير (3 سنوات)' },
                        { id: 'young girl', label: 'بنت (6-12 سنة)' },
                        { id: 'young boy', label: 'ولد (6-12 سنة)' },
                        { id: 'teen girl', label: 'شابة (16 سنة)' },
                        { id: 'teen boy', label: 'شاب (16 سنة)' },
                        { id: 'woman', label: 'امرأة' },
                        { id: 'man', label: 'رجل' }
                      ].map(type => (
                      <button
                        key={type.id}
                        onClick={() => setModelType(type.id)}
                        className={`py-3 px-2 rounded-xl border-2 font-medium text-sm transition-all ${
                          modelType === type.id 
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                            : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative">
                  <div className="flex items-center justify-between mb-3 flex-row-reverse">
                    <label className="block text-sm font-bold text-slate-700">ديكور الخلفية (توليد ذكي)</label>
                    {base64Image && (
                      <button 
                        onClick={() => analyzeGarment(base64Image)}
                        disabled={isAnalyzing}
                        className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
                        <span>تحليل القطعة وابتكار ديكور فريد</span>
                      </button>
                    )}
                  </div>
                  
                  <div className="relative">
                    <textarea
                      value={stylePrompt}
                      onChange={(e) => setStylePrompt(e.target.value)}
                      dir="ltr"
                      disabled={isAnalyzing}
                      className={`w-full h-32 p-4 rounded-xl border focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none text-sm leading-relaxed ${
                        isAnalyzing ? 'bg-indigo-50/50 border-indigo-200 text-indigo-400' : 'border-slate-300'
                      }`}
                    />
                    {isAnalyzing && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 rounded-xl backdrop-blur-[1px]">
                        <Loader2 className="w-6 h-6 text-indigo-600 animate-spin mb-2" />
                        <span className="text-sm font-bold text-indigo-800">جاري تحليل القطعة وابتكار الخلفية...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            
            {isBulkMode && queue.length > 0 && (
              <div className="bg-white p-4 rounded-xl border border-slate-200 mb-6 space-y-2 max-h-60 overflow-y-auto" dir="rtl">
                 <h4 className="font-bold text-slate-800 mb-3">طابور التوليد ({queue.length} صور)</h4>
                 {queue.map((file, i) => (
                    <div key={i} className="flex justify-between items-center text-sm p-3 bg-slate-50 rounded-lg border border-slate-100">
                       <span className="truncate w-40 font-medium text-slate-600" dir="ltr">{file.name}</span>
                       <span className="text-left">
                         {(!queueStatus[i] || queueStatus[i].status === 'waiting') && <span className="text-slate-400 font-bold">في الانتظار ⏳</span>}
                         {queueStatus[i]?.status === 'analyzing' && <span className="text-blue-500 font-bold flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin"/> يقرأ المقاس...</span>}
                         {queueStatus[i]?.status === 'generating' && <span className="text-indigo-500 font-bold flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin"/> يرسم الموديل...</span>}
                         {queueStatus[i]?.status === 'done' && <span className="text-emerald-500 font-bold">اكتملت ✅</span>}
                         {queueStatus[i]?.status === 'error' && <span className="text-red-500 font-bold" title={queueStatus[i]?.error}>فشلت ❌</span>}
                       </span>
                    </div>
                 ))}
              </div>
            )}

              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 text-right font-medium text-sm">
                ❌ {error}
              </div>
            )}

            <button
              onClick={isBulkMode ? processQueue : handleGenerate}
              disabled={loading || !base64Image || isAnalyzing}
              className={`w-full py-5 rounded-2xl font-bold text-lg text-white shadow-xl flex items-center justify-center gap-3 transition-all ${
                loading || !base64Image || isAnalyzing
                  ? 'bg-slate-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 hover:scale-[1.02]'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>{isBulkMode && processingIndex >= 0 ? `جاري معالجة الصورة ${processingIndex + 1} من ${queue.length}...` : 'جاري التوليد (قد يستغرق 3 دقائق)...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-6 h-6" />
                  <span>{isBulkMode ? `بدء التوليد الجماعي لـ ${queue.length} صور 🚀` : 'بدء التصميم وإنشاء صفحة الكتالوج!'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {showGallery && (
        <div className="w-96 bg-white border-l shadow-2xl flex flex-col z-20 absolute left-0 top-0 bottom-0 animate-in slide-in-from-left-8">
          <div className="p-5 bg-slate-900 text-white flex flex-col gap-4 shadow-md">
            <div className="flex flex-row-reverse justify-between items-center w-full">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-lg">كتالوج المبيعات</h3>
              </div>
              <button onClick={() => setShowGallery(false)} className="hover:bg-slate-800 p-2 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            {galleryImages.length > 0 && (
              <div className="flex flex-col gap-2">
              <button 
                onClick={createCollage}
                className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 py-3 rounded-xl font-bold text-sm transition-colors mb-2 shadow-lg"
              >
                <Columns className="w-4 h-4" />
                دمج أول صورتين معاً (للكتالوج)
              </button>
              <button 
                onClick={printGalleryAsCatalogue}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 py-3 rounded-xl font-bold text-sm transition-colors"
              >
                <Printer className="w-4 h-4" />
                تحميل الكتالوج كـ PDF
              </button>
              <button 
                onClick={downloadAllAsZip}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 py-3 rounded-xl font-bold text-sm transition-colors mt-2"
              >
                <FileArchive className="w-4 h-4" />
                تحميل جميع الصور (ZIP)
              </button>
                <button 
                  onClick={() => {
                    if(confirm('هل أنت متأكد من مسح جميع الصور المعلقة من المعرض الجانبي؟')) {
                      setGalleryImages([]);
                      localStorage.removeItem('ai_fashion_generated_images');
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-rose-100 text-rose-700 hover:bg-rose-200 py-2 rounded-xl font-bold text-xs transition-colors shadow-sm mt-2"
                >
                  مسح المعرض الجانبي
                </button>
                          </div>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-slate-50">
            {galleryImages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                <ImageIcon className="w-12 h-12 mb-3 opacity-20" />
                <p className="text-sm font-medium">لا توجد صور مولدة بعد</p>
              </div>
            ) : (
              galleryImages.map((item, i) => {
                const isLegacy = typeof item === 'string';
                const pUrl = isLegacy ? item : item.previewUrl;
                return (
                  <div key={i} className="bg-white p-2 rounded-2xl shadow-sm border group relative">
                    <img src={pUrl} className="w-full h-auto rounded-xl" alt="Generated" />
                    <div className="absolute inset-2 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex flex-col items-center justify-center gap-3">
                      <a href={pUrl} download={`catalogue-${i}.jpg`} className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg flex items-center gap-2">
                        <Download className="w-4 h-4" /> تحميل
                      </a>
                      {!isLegacy && (
                        <button onClick={() => setEditingItem(item)} className="px-5 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-lg flex items-center gap-2">
                          <Edit3 className="w-4 h-4" /> تعديل النصوص
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
