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
  const [base64BackImage, setBase64BackImage] = useState<string | null>(null);
  
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
  
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  
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
        if (data.model_type && data.model_type.trim().length > 0) setModelType(data.model_type);
        if (data.garment_category && data.garment_category.trim().length > 0) setCategory(data.garment_category);
        toast.success("تم ابتكار خلفية واستخراج البيانات والمقاسات بنجاح!");
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

  const applyCatalogueOverlay = (frontUrl: string, backUrl?: string, customSizes?: string, customCode?: string, customDesc?: string): Promise<string> => {
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
              ctx.font = `bold 40px Arial, sans-serif`;
              ctx.textAlign = "right";
              ctx.textBaseline = "top";
              if (customCode || productCode) {
                 ctx.fillText(customCode || productCode, canvas.width - padding, padding + 100);
              }
              
              ctx.fillStyle = "#475569"; 
              ctx.font = `bold 30px Arial, sans-serif`;
              if (customSizes || sizes) {
                 const sizeArray = (customSizes || sizes).split(/[,/|،\n]/).map(s => s.trim()).filter(Boolean);
                 let sizeY = padding + 160;
                 sizeArray.forEach(sizeLine => {
                    ctx.fillText(sizeLine, canvas.width - padding, sizeY);
                    sizeY += 40;
                 });
              }

              if (customDesc || marketingDesc) {
                  ctx.font = `bold 35px "Tajawal", "Cairo", sans-serif`;
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
    ctx.font = `bold ${imgWidth * 0.05}px Arial, sans-serif`;
    ctx.textAlign = "right";
    ctx.textBaseline = "top";
    if (customCode || productCode) ctx.fillText(customCode || productCode, imgWidth - padding, padding);
    
    ctx.fillStyle = "#475569"; 
    ctx.font = `bold ${imgWidth * 0.035}px Arial, sans-serif`;
    if (customSizes || sizes) {
        const sizeArray = (customSizes || sizes).split(/[,/|،\n]/).map(s => s.trim()).filter(Boolean);
        let sizeY = padding + (imgWidth * 0.06);
        sizeArray.forEach(sizeLine => {
          ctx.fillText(sizeLine, imgWidth - padding, sizeY);
          sizeY += (imgWidth * 0.045);
        });
    }
    
    if (customDesc || marketingDesc) {
        ctx.font = `bold ${imgWidth * 0.04}px "Tajawal", "Cairo", sans-serif`;
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
    const defaultPadding = canvas.width * 0.05;
    if (base64Logo) {
      const logoImg = new Image();
      logoImg.crossOrigin = "anonymous";
      logoImg.onload = () => {
        const logoWidth = lw || canvas.width * 0.2;
        const logoHeight = logoImg.height * (logoWidth / logoImg.width);
        const x = lx !== undefined ? lx : defaultPadding;
        const y = ly !== undefined ? ly : defaultPadding;
        
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
      ctx.font = `bold ${canvas.width * 0.06}px "Tajawal", "Cairo", sans-serif`;
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
                addDoc(collection(db, "generated_images"), firebaseItem).catch(e => console.error("Firebase err", e));
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

  async function pollStatus(id: string): Promise<any> {
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
        const statusRes = await fetch(`/api/generate/status?id=${id}&t=${Date.now()}`, { cache: 'no-store' });
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
          throw new Error(data.error || 'Generation failed');
        }
      } catch (err: any) {
        lastError = err.message;
        console.warn("Poll attempt failed, retrying...", err);
      }
      attempts++;
    }
    throw new Error(`Generation timed out. Last error: ${lastError}`);
  };

  const handleGenerate = async () => {
    if (!base64Image) {
      toast.error("الرجاء رفع صورة للمنتج من الأمام أولاً");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // 1. Generate Front Image
      const frontPrompt = `Model is facing forward, natural candid pose, smiling. ${stylePrompt}`;
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
        const backPrompt = `Model is facing backwards, walking away from the camera, showing the BACK of the garment. ${stylePrompt}`;
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
    <div className="min-h-[calc(100vh-5rem)] bg-slate-50/50 p-4 lg:p-8 font-sans relative overflow-hidden" dir="rtl">
      <canvas ref={canvasRef} className="hidden" />

      {/* HEADER */}
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">استوديو الذكاء الاصطناعي</h1>
            <p className="text-slate-500 mt-1 font-medium">تصوير احترافي وإدارة كتالوج المبيعات بضغطة زر</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowGallery(true)} className="px-5 py-2.5 bg-white border border-slate-200 shadow-sm rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-indigo-500" />
            <span>المعرض</span>
            {galleryImages.length > 0 && (
              <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full">{galleryImages.length}</span>
            )}
          </button>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto">
        
        {/* LEFT COLUMN: CONTROLS (Right in RTL) */}
        <div className="w-full lg:w-[400px] xl:w-[450px] flex flex-col gap-5 flex-shrink-0">
          
          {/* STEP 1: Upload */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200/60 transition-all hover:shadow-md">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm">1</span>
              صور المنتج (الأمام والخلف)
            </h2>
            
            <div className="flex gap-4">
              {/* FRONT IMAGE UPLOAD */}
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-500 mb-2 text-center">المنتج من الأمام</label>
                {!base64Image ? (
                  <label className="border-2 border-dashed border-indigo-200 rounded-2xl h-32 flex flex-col items-center justify-center bg-indigo-50/50 hover:bg-indigo-50 transition-colors cursor-pointer group">
                    <input type="file" accept="image/*" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => setBase64Image(ev.target?.result as string);
                        reader.readAsDataURL(file);
                      }
                    }} className="hidden" />
                    <Upload className="w-6 h-6 text-indigo-500 mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold text-indigo-900">رفع الأمام</span>
                  </label>
                ) : (
                  <div className="relative rounded-2xl overflow-hidden border group bg-slate-50 h-32">
                    <img src={base64Image} className="w-full h-full object-contain" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center backdrop-blur-sm gap-2">
                      <label className="text-white text-xs font-bold cursor-pointer hover:underline">
                        تغيير
                        <input type="file" accept="image/*" onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => setBase64Image(ev.target?.result as string);
                            reader.readAsDataURL(file);
                          }
                        }} className="hidden" />
                      </label>
                      <button onClick={() => setBase64Image(null)} className="text-red-300 text-xs font-bold hover:underline">حذف</button>
                    </div>
                  </div>
                )}
              </div>

              {/* BACK IMAGE UPLOAD */}
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-500 mb-2 text-center">المنتج من الخلف (اختياري)</label>
                {!base64BackImage ? (
                  <label className="border-2 border-dashed border-slate-200 rounded-2xl h-32 flex flex-col items-center justify-center bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer group">
                    <input type="file" accept="image/*" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => setBase64BackImage(ev.target?.result as string);
                        reader.readAsDataURL(file);
                      }
                    }} className="hidden" />
                    <Upload className="w-6 h-6 text-slate-400 mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold text-slate-500">رفع الخلف</span>
                  </label>
                ) : (
                  <div className="relative rounded-2xl overflow-hidden border group bg-slate-50 h-32">
                    <img src={base64BackImage} className="w-full h-full object-contain" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center backdrop-blur-sm gap-2">
                      <label className="text-white text-xs font-bold cursor-pointer hover:underline">
                        تغيير
                        <input type="file" accept="image/*" onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => setBase64BackImage(ev.target?.result as string);
                            reader.readAsDataURL(file);
                          }
                        }} className="hidden" />
                      </label>
                      <button onClick={() => setBase64BackImage(null)} className="text-red-300 text-xs font-bold hover:underline">حذف</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* STEP 2: Advanced Settings */}
          <details className="group bg-white rounded-3xl shadow-sm border border-slate-200/60 overflow-hidden">
            <summary className="p-6 text-lg font-bold text-slate-800 cursor-pointer list-none flex items-center justify-between select-none hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-sm group-open:bg-indigo-100 group-open:text-indigo-700 transition-colors">2</span>
                إعدادات الذكاء الاصطناعي (متقدم)
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-open:rotate-180 transition-transform">▼</div>
            </summary>
            <div className="p-6 pt-2 border-t border-slate-100 space-y-6">
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">نوع القطعة المرفوعة</label>
                <div className="flex flex-col sm:flex-row gap-2">
                  {[
                    { id: 'tops', label: 'علوية/جاكيت' },
                    { id: 'bottoms', label: 'بنطلون/تنورة' },
                    { id: 'one-pieces', label: 'فستان/طقم' }
                  ].map(type => (
                    <button key={type.id} onClick={() => setCategory(type.id)} className={`flex-1 py-2.5 rounded-xl border-2 font-bold text-sm transition-all ${category === type.id ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-100 text-slate-500 hover:border-slate-200'}`}>{type.label}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">عمر وجنس العارض</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'baby girl', label: 'طفلة (9أشهر)' }, { id: 'baby boy', label: 'طفل (9أشهر)' },
                    { id: 'toddler girl', label: 'بنت (3سنوات)' }, { id: 'toddler boy', label: 'ولد (3سنوات)' },
                    { id: 'young girl', label: 'بنت (6-12)' }, { id: 'young boy', label: 'ولد (6-12)' },
                    { id: 'woman', label: 'امرأة' }, { id: 'man', label: 'رجل' }
                  ].map(type => (
                    <button key={type.id} onClick={() => setModelType(type.id)} className={`py-2 rounded-xl border-2 font-bold text-xs transition-all ${modelType === type.id ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-100 text-slate-500 hover:border-slate-200'}`}>{type.label}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">ديكور الخلفية والإضاءة</label>
                <textarea value={stylePrompt} onChange={e=>setStylePrompt(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 text-left resize-none h-24 focus:ring-2 focus:ring-indigo-500 transition-all text-sm" dir="ltr" placeholder="Describe the scene..."></textarea>
                <button onClick={(e) => { e.preventDefault(); if (base64Image) analyzeGarment(base64Image); }} disabled={isAnalyzing || !base64Image} className="mt-2 w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-bold transition-colors">
                  {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  تحليل ذكي (Auto)
                </button>
              </div>



            </div>
          </details>

          {/* STEP 3: Brand Identity */}
          <details className="group bg-white rounded-3xl shadow-sm border border-slate-200/60 overflow-hidden">
            <summary className="p-6 text-lg font-bold text-slate-800 cursor-pointer list-none flex items-center justify-between select-none hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-sm group-open:bg-indigo-100 group-open:text-indigo-700 transition-colors">3</span>
                هوية الماركة (الختم)
              </div>
              <div className="flex items-center gap-3">
                <div onClick={(e) => e.stopPropagation()} className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={catalogueMode} onChange={e => setCatalogueMode(e.target.checked)} className="sr-only peer" />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-open:rotate-180 transition-transform pointer-events-none">▼</div>
              </div>
            </summary>
            
            {catalogueMode && (
              <div className="p-6 pt-2 border-t border-slate-100 space-y-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">الشعار الرسمي (شفاف PNG)</label>
                  {!base64Logo ? (
                    <label className="border border-slate-200 rounded-xl p-3 flex justify-center bg-slate-50 cursor-pointer hover:bg-slate-100">
                      <input type="file" accept="image/png" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => setBase64Logo(ev.target?.result as string);
                          reader.readAsDataURL(file);
                        }
                      }} className="hidden" />
                      <span className="text-xs font-bold text-slate-600">رفع الشعار</span>
                    </label>
                  ) : (
                    <div className="relative rounded-xl border p-2 bg-slate-50 flex items-center justify-center">
                      <img src={base64Logo} alt="Logo" className="h-12 object-contain" />
                      <button onClick={() => setBase64Logo(null)} className="absolute top-1 right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow text-red-500"><X className="w-3 h-3" /></button>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">اسم الماركة (يظهر بخط أنيق إن لم يوجد شعار)</label>
                  <input type="text" value={brandName} onChange={e=>setBrandName(e.target.value)} className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500" placeholder="Brand Name" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">وصف تسويقي / رقم الموديل</label>
                  <input type="text" value={marketingDesc} onChange={e=>setMarketingDesc(e.target.value)} className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500" placeholder="وصف قصير" />
                  <input type="text" value={productCode} onChange={e=>setProductCode(e.target.value)} className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 mt-2" placeholder="رقم الموديل (SKU)" dir="ltr" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">المقاسات (مستخرج آلياً)</label>
                  <textarea value={sizes} onChange={e=>setSizes(e.target.value)} className="w-full p-2.5 rounded-xl border border-slate-200 text-left resize-none h-[42px] focus:h-20 transition-all text-sm focus:ring-2 focus:ring-indigo-500" dir="ltr" placeholder="S, M, L"></textarea>
                </div>
              </div>
            )}
          </details>

          {/* MAIN ACTIONS */}
          <div className="mt-4">
              <button 
                onClick={handleGenerate} 
                disabled={loading || !base64Image}
                className="w-full py-4 rounded-2xl font-extrabold text-lg transition-all shadow-xl shadow-indigo-200 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white disabled:opacity-50 transform hover:-translate-y-1 flex items-center justify-center gap-3"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    جاري التوليد (يرجى الانتظار دقيقة)...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-6 h-6" />
                    توليد النتيجة الاحترافية
                  </>
                )}
              </button>
          </div>

        </div>

        {/* RIGHT COLUMN: PREVIEW */}
        <div className="flex-1 bg-white rounded-[2rem] border border-slate-200/60 shadow-sm p-4 lg:p-8 flex items-center justify-center relative min-h-[500px] overflow-hidden">
          {/* Subtle background decoration */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-50/50 via-slate-50/20 to-transparent pointer-events-none"></div>
          
          {loading ? (
            <div className="flex flex-col items-center justify-center z-10 space-y-6">
              <div className="relative">
                <div className="w-24 h-24 border-4 border-indigo-100 rounded-full animate-pulse"></div>
                <div className="w-24 h-24 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin absolute inset-0"></div>
                <Sparkles className="w-8 h-8 text-indigo-600 absolute inset-0 m-auto animate-pulse" />
              </div>
              <div className="text-center">
                <h3 className="font-extrabold text-xl text-slate-800">جاري بناء التصميم...</h3>
                <p className="text-slate-500 mt-2 font-medium">الذكاء الاصطناعي يقوم ببناء تفاصيل واقعية 10/10<br/>قد تستغرق العملية 60-90 ثانية.</p>
              </div>
            </div>
          ) : galleryImages.length > 0 ? (
            <div className="relative z-10 w-full h-full flex flex-col items-center justify-center">
              
              <div 
                className="relative w-full max-w-xl aspect-[3/4] max-h-[70vh] mx-auto overflow-hidden rounded-2xl shadow-2xl border-4 border-white cursor-ew-resize select-none"
                onMouseMove={(e) => {
                  if (!isDragging) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
                  setSliderPosition((x / rect.width) * 100);
                }}
                onMouseUp={() => setIsDragging(false)}
                onMouseLeave={() => setIsDragging(false)}
                onMouseDown={() => setIsDragging(true)}
                onTouchMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = Math.max(0, Math.min(e.touches[0].clientX - rect.left, rect.width));
                  setSliderPosition((x / rect.width) * 100);
                }}
                dir="ltr"
              >
                {/* 1. Generated image (Background) */}
                <img 
                  src={galleryImages[0].previewUrl || galleryImages[0].cleanUrl} 
                  className="absolute inset-0 w-full h-full object-contain bg-slate-100 pointer-events-none" 
                  alt="Generated Output"
                />

                {/* 2. Original image (Foreground, masked) */}
                <div 
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                >
                  <img 
                    src={base64Image || ""} 
                    className="absolute inset-0 w-full h-full object-contain bg-slate-50 opacity-95 pointer-events-none" 
                    alt="Original Input"
                  />
                  {/* Label for Original */}
                  <div className="absolute top-4 left-4 bg-black/60 text-white text-xs font-bold px-3 py-1 rounded-full backdrop-blur-md">
                    الأصلية
                  </div>
                </div>

                {/* Label for Generated (Always visible underneath the mask) */}
                <div className="absolute top-4 right-4 bg-indigo-600/80 text-white text-xs font-bold px-3 py-1 rounded-full backdrop-blur-md z-0">
                  النتيجة
                </div>

                {/* 3. Slider handle */}
                <div 
                  className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)] flex items-center justify-center z-10 pointer-events-none"
                  style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
                >
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg text-indigo-500 border border-indigo-100">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18-6-6 6-6"/><path d="m15 18 6-6-6-6"/></svg>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex gap-4">
                <button onClick={() => {
                  const link = document.createElement('a');
                  link.href = galleryImages[0].previewUrl || galleryImages[0].cleanUrl;
                  link.download = `generated-${Date.now()}.jpg`;
                  link.click();
                }} className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-colors flex items-center gap-2 shadow-lg">
                  <Download className="w-5 h-5" />
                  حفظ الصورة
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center z-10 opacity-60">
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ImageIcon className="w-10 h-10 text-slate-400" />
              </div>
              <p className="font-bold text-slate-500">ارفع المنتج واضغط توليد لترى السحر هنا!</p>
            </div>
          )}
        </div>

      </div>

      {/* GALLERY SLIDE-OUT PANEL */}
      {showGallery && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/20 backdrop-blur-sm" onClick={() => setShowGallery(false)}>
          <div className="w-full sm:w-[400px] bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right-8 sm:slide-in-from-left-8" onClick={e => e.stopPropagation()}>
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center shadow-md z-10">
              <div className="flex items-center gap-3">
                <ImageIcon className="w-6 h-6 text-indigo-400" />
                <h3 className="font-bold text-xl">معرض الكتالوج</h3>
              </div>
              <button onClick={() => setShowGallery(false)} className="hover:bg-slate-800 p-2 rounded-full transition-colors"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
              {galleryImages.length > 0 ? (
                <div className="space-y-6">
                  <div className="flex flex-col gap-2">
                    <button onClick={createCollage} className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white py-3 rounded-xl font-bold text-sm shadow-md transition-transform hover:-translate-y-0.5">
                      <Columns className="w-4 h-4" />
                      دمج أول صورتين معاً (كتالوج)
                    </button>
                    <button onClick={printGalleryAsCatalogue} className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-bold text-sm shadow-md transition-transform hover:-translate-y-0.5">
                      <Printer className="w-4 h-4" />
                      تحميل الكتالوج (PDF)
                    </button>

                    <button onClick={() => {
                        if (confirm('هل أنت متأكد من مسح المعرض؟')) {
                          setGalleryImages([]);
                          localStorage.removeItem('ai_fashion_generated_images');
                        }
                      }} 
                      className="w-full py-3 text-red-500 hover:bg-red-50 rounded-xl font-bold text-sm transition-colors mt-2"
                    >
                      مسح المعرض
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {galleryImages.map((img, i) => (
                      <div key={i} className="relative group rounded-xl overflow-hidden shadow-sm border border-slate-200 bg-white">
                        <img src={img.previewUrl || img.cleanUrl} className="w-full h-32 object-contain p-1" alt="Generated" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm">
                          <button onClick={() => {
                            const link = document.createElement('a');
                            link.href = img.previewUrl || img.cleanUrl;
                            link.download = `generated-${Date.now()}.jpg`;
                            link.click();
                          }} className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-slate-900 hover:scale-110 transition-transform">
                            <Download className="w-4 h-4" />
                          </button>
                          <button onClick={() => {
                            const newGallery = galleryImages.filter((_, index) => index !== i);
                            setGalleryImages(newGallery);
                            localStorage.setItem('ai_fashion_generated_images', JSON.stringify(newGallery));
                          }} className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full opacity-50">
                  <ImageIcon className="w-16 h-16 mb-4 text-slate-400" />
                  <p className="font-bold text-slate-500">لا توجد صور بعد</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
