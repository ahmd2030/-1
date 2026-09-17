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
      toast.success(`╪ز┘à ╪ح╪╢╪د┘╪ر ${e.target.files.length} ╪╡┘ê╪▒ ┘┘╪╖╪د╪ذ┘ê╪▒. ╪د╪╢╪║╪╖ ╪▓╪▒ ╪د┘╪ز┘ê┘┘è╪» ╪د┘╪ش┘à╪د╪╣┘è ┘┘╪ذ╪»╪ة!`);
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
        toast.success("╪ز┘à ╪▒┘╪╣ ╪د┘╪┤╪╣╪د╪▒ ╪ذ┘╪ش╪د╪ص! ╪│┘è╪ز┘à ╪«╪ز┘à┘ç ╪╣┘┘ë ╪ش┘à┘è╪╣ ╪د┘╪╡┘ê╪▒.");
      }
    };
    reader.readAsDataURL(e.target.files[0]);
  };
  
  const analyzeGarment = async (b64: string) => {
    setIsAnalyzing(true);
    setStylePrompt("╪ش╪د╪▒┘è ╪ز╪ص┘┘è┘ ╪د┘┘é╪╖╪╣╪ر ╪ذ╪د┘╪░┘â╪د╪ة ╪د┘╪د╪╡╪╖┘╪د╪╣┘è ┘╪د╪│╪ز╪«╪▒╪د╪ش ╪د┘╪ذ┘è╪د┘╪د╪ز ┘ê╪د╪ذ╪ز┘â╪د╪▒ ╪«┘┘┘è╪ر (┘è╪│╪ز╪║╪▒┘é ╪ذ╪╢╪╣ ╪س┘ê╪د┘)...");
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
          throw new Error("┘╪┤┘ ╪د┘╪د╪ز╪╡╪د┘ ╪ذ┘à╪ص┘┘ ╪د┘╪╡┘ê╪▒.");
        }
        
        if (!res.ok || data.error) {
          throw new Error(data.error || "╪ص╪»╪س ╪«╪╖╪ث ╪ث╪س┘╪د╪ة ╪ز╪ص┘┘è┘ ╪د┘╪╡┘ê╪▒╪ر.");
        }

      if (data.suggestion) {
        setStylePrompt(data.suggestion);
        if (data.size && data.size.trim().length > 0) setSizes(data.size);
        if (data.sku && data.sku.trim().length > 0) setProductCode(data.sku);
        if (data.marketing_desc && data.marketing_desc.trim().length > 0) setMarketingDesc(data.marketing_desc);
        toast.success("╪ز┘à ╪د╪ذ╪ز┘â╪د╪▒ ╪«┘┘┘è╪ر ╪ش╪»┘è╪»╪ر ┘ê╪د╪│╪ز╪«╪▒╪د╪ش ╪د┘╪ذ┘è╪د┘╪د╪ز ╪ذ┘╪ش╪د╪ص!");
      }
    } catch(e: any) {
      console.error(e);
      setStylePrompt("A beautiful cobblestone street in Paris, blurred cafe tables in the background, autumn leaves falling, soft cinematic sunlight. Natural candid walking pose, smiling.");
      toast.error("╪«╪╖╪ث: " + (e.message || "╪ز╪╣╪░╪▒ ╪د┘╪ز╪ص┘┘è┘"));
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
                  const sizeArray = (customSizes || sizes).split(/[,/|╪î\n]/).map(s => s.trim()).filter(Boolean);
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
          setQueueStatus(prev => prev.map((s, idx) => idx === i ? { status: 'error', error: (err as Error).message || "┘╪┤┘╪ز ╪د┘╪╣┘à┘┘è╪ر" } : s));
        }
    }
    
    setLoading(false);
    setProcessingIndex(-1);
    setIsBulkMode(false);
    setQueue([]);
    toast.success("╪ز┘à ╪د┘╪د┘╪ز┘ç╪د╪ة ┘à┘ ╪د┘╪ز┘ê┘┘è╪» ╪د┘╪ش┘à╪د╪╣┘è!");
  };

  
  const createCollage = async () => {
    if (galleryImages.length < 2) {
      toast.error("┘è╪ش╪ذ ╪ث┘ ┘è┘â┘ê┘ ┘╪»┘è┘â ╪╡┘ê╪▒╪ز┘è┘ ╪╣┘┘ë ╪د┘╪ث┘é┘ ┘┘è ╪د┘┘à╪╣╪▒╪╢ ┘╪»┘à╪ش┘ç┘à╪د!");
      return;
    }
    toast.info("╪ش╪د╪▒┘è ╪»┘à╪ش ╪ث┘ê┘ ╪╡┘ê╪▒╪ز┘è┘...");
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
      
      toast.success("╪ز┘à ╪»┘à╪ش ╪د┘╪╡┘ê╪▒╪ز┘è┘ ╪ذ┘╪ش╪د╪ص!");
    } catch(err) {
      console.error(err);
      toast.error("┘╪┤┘ ╪»┘à╪ش ╪د┘╪╡┘ê╪▒╪ز┘è┘");
    }
  };

  async function pollStatus(id: string): Promise<any> {
    let attempts = 0;
    let lastError = '';
    while (attempts < 120) { // 6 minutes maximum
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      if (attempts === 15) {
        toast("┘╪د ╪▓╪د┘ ╪د┘╪ز┘ê┘┘è╪» ┘à╪│╪ز┘à╪▒╪د┘ï╪î ╪د┘╪«┘ê╪د╪»┘à ┘à╪▓╪»╪ص┘à╪ر ┘é┘┘è┘╪د┘ï ╪د┘┘è┘ê┘à...", { icon: 'ظ│', duration: 4000 });
      } else if (attempts === 30) {
        toast("╪د┘╪▒╪ش╪د╪ة ╪د┘╪د┘╪ز╪╕╪د╪▒╪î ╪د┘╪░┘â╪د╪ة ╪د┘╪د╪╡╪╖┘╪د╪╣┘è ┘è┘é┘ê┘à ╪ذ╪ذ┘╪د╪ة ╪ز┘╪د╪╡┘è┘ ┘ê╪د┘é╪╣┘è╪ر ╪ش╪»╪د┘ï...", { icon: '≡اذ', duration: 4000 });
      } else if (attempts === 60) {
        toast("╪د┘╪ز┘ê┘┘è╪» ┘è╪ث╪«╪░ ┘ê┘é╪ز╪د┘ï ╪ث╪╖┘ê┘ ┘à┘ ╪د┘┘à╪╣╪ز╪د╪» ╪ذ╪│╪ذ╪ذ ╪د┘╪╢╪║╪╖ ╪╣┘┘ë ╪د┘╪│┘è╪▒┘╪▒╪د╪ز ╪د┘╪╣╪د┘┘à┘è╪ر...", { icon: '≡اî', duration: 4000 });
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
      toast.error("╪د┘╪▒╪ش╪د╪ة ╪▒┘╪╣ ╪╡┘ê╪▒╪ر ┘┘┘à┘╪ز╪ش ╪ث┘ê┘╪د┘ï");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const finalPrompt = garmentDirection === 'back' 
        ? `Model is facing backwards, walking away from the camera, showing the BACK of the garment. ${stylePrompt}`
        : stylePrompt;

      const res = await fetch('/api/generate/base64', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'ready_to_generate',
          garmentImage: base64Image,
          modelImage: base64ModelImage,
          modelType,
          category,
          style: finalPrompt,
        })
      });
      
      let data = await res.json();
      
      if (data.id && data.status === 'processing') {
        toast.success("╪ز┘à ╪ذ╪»╪ة ╪د┘╪ز┘ê┘┘è╪»╪î ┘è╪▒╪ش┘ë ╪د┘╪د┘╪ز╪╕╪د╪▒ (┘é╪» ┘è╪│╪ز╪║╪▒┘é 40-60 ╪س╪د┘┘è╪ر)...", { duration: 5000 });
        data = await pollStatus(data.id);
      }
      
      if (data.error) {
        setError(data.error);
        toast.error("╪ص╪»╪س ╪«╪╖╪ث ╪ث╪س┘╪د╪ة ╪د┘╪ز┘ê┘┘è╪»");
      } else if (data.imageUrl) {
        
        toast.success("╪ز┘à ╪ز┘ê┘┘è╪» ╪د┘╪╡┘ê╪▒╪ر╪î ╪ش╪د╪▒┘è ╪ز╪╡┘à┘è┘à ╪║┘╪د┘ ╪د┘┘â╪ز╪د┘┘ê╪ش...");
        const finalImageUrl = await applyCatalogueOverlay(data.imageUrl, sizes, productCode, marketingDesc);
        
          const firebaseItem = { 
            cleanUrl: data.imageUrl, 
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
          const finalItem = { id: docId, cleanUrl: data.imageUrl, previewUrl: finalImageUrl, sizes, sku: productCode, desc: marketingDesc, createdAt: new Date() };
          
          setGalleryImages(prev => [finalItem, ...prev]);
          try {
            const existing = JSON.parse(localStorage.getItem('ai_fashion_generated_images') || '[]');
            localStorage.setItem('ai_fashion_generated_images', JSON.stringify([finalItem, ...existing].slice(0, 10)));
          } catch(e) {}
        // setGalleryImages(updated); // Fixed TS error
        
        toast.success("╪ز┘à ╪د┘╪ز┘ê┘┘è╪» ┘ê╪د┘╪ز╪╡┘à┘è┘à ╪ذ┘╪ش╪د╪ص!");
        setShowGallery(true);
      }
    } catch (e: any) {
      setError(e.message || "╪ص╪»╪س ╪«╪╖╪ث ╪║┘è╪▒ ┘à╪ز┘ê┘é╪╣");
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
          <title>┘â╪ز╪د┘┘ê╪ش ╪د┘┘à╪ذ┘è╪╣╪د╪ز - ${new Date().toLocaleDateString()}</title>
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
              ≡اûذي╕ ╪د╪╢╪║╪╖ ┘ç┘╪د ┘┘╪╖╪ذ╪د╪╣╪ر ╪ث┘ê ╪د┘╪ص┘╪╕ ┘â┘ PDF
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
              <h2 className="font-bold text-xl">╪د╪│╪ز┘ê╪»┘è┘ê ╪د┘┘à╪د╪▒┘â╪ر (╪ح╪╡╪»╪د╪▒ ╪د┘┘à╪ذ┘è╪╣╪د╪ز)</h2>
              <p className="text-sm text-slate-400 mt-1">╪░┘â╪د╪ة ╪د╪╡╪╖┘╪د╪╣┘è ┘╪د╪خ┘é + ╪ح╪»╪د╪▒╪ر ╪د┘┘â╪ز╪د┘┘ê╪ش</p>
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
              <span>┘à╪╣╪▒╪╢ ╪د┘┘à╪ذ┘è╪╣╪د╪ز</span>
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
                <span>╪د┘╪╡┘ê╪▒╪ر ╪د┘╪ث╪╡┘┘è╪ر ┘┘┘à┘╪ز╪ش</span>
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
                  <p className="font-medium text-slate-600">╪د╪╢╪║╪╖ ┘ç┘╪د ┘╪▒┘╪╣ ╪╡┘ê╪▒╪ر ╪د┘┘à┘╪ز╪ش</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative rounded-xl overflow-hidden border group">
                    <img src={base64Image} alt="Uploaded product" className="w-full h-64 object-contain bg-slate-50" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <label className="bg-white text-slate-900 px-4 py-2 rounded-lg font-bold cursor-pointer hover:bg-slate-200">
                        ╪ز╪║┘è┘è╪▒ ╪د┘╪╡┘ê╪▒╪ر
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
                        ┘à┘ ╪د┘╪«┘┘ (╪╕┘ç╪▒)
                      </button>
                      <button 
                        onClick={() => setGarmentDirection('front')}
                        className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${garmentDirection === 'front' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border'}`}
                      >
                        ┘à┘ ╪د┘╪ث┘à╪د┘à
                      </button>
                    </div>
                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      ╪▓╪د┘ê┘è╪ر ╪د┘┘é╪╖╪╣╪ر
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
                  <span>╪«╪ز┘à ╪د┘┘ç┘ê┘è╪ر ┘ê╪ز╪╡┘à┘è┘à ╪د┘┘â╪ز╪د┘┘ê╪ش</span>
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm"><Type className="w-3 h-3" /></span>
                </h3>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={catalogueMode} onChange={e => setCatalogueMode(e.target.checked)} className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
              
              {catalogueMode && (
                <div className="space-y-4 text-right relative z-10 animate-in fade-in slide-in-from-top-4">
                  <p className="text-sm text-indigo-700/80 mb-4">╪ث╪╢┘ ╪┤╪╣╪د╪▒┘â ╪د┘╪▒╪│┘à┘è. ╪│┘è┘é┘ê┘à ╪د┘┘╪╕╪د┘à ╪ذ╪د╪│╪ز╪«╪▒╪د╪ش ╪د┘┘à┘é╪د╪│ ┘ê╪▒┘é┘à ╪د┘┘à┘╪ز╪ش ╪ز┘┘é╪د╪خ┘è╪د┘ï ┘à┘ ╪د┘╪╡┘ê╪▒╪ر (╪ح┘ ┘ê╪ش╪»).</p>
                  
                  <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm flex flex-row-reverse items-center justify-between">
                    <div className="text-right">
                      <label className="block text-sm font-bold text-slate-800 mb-1">╪د┘╪┤╪╣╪د╪▒ ╪د┘╪▒╪│┘à┘è (Logo)</label>
                      <p className="text-xs text-slate-500">╪د╪▒┘╪╣ ┘à┘┘ PNG ┘┘è╪ز┘à ┘ê╪╢╪╣┘ç ┘â╪╣┘╪د┘à╪ر ┘à╪د╪خ┘è╪ر</p>
                    </div>
                    {base64Logo ? (
                      <div className="flex items-center gap-3">
                        <img src={base64Logo} className="h-10 object-contain" alt="Logo" />
                        <button onClick={() => setBase64Logo(null)} className="text-xs text-red-500 font-bold bg-red-50 px-2 py-1 rounded">╪ص╪░┘</button>
                      </div>
                    ) : (
                      <label className="cursor-pointer bg-indigo-100 text-indigo-700 hover:bg-indigo-200 px-4 py-2 rounded-lg text-sm font-bold transition-colors">
                        ╪▒┘╪╣ ╪د┘╪┤╪╣╪د╪▒
                        <input type="file" accept="image/png,image/jpeg" onChange={handleLogoSelect} className="hidden" />
                      </label>
                    )}
                  </div>

                  {!base64Logo && (
                    <div className="mt-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">╪د╪│┘à ╪د┘┘à╪د╪▒┘â╪ر (┘è╪╕┘ç╪▒ ╪ذ╪«╪╖ ╪ث┘┘è┘é)</label>
                      <input type="text" value={brandName} onChange={e=>setBrandName(e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-300 text-left" dir="ltr" />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">╪د┘┘à┘é╪د╪│╪د╪ز (┘à╪│╪ز╪«╪▒╪ش ╪ت┘┘è╪د┘ï)</label>
                      <textarea value={sizes} onChange={e=>setSizes(e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-300 text-left resize-none h-[42px] focus:h-24 transition-all" dir="ltr" placeholder="S.M.L 
2-5 Years" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">╪▒┘à╪▓ ╪د┘┘à┘╪ز╪ش (┘à╪│╪ز╪«╪▒╪ش ╪ت┘┘è╪د┘ï)</label>
                      <input type="text" value={productCode} onChange={e=>setProductCode(e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-300 text-left" dir="ltr" placeholder="BR-2024" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white p-6 rounded-2xl border shadow-sm">
              <h3 className="font-bold text-lg text-slate-800 text-right mb-4 flex items-center justify-end gap-2">
                <span>(╪د╪«╪ز┘è╪د╪▒┘è) ┘ê╪╢╪╣ ╪د┘╪╣╪د╪▒╪╢ ╪د┘┘à╪╖╪د╪ذ┘é ┘┘┘â╪ز╪د┘┘ê╪ش</span>
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
                  <p className="font-medium text-slate-600">╪د╪▒┘╪╣ ╪╡┘ê╪▒╪ر ╪د┘╪╣╪د╪▒╪╢ (┘à┘ ╪د┘┘â╪ز╪د┘┘ê╪ش ╪د┘┘à╪▒╪ش╪╣┘è ╪د┘╪«╪د╪╡ ╪ذ┘â)</p>
                </div>
              ) : (
                <div className="relative rounded-xl overflow-hidden border group">
                  <img src={base64ModelImage} alt="Model Reference" className="w-full h-64 object-contain bg-slate-50" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                    <button onClick={() => setBase64ModelImage(null)} className="bg-red-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-red-600">
                      ╪ح╪▓╪د┘╪ر ╪د┘╪╡┘ê╪▒╪ر
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className={`bg-white p-6 rounded-2xl border shadow-sm transition-opacity ${base64ModelImage ? 'opacity-50 pointer-events-none' : ''}`}>
              <h3 className="font-bold text-lg text-slate-800 text-right mb-4 flex items-center justify-end gap-2">
                <span>╪ح╪╣╪»╪د╪»╪د╪ز ╪د┘╪╣╪د╪▒╪╢ ┘ê╪د┘╪░┘â╪د╪ة ╪د┘╪د╪╡╪╖┘╪د╪╣┘è</span>
                <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm">3</span>
              </h3>
              
              <div className="space-y-6 text-right">
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-3">┘┘ê╪╣ ╪د┘┘é╪╖╪╣╪ر ╪د┘┘à╪▒┘┘ê╪╣╪ر</label>
                  <div className="flex flex-row-reverse gap-3">
                    {[
                      { id: 'tops', label: '┘é╪╖╪╣╪ر ╪╣┘┘ê┘è╪ر / ╪ش╪د┘â┘è╪ز' },
                      { id: 'bottoms', label: '╪ذ┘╪╖┘┘ê┘ / ╪ز┘┘ê╪▒╪ر' },
                      { id: 'one-pieces', label: '┘╪│╪ز╪د┘ / ╪╖┘é┘à ┘â╪د┘à┘' }
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
                  <span className="text-sm font-bold text-emerald-900">╪ز┘ê┘┘è╪» ┘ê╪╡┘ ╪ز╪│┘ê┘è┘é┘è ╪ت┘┘è (╪د┘╪╣╪▒╪ذ┘è╪ر) ╪╣┘┘ë ╪د┘╪╡┘ê╪▒╪ر</span>
                </label>
              </div>

                <label className="block text-sm font-bold text-slate-700 mb-3">╪╣┘à╪▒ ┘ê╪ش┘╪│ ╪د┘╪╣╪د╪▒╪╢ (┘à┘ç┘à ╪ش╪»╪د┘ï)</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3" dir="rtl">
                    {[
                        { id: 'baby girl', label: '╪╖┘┘╪ر (9 ╪ث╪┤┘ç╪▒)' },
                        { id: 'baby boy', label: '╪╖┘┘ (9 ╪ث╪┤┘ç╪▒)' },
                        { id: 'toddler girl', label: '╪ذ┘╪ز ╪╡╪║┘è╪▒╪ر (3 ╪│┘┘ê╪د╪ز)' },
                        { id: 'toddler boy', label: '┘ê┘╪» ╪╡╪║┘è╪▒ (3 ╪│┘┘ê╪د╪ز)' },
                        { id: 'young girl', label: '╪ذ┘╪ز (6-12 ╪│┘╪ر)' },
                        { id: 'young boy', label: '┘ê┘╪» (6-12 ╪│┘╪ر)' },
                        { id: 'teen girl', label: '╪┤╪د╪ذ╪ر (16 ╪│┘╪ر)' },
                        { id: 'teen boy', label: '╪┤╪د╪ذ (16 ╪│┘╪ر)' },
                        { id: 'woman', label: '╪د┘à╪▒╪ث╪ر' },
                        { id: 'man', label: '╪▒╪ش┘' }
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
                    <label className="block text-sm font-bold text-slate-700">╪»┘è┘â┘ê╪▒ ╪د┘╪«┘┘┘è╪ر (╪ز┘ê┘┘è╪» ╪░┘â┘è)</label>
                    {base64Image && (
                      <button 
                        onClick={() => analyzeGarment(base64Image)}
                        disabled={isAnalyzing}
                        className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
                        <span>╪ز╪ص┘┘è┘ ╪د┘┘é╪╖╪╣╪ر ┘ê╪د╪ذ╪ز┘â╪د╪▒ ╪»┘è┘â┘ê╪▒ ┘╪▒┘è╪»</span>
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
                        <span className="text-sm font-bold text-indigo-800">╪ش╪د╪▒┘è ╪ز╪ص┘┘è┘ ╪د┘┘é╪╖╪╣╪ر ┘ê╪د╪ذ╪ز┘â╪د╪▒ ╪د┘╪«┘┘┘è╪ر...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            
            {isBulkMode && queue.length > 0 && (
              <div className="bg-white p-4 rounded-xl border border-slate-200 mb-6 space-y-2 max-h-60 overflow-y-auto" dir="rtl">
                 <h4 className="font-bold text-slate-800 mb-3">╪╖╪د╪ذ┘ê╪▒ ╪د┘╪ز┘ê┘┘è╪» ({queue.length} ╪╡┘ê╪▒)</h4>
                 {queue.map((file, i) => (
                    <div key={i} className="flex justify-between items-center text-sm p-3 bg-slate-50 rounded-lg border border-slate-100">
                       <span className="truncate w-40 font-medium text-slate-600" dir="ltr">{file.name}</span>
                       <span className="text-left">
                         {(!queueStatus[i] || queueStatus[i].status === 'waiting') && <span className="text-slate-400 font-bold">┘┘è ╪د┘╪د┘╪ز╪╕╪د╪▒ ظ│</span>}
                         {queueStatus[i]?.status === 'analyzing' && <span className="text-blue-500 font-bold flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin"/> ┘è┘é╪▒╪ث ╪د┘┘à┘é╪د╪│...</span>}
                         {queueStatus[i]?.status === 'generating' && <span className="text-indigo-500 font-bold flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin"/> ┘è╪▒╪│┘à ╪د┘┘à┘ê╪»┘è┘...</span>}
                         {queueStatus[i]?.status === 'done' && <span className="text-emerald-500 font-bold">╪د┘â╪ز┘à┘╪ز ظ£à</span>}
                         {queueStatus[i]?.status === 'error' && <span className="text-red-500 font-bold" title={queueStatus[i]?.error}>┘╪┤┘╪ز ظإî</span>}
                       </span>
                    </div>
                 ))}
              </div>
            )}

              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 text-right font-medium text-sm">
                ظإî {error}
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
                  <span>{isBulkMode && processingIndex >= 0 ? `╪ش╪د╪▒┘è ┘à╪╣╪د┘╪ش╪ر ╪د┘╪╡┘ê╪▒╪ر ${processingIndex + 1} ┘à┘ ${queue.length}...` : '╪ش╪د╪▒┘è ╪د┘╪ز┘ê┘┘è╪» ┘ê╪د┘╪ز╪╡┘à┘è┘à (┘é╪» ┘è╪│╪ز╪║╪▒┘é 30 ╪س╪د┘┘è╪ر)...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-6 h-6" />
                  <span>{isBulkMode ? `╪ذ╪»╪ة ╪د┘╪ز┘ê┘┘è╪» ╪د┘╪ش┘à╪د╪╣┘è ┘┘ ${queue.length} ╪╡┘ê╪▒ ≡اأ` : '╪ذ╪»╪ة ╪د┘╪ز╪╡┘à┘è┘à ┘ê╪ح┘╪┤╪د╪ة ╪╡┘╪ص╪ر ╪د┘┘â╪ز╪د┘┘ê╪ش!'}</span>
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
                <h3 className="font-bold text-lg">┘â╪ز╪د┘┘ê╪ش ╪د┘┘à╪ذ┘è╪╣╪د╪ز</h3>
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
                ╪»┘à╪ش ╪ث┘ê┘ ╪╡┘ê╪▒╪ز┘è┘ ┘à╪╣╪د┘ï (┘┘┘â╪ز╪د┘┘ê╪ش)
              </button>
              <button 
                onClick={printGalleryAsCatalogue}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 py-3 rounded-xl font-bold text-sm transition-colors"
              >
                <Printer className="w-4 h-4" />
                ╪ز╪ص┘à┘è┘ ╪د┘┘â╪ز╪د┘┘ê╪ش ┘â┘ PDF
              </button>
              <button 
                onClick={downloadAllAsZip}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 py-3 rounded-xl font-bold text-sm transition-colors mt-2"
              >
                <FileArchive className="w-4 h-4" />
                ╪ز╪ص┘à┘è┘ ╪ش┘à┘è╪╣ ╪د┘╪╡┘ê╪▒ (ZIP)
              </button>
                <button 
                  onClick={() => {
                    if(confirm('┘ç┘ ╪ث┘╪ز ┘à╪ز╪ث┘â╪» ┘à┘ ┘à╪│╪ص ╪ش┘à┘è╪╣ ╪د┘╪╡┘ê╪▒ ╪د┘┘à╪╣┘┘é╪ر ┘à┘ ╪د┘┘à╪╣╪▒╪╢ ╪د┘╪ش╪د┘╪ذ┘è╪ا')) {
                      setGalleryImages([]);
                      localStorage.removeItem('ai_fashion_generated_images');
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-rose-100 text-rose-700 hover:bg-rose-200 py-2 rounded-xl font-bold text-xs transition-colors shadow-sm mt-2"
                >
                  ┘à╪│╪ص ╪د┘┘à╪╣╪▒╪╢ ╪د┘╪ش╪د┘╪ذ┘è
                </button>
                          </div>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-slate-50">
            {galleryImages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                <ImageIcon className="w-12 h-12 mb-3 opacity-20" />
                <p className="text-sm font-medium">┘╪د ╪ز┘ê╪ش╪» ╪╡┘ê╪▒ ┘à┘ê┘╪»╪ر ╪ذ╪╣╪»</p>
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
                        <Download className="w-4 h-4" /> ╪ز╪ص┘à┘è┘
                      </a>
                      {!isLegacy && (
                        <button onClick={() => setEditingItem(item)} className="px-5 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-lg flex items-center gap-2">
                          <Edit3 className="w-4 h-4" /> ╪ز╪╣╪»┘è┘ ╪د┘┘╪╡┘ê╪╡
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
