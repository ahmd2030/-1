"use client";

import React, { useState, useEffect, useRef } from "react";
import { Upload, Image as ImageIcon, Loader2, Sparkles, X, UserSquare2, Type, Download, ExternalLink, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function AIStudioPage() {
  const [file, setFile] = useState<File | null>(null);
  const [base64Image, setBase64Image] = useState<string | null>(null);
  
  const [modelFile, setModelFile] = useState<File | null>(null);
  const [base64ModelImage, setBase64ModelImage] = useState<string | null>(null);

  const [modelType, setModelType] = useState<string>("toddler boy");
  const [category, setCategory] = useState<string>("tops");
  
  const [stylePrompt, setStylePrompt] = useState<string>("A beautiful cobblestone street in Paris, blurred cafe tables in the background, autumn leaves falling, soft cinematic sunlight. Natural candid walking pose, smiling.");
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  
  const [catalogueMode, setCatalogueMode] = useState<boolean>(true);
  const [brandName, setBrandName] = useState<string>("Baby Rose");
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
        
        ctx.fillStyle = "#ff6b81"; 
        ctx.font = `italic bold ${img.width * 0.08}px Georgia, serif`;
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.shadowColor = "rgba(255,255,255,0.8)";
        ctx.shadowBlur = 10;
        ctx.fillText(brandName, padding, padding);
        
        ctx.fillStyle = "#1e293b"; 
        ctx.font = `bold ${img.width * 0.05}px Arial, sans-serif`;
        ctx.textAlign = "right";
        ctx.shadowBlur = 0; 
        ctx.fillText(productCode, img.width - padding, padding);
        
        ctx.fillStyle = "#475569"; 
        ctx.font = `bold ${img.width * 0.035}px Arial, sans-serif`;
        ctx.fillText(sizes, img.width - padding, padding + (img.width * 0.06));
        
        resolve(canvas.toDataURL('image/jpeg', 0.95));
      };
      img.onerror = () => resolve(imageUrl);
      img.src = imageUrl;
    });
  };

  const handleGenerate = async () => {
    if (!base64Image) {
      toast.error("الرجاء رفع صورة المنتج أولاً");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch('/api/generate/base64', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'ready_to_generate',
          garmentImage: base64Image,
          modelImage: base64ModelImage,
          modelType,
          category,
          style: stylePrompt,
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

  return (
    <div className="flex relative min-h-[calc(100vh-5rem)] max-w-6xl mx-auto rounded-2xl overflow-hidden border bg-white shadow-lg">
      
      <canvas ref={canvasRef} className="hidden" />

      <div className="flex flex-col flex-1 relative min-w-0 bg-slate-50">
        
        <div className="bg-slate-900 text-white px-6 py-5 flex flex-row-reverse justify-between items-center z-10 shadow-md">
          <div className="flex items-center gap-3">
            <div className="text-right">
              <h2 className="font-bold text-xl">استوديو Baby Rose المباشر</h2>
              <p className="text-sm text-slate-400 mt-1">توليد احترافي وتصميم كتالوج بضغطة زر</p>
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
              <span>الصور المولدة</span>
              {galleryImages.length > 0 && (
                <span className="bg-indigo-500 text-white text-xs px-2 py-0.5 rounded-full">{galleryImages.length}</span>
              )}
            </button>

            <a 
              href="https://app.fashn.ai/api" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-700 rounded-xl text-sm font-bold transition-all border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white"
            >
              <span>التحقق من الرصيد (FASHN)</span>
              <ExternalLink className="w-4 h-4" />
            </a>
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
                <div className="relative rounded-xl overflow-hidden border group">
                  <img src={base64Image} alt="Uploaded product" className="w-full h-64 object-contain bg-slate-50" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <label className="bg-white text-slate-900 px-4 py-2 rounded-lg font-bold cursor-pointer hover:bg-slate-200">
                      تغيير الصورة
                      <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                    </label>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-2xl border border-indigo-100 shadow-sm relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl"></div>
              
              <div className="flex items-center justify-between mb-6 flex-row-reverse relative z-10">
                <h3 className="font-bold text-lg text-indigo-900 flex items-center gap-2">
                  <span>وضع الكتالوج الاحترافي (Enterprise)</span>
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm"><Type className="w-3 h-3" /></span>
                </h3>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={catalogueMode} onChange={e => setCatalogueMode(e.target.checked)} className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
              
              {catalogueMode && (
                <div className="space-y-4 text-right relative z-10 animate-in fade-in slide-in-from-top-4">
                  <p className="text-sm text-indigo-700/80 mb-4">هذا الوضع يقوم آلياً بدمج اسم علامتك التجارية وتفاصيل المنتج على الصورة المولدة لتصبح جاهزة للنشر فوراً كصفحة كتالوج فاخرة!</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">اسم الماركة (يظهر بخط أنيق)</label>
                      <input type="text" value={brandName} onChange={e=>setBrandName(e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-300 text-left" dir="ltr" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">رمز المنتج (SKU)</label>
                      <input type="text" value={productCode} onChange={e=>setProductCode(e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-300 text-left" dir="ltr" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">المقاسات المتوفرة / العمر</label>
                    <input type="text" value={sizes} onChange={e=>setSizes(e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-300 text-left" dir="ltr" />
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
                <span>إعدادات التوليد التلقائي (في حال لم يتم رفع عارض)</span>
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
                    <label className="block text-sm font-bold text-slate-700">ستايل الخلفية والإضاءة (باللغة الإنجليزية)</label>
                    {base64Image && (
                      <button 
                        onClick={() => analyzeGarment(base64Image)}
                        disabled={isAnalyzing}
                        className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
                        <span>تحليل القطعة واقتراح ديكور</span>
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
                  
                  <div className="flex flex-row-reverse flex-wrap gap-2 mt-3">
                    {[
                      {
                        label: "شوارع باريس الأنيقة (خلفية غنية ومبهرة) 🗼",
                        val: "A beautiful cobblestone street in Paris, blurred outdoor cafe tables in the background, autumn leaves falling, soft cinematic sunlight. Natural candid walking pose, smiling happily."
                      },
                      {
                        label: "غرفة ألعاب خيالية (مليئة بالتفاصيل) 🧸",
                        val: "A luxurious children's playroom filled with vintage wooden toys, a grand fireplace, rich colorful rugs, warm cozy lighting, beautiful bokeh. Playful candid lifestyle pose, interacting naturally."
                      },
                      {
                        label: "حديقة ساحرة مليئة بالأزهار (طبيعة حية) 🌸",
                        val: "An enchanted sun-drenched garden bursting with colorful spring flowers, tall ancient trees, glowing sunlight rays piercing through branches, shallow depth of field. Joyful twirling or running candid pose."
                      }
                    ].map(preset => (
                      <button
                        key={preset.label}
                        onClick={() => setStylePrompt(preset.val)}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors border text-right max-w-full leading-relaxed"
                      >
                        {preset.label}
                      </button>
                    ))}
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
          <div className="p-5 bg-slate-900 text-white flex flex-row-reverse justify-between items-center shadow-md">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-indigo-400" />
              <h3 className="font-bold text-lg">معرض الصور المولدة</h3>
            </div>
            <button onClick={() => setShowGallery(false)} className="hover:bg-slate-800 p-2 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
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
                      <Download className="w-4 h-4" /> تحميل الكتالوج
                    </a>
                    <a href={url} target="_blank" className="px-5 py-2.5 bg-white text-slate-900 text-sm font-bold rounded-xl hover:bg-slate-200 transition-colors shadow-lg">
                      تكبير الصورة
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
