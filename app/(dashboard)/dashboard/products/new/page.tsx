"use client";

import React, { useState, useEffect, useRef } from "react";
import { Upload, Image as ImageIcon, Loader2, Sparkles, X, UserSquare2, Type, Download, ExternalLink, RefreshCw, Camera, Printer } from "lucide-react";
import { toast } from "sonner";

export default function AIStudioPage() {
  const [file, setFile] = useState<File | null>(null);
  const [base64Image, setBase64Image] = useState<string | null>(null);
  
  const [modelFile, setModelFile] = useState<File | null>(null);
  const [base64ModelImage, setBase64ModelImage] = useState<string | null>(null);

  const [modelType, setModelType] = useState<string>("toddler boy");
  const [category, setCategory] = useState<string>("tops");
  const [garmentDirection, setGarmentDirection] = useState<string>("front");
  
  const [stylePrompt, setStylePrompt] = useState<string>("A beautiful cobblestone street in Paris, blurred cafe tables in the background, autumn leaves falling, soft cinematic sunlight. Natural candid walking pose, smiling.");
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  
  const [catalogueMode, setCatalogueMode] = useState<boolean>(true);
  const [brandName, setBrandName] = useState<string>("Baby Rose");
  const [base64Logo, setBase64Logo] = useState<string | null>(null);
  
  const [productCode, setProductCode] = useState<string>("BR-2024");
  const [sizes, setSizes] = useState<string>("S.M.L | 2-5 Years");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [showGallery, setShowGallery] = useState(false);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('ai_fashion_generated_images') || '[]');
      setGalleryImages(stored);
    } catch(e) {}
  }, [showGallery]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
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
    setStylePrompt("جاري تحليل القطعة بالذكاء الاصطناعي لابتكار خلفية حية ومبهرة تناسبها...");
    try {
      const res = await fetch('/api/analyze-garment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ garmentImage: b64 })
      });
      const data = await res.json();
      if (data.suggestion) {
        setStylePrompt(data.suggestion);
        toast.success("تم ابتكار خلفية حية ومبهرة للقطعة!");
      }
    } catch(e) {
      setStylePrompt("A beautiful cobblestone street in Paris, blurred cafe tables in the background, autumn leaves falling, soft cinematic sunlight. Natural candid walking pose, smiling.");
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

  const applyCatalogueOverlay = (imageUrl: string): Promise<string> => {
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
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const padding = img.width * 0.05;
        
        // Draw Logo or Brand Name
        if (base64Logo) {
          const logoImg = new Image();
          logoImg.onload = () => {
            const logoWidth = img.width * 0.25; 
            const aspect = logoImg.height / logoImg.width;
            const logoHeight = logoWidth * aspect;
            ctx.drawImage(logoImg, padding, padding, logoWidth, logoHeight);
            drawTextElements(ctx, img.width, padding);
            resolve(canvas.toDataURL('image/jpeg', 0.95));
          };
          logoImg.src = base64Logo;
        } else {
          ctx.fillStyle = "#ff6b81"; 
          ctx.font = `italic bold ${img.width * 0.08}px Georgia, serif`;
          ctx.textAlign = "left";
          ctx.textBaseline = "top";
          ctx.shadowColor = "rgba(255,255,255,0.8)";
          ctx.shadowBlur = 10;
          ctx.fillText(brandName, padding, padding);
          
          drawTextElements(ctx, img.width, padding);
          resolve(canvas.toDataURL('image/jpeg', 0.95));
        }
      };
      
      img.onerror = () => resolve(imageUrl);
      img.src = imageUrl;
    });
  };

  const drawTextElements = (ctx: CanvasRenderingContext2D, imgWidth: number, padding: number) => {
    ctx.fillStyle = "#1e293b"; 
    ctx.font = `bold ${imgWidth * 0.05}px Arial, sans-serif`;
    ctx.textAlign = "right";
    ctx.textBaseline = "top";
    ctx.shadowBlur = 0; 
    ctx.fillText(productCode, imgWidth - padding, padding);
    
    ctx.fillStyle = "#475569"; 
    ctx.font = `bold ${imgWidth * 0.035}px Arial, sans-serif`;
    ctx.fillText(sizes, imgWidth - padding, padding + (imgWidth * 0.06));
  };

  const handleGenerate = async () => {
    if (!base64Image) {
      toast.error("الرجاء رفع صورة المنتج أولاً");
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
      
      const data = await res.json();
      
      if (data.error) {
        setError(data.error);
        toast.error("حدث خطأ أثناء التوليد");
      } else if (data.imageUrl) {
        
        toast.success("تم توليد الصورة، جاري تصميم غلاف الكتالوج...");
        const finalImageUrl = await applyCatalogueOverlay(data.imageUrl);
        
        const existing = JSON.parse(localStorage.getItem('ai_fashion_generated_images') || '[]');
        const updated = [finalImageUrl, ...existing];
        localStorage.setItem('ai_fashion_generated_images', JSON.stringify(updated));
        setGalleryImages(updated);
        
        toast.success("تم التوليد والتصميم بنجاح!");
        setShowGallery(true);
      }
    } catch (e: any) {
      setError(e.message || "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  const printGalleryAsCatalogue = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const htmlContent = `
      <html>
        <head>
          <title>كتالوج Baby Rose - ${new Date().toLocaleDateString()}</title>
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
            ${galleryImages.map(img => `<img src="${img}" />`).join('')}
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
                        <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
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
                  <p className="text-sm text-indigo-700/80 mb-4">أضف شعارك الرسمي وتفاصيل المنتج ليتم ختمها على الصور تلقائياً كعلامة مائية.</p>
                  
                  <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm flex flex-row-reverse items-center justify-between">
                    <div className="text-right">
                      <label className="block text-sm font-bold text-slate-800 mb-1">الشعار الرسمي (Logo)</label>
                      <p className="text-xs text-slate-500">ارفع ملف PNG شفاف ليتم وضعه كعلامة مائية</p>
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
                      <label className="block text-xs font-bold text-slate-700 mb-1">أو اسم الماركة (يظهر بخط أنيق)</label>
                      <input type="text" value={brandName} onChange={e=>setBrandName(e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-300 text-left" dir="ltr" />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">العمر / المقاسات</label>
                      <input type="text" value={sizes} onChange={e=>setSizes(e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-300 text-left" dir="ltr" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">رمز المنتج (SKU)</label>
                      <input type="text" value={productCode} onChange={e=>setProductCode(e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-300 text-left" dir="ltr" />
                    </div>
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
                  <label className="block text-sm font-bold text-slate-700 mb-3">عمر وجنس العارض (مهم جداً)</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3" dir="rtl">
                    {[
                      { id: 'toddler girl', label: 'بنت صغيرة (2-5)' },
                      { id: 'toddler boy', label: 'ولد صغير (2-5)' },
                      { id: 'young girl', label: 'بنت (6-12)' },
                      { id: 'young boy', label: 'ولد (6-12)' },
                      { id: 'two girls', label: 'بنتان معاً 👯‍♀️' },
                      { id: 'two boys', label: 'ولدان معاً 👯‍♂️' },
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

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 text-right font-medium text-sm">
                ❌ {error}
              </div>
            )}

            <button
              onClick={handleGenerate}
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
                  <span>جاري التوليد والتصميم (قد يستغرق 30 ثانية)...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-6 h-6" />
                  <span>بدء التصميم وإنشاء صفحة الكتالوج!</span>
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
              <button 
                onClick={printGalleryAsCatalogue}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 py-3 rounded-xl font-bold text-sm transition-colors"
              >
                <Printer className="w-4 h-4" />
                تحميل الكتالوج كـ PDF 
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-slate-50">
            {galleryImages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                <ImageIcon className="w-12 h-12 mb-3 opacity-20" />
                <p className="text-sm font-medium">لا توجد صور مولدة بعد</p>
              </div>
            ) : (
              galleryImages.map((url, i) => (
                <div key={i} className="bg-white p-2 rounded-2xl shadow-sm border group relative">
                  <img src={url} className="w-full h-auto rounded-xl" alt="Generated" />
                  <div className="absolute inset-2 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex flex-col items-center justify-center gap-3">
                    <a href={url} download={`catalogue-${i}.jpg`} className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg flex items-center gap-2">
                      <Download className="w-4 h-4" /> تحميل الصورة
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
