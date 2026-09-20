const fs = require('fs');

const oldCode = fs.readFileSync('app/(dashboard)/dashboard/products/new/page.tsx', 'utf8');
const lines = oldCode.split('\n');
const returnStart = lines.findIndex(l => l.trim().startsWith('return ('));

const beforeReturn = lines.slice(0, returnStart).join('\n');

const newJSX = `  return (
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
              صورة المنتج
            </h2>
            {!base64Image ? (
              <label className="border-2 border-dashed border-indigo-200 rounded-2xl p-8 flex flex-col items-center justify-center bg-indigo-50/50 hover:bg-indigo-50 transition-colors cursor-pointer group">
                <input type="file" accept="image/*" multiple onChange={handleFileSelect} className="hidden" />
                <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6 text-indigo-500" />
                </div>
                <p className="font-bold text-indigo-900">اضغط لرفع صورة المنتج</p>
                <p className="text-xs text-indigo-500 mt-2 text-center">يمكنك رفع صورة واحدة أو عدة صور للتوليد الجماعي</p>
              </label>
            ) : (
              <div className="space-y-4">
                <div className="relative rounded-2xl overflow-hidden border group bg-slate-50">
                  <img src={base64Image} alt="Uploaded product" className="w-full h-48 object-contain" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                    <label className="bg-white text-slate-900 px-5 py-2.5 rounded-xl font-bold cursor-pointer hover:bg-slate-100 shadow-xl transition-transform hover:scale-105">
                      تغيير الصورة
                      <input type="file" accept="image/*" multiple onChange={handleFileSelect} className="hidden" />
                    </label>
                  </div>
                </div>
                
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button onClick={() => setGarmentDirection('front')} className={\`flex-1 py-2 text-sm font-bold rounded-lg transition-all \${garmentDirection === 'front' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}\`}>من الأمام</button>
                  <button onClick={() => setGarmentDirection('back')} className={\`flex-1 py-2 text-sm font-bold rounded-lg transition-all \${garmentDirection === 'back' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}\`}>من الخلف</button>
                </div>
              </div>
            )}
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
                    <button key={type.id} onClick={() => setCategory(type.id)} className={\`flex-1 py-2.5 rounded-xl border-2 font-bold text-sm transition-all \${category === type.id ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-100 text-slate-500 hover:border-slate-200'}\`}>{type.label}</button>
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
                    <button key={type.id} onClick={() => setModelType(type.id)} className={\`py-2 rounded-xl border-2 font-bold text-xs transition-all \${modelType === type.id ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-100 text-slate-500 hover:border-slate-200'}\`}>{type.label}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">ديكور الخلفية والإضاءة</label>
                <textarea value={stylePrompt} onChange={e=>setStylePrompt(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 text-left resize-none h-24 focus:ring-2 focus:ring-indigo-500 transition-all text-sm" dir="ltr" placeholder="Describe the scene..."></textarea>
                <button onClick={analyzeGarment} disabled={isAnalyzing || !base64Image} className="mt-2 w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-bold transition-colors">
                  {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  تحليل ذكي (Auto)
                </button>
              </div>

              <div>
                 <label className="block text-sm font-bold text-slate-700 mb-2">تخصيص المودل (اختياري)</label>
                 {!base64ModelImage ? (
                   <label className="border-2 border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
                     <input type="file" accept="image/*" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => setBase64ModelImage(ev.target?.result as string);
                          reader.readAsDataURL(file);
                        }
                     }} className="hidden" />
                     <UserSquare2 className="w-6 h-6 text-slate-400 mb-2" />
                     <span className="text-xs font-bold text-slate-600">رفع صورة وجه مخصص</span>
                   </label>
                 ) : (
                   <div className="relative rounded-xl overflow-hidden border">
                     <img src={base64ModelImage} alt="Model" className="w-full h-32 object-cover" />
                     <button onClick={() => setBase64ModelImage(null)} className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md text-red-500 hover:bg-red-50"><X className="w-4 h-4" /></button>
                   </div>
                 )}
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
            {isBulkMode ? (
              <button 
                onClick={handleBulkGenerate} 
                disabled={loading || queue.length === 0}
                className="w-full py-4 rounded-2xl font-extrabold text-lg transition-all shadow-xl shadow-purple-200 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white disabled:opacity-50 transform hover:-translate-y-1"
              >
                {loading ? \`جاري المعالجة (\${processingIndex + 1}/\${queue.length})...\` : \`توليد جماعي (\${queue.length} صور) 🚀\`}
              </button>
            ) : (
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
            )}
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
              <img src={galleryImages[0].previewUrl || galleryImages[0].cleanUrl} className="max-h-[70vh] object-contain rounded-2xl shadow-2xl border-4 border-white" alt="Generated Output" />
              <div className="mt-8 flex gap-4">
                <button onClick={() => {
                  const link = document.createElement('a');
                  link.href = galleryImages[0].previewUrl || galleryImages[0].cleanUrl;
                  link.download = \`generated-\${Date.now()}.jpg\`;
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
                    <button onClick={downloadZip} className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold text-sm shadow-md transition-transform hover:-translate-y-0.5">
                      <FileArchive className="w-4 h-4" />
                      تحميل جميع الصور (ZIP)
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
                            link.download = \`generated-\${Date.now()}.jpg\`;
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
`;

fs.writeFileSync('app/(dashboard)/dashboard/products/new/page.tsx', beforeReturn + '\n' + newJSX, 'utf8');
console.log("Rewrote UI successfully");
