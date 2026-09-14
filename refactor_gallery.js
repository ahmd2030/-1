const fs = require('fs');
let code = fs.readFileSync('page_edit.tsx', 'utf8');

// 1. Add Edit3 icon import
code = code.replace(/import \{([^}]+)\} from "lucide-react";/, "import {$1, Edit3} from 'lucide-react';");

// 2. Change galleryImages state to any[]
code = code.replace(/const \[galleryImages, setGalleryImages\] = useState<string\[\]>\(\[\]\);/,
`const [galleryImages, setGalleryImages] = useState<any[]>([]);
  const [editingItem, setEditingItem] = useState<any>(null);`);

// 3. Update useEffect for loading gallery to normalize legacy strings
const oldLoad = `const stored = JSON.parse(localStorage.getItem('ai_fashion_generated_images') || '[]');
      setGalleryImages(stored);`;
const newLoad = `const stored = JSON.parse(localStorage.getItem('ai_fashion_generated_images') || '[]');
      const normalized = stored.map((item: any) => {
        if (typeof item === 'string') {
          return { id: Math.random().toString(), cleanUrl: item, previewUrl: item, sizes: '', sku: '', desc: '' };
        }
        return item;
      });
      setGalleryImages(normalized);`;
code = code.replace(oldLoad, newLoad);

// 4. Update downloadAllAsZip
code = code.replace(/const url = galleryImages\[i\];/g, `const url = typeof galleryImages[i] === 'string' ? galleryImages[i] : galleryImages[i].previewUrl;`);

// 5. Update printGalleryAsCatalogue
code = code.replace(/galleryImages\.map\(img => \`<img src="\$\{img\}" \/>\`\)\.join\(''\)/,
`galleryImages.map(img => \`<img src="\${typeof img === 'string' ? img : img.previewUrl}" />\`).join('')`);

// 6. Update processQueue
const pqOld = `currentGallery = [finalImageUrl, ...currentGallery];`;
const pqNew = `const newItem = { id: Math.random().toString(), cleanUrl: genData.imageUrl, previewUrl: finalImageUrl, sizes: genSizes, sku: genSku, desc: genDesc };
          currentGallery = [newItem, ...currentGallery];`;
code = code.replace(pqOld, pqNew);

// 7. Update handleGenerate (if it exists separate from processQueue)
const hgOld = `const existing = JSON.parse(localStorage.getItem('ai_fashion_generated_images') || '[]');
        const updated = [finalImageUrl, ...existing];`;
const hgNew = `const existing = JSON.parse(localStorage.getItem('ai_fashion_generated_images') || '[]');
        const newItem = { id: Math.random().toString(), cleanUrl: data.imageUrl, previewUrl: finalImageUrl, sizes, sku: productCode, desc: marketingDesc };
        const updated = [newItem, ...existing];`;
code = code.replace(hgOld, hgNew);

// 8. Update Gallery Map Rendering
const renderOld = `galleryImages.map((url, i) => (
                <div key={i} className="bg-white p-2 rounded-2xl shadow-sm border group relative">
                  <img src={url} className="w-full h-auto rounded-xl" alt="Generated" />
                  <div className="absolute inset-2 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex flex-col items-center justify-center gap-3">
                    <a href={url} download={\`catalogue-\${i}.jpg\`} className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg flex items-center gap-2">
                      <Download className="w-4 h-4" /> تحميل
                    </a>
                  </div>
                </div>
              ))`;

const renderNew = `galleryImages.map((item, i) => {
                const isLegacy = typeof item === 'string';
                const pUrl = isLegacy ? item : item.previewUrl;
                return (
                  <div key={i} className="bg-white p-2 rounded-2xl shadow-sm border group relative">
                    <img src={pUrl} className="w-full h-auto rounded-xl" alt="Generated" />
                    <div className="absolute inset-2 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex flex-col items-center justify-center gap-3">
                      <a href={pUrl} download={\`catalogue-\${i}.jpg\`} className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg flex items-center gap-2">
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
              })`;
code = code.replace(renderOld, renderNew);

// 9. Add the Edit Modal to the very bottom before the closing </div> of the main return
const editModal = `
      {editingItem && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white rounded-2xl max-w-4xl w-full flex overflow-hidden max-h-[90vh]">
            <div className="flex-1 bg-slate-100 flex items-center justify-center p-4">
              <img src={editingItem.previewUrl} className="max-h-full w-auto rounded-xl shadow-lg" alt="Preview" />
            </div>
            <div className="w-96 p-6 overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg text-slate-800">تعديل نصوص الصورة</h3>
                <button onClick={() => setEditingItem(null)} className="p-2 hover:bg-slate-100 rounded-full"><X className="w-5 h-5"/></button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">المقاسات (لترتيب عمودي استخدم Enter)</label>
                  <textarea 
                    value={editingItem.sizes} 
                    onChange={async (e) => {
                      const val = e.target.value;
                      const newItem = { ...editingItem, sizes: val };
                      setEditingItem(newItem);
                      const newPUrl = await applyCatalogueOverlay(newItem.cleanUrl, newItem.sizes, newItem.sku, newItem.desc);
                      setEditingItem({ ...newItem, previewUrl: newPUrl });
                    }}
                    className="w-full p-3 rounded-xl border text-left resize-none h-24" dir="ltr" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">رقم الموديل (SKU)</label>
                  <input 
                    type="text" 
                    value={editingItem.sku} 
                    onChange={async (e) => {
                      const val = e.target.value;
                      const newItem = { ...editingItem, sku: val };
                      setEditingItem(newItem);
                      const newPUrl = await applyCatalogueOverlay(newItem.cleanUrl, newItem.sizes, newItem.sku, newItem.desc);
                      setEditingItem({ ...newItem, previewUrl: newPUrl });
                    }}
                    className="w-full p-3 rounded-xl border text-left" dir="ltr" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">الوصف التسويقي</label>
                  <textarea 
                    value={editingItem.desc} 
                    onChange={async (e) => {
                      const val = e.target.value;
                      const newItem = { ...editingItem, desc: val };
                      setEditingItem(newItem);
                      const newPUrl = await applyCatalogueOverlay(newItem.cleanUrl, newItem.sizes, newItem.sku, newItem.desc);
                      setEditingItem({ ...newItem, previewUrl: newPUrl });
                    }}
                    className="w-full p-3 rounded-xl border resize-none h-32"
                  />
                </div>
              </div>
              
              <button 
                onClick={() => {
                  const updatedGallery = galleryImages.map(img => typeof img !== 'string' && img.id === editingItem.id ? editingItem : img);
                  setGalleryImages(updatedGallery);
                  localStorage.setItem('ai_fashion_generated_images', JSON.stringify(updatedGallery));
                  setEditingItem(null);
                  toast.success("تم الحفظ بنجاح!");
                }}
                className="w-full mt-6 bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700"
              >
                حفظ التعديلات
              </button>
            </div>
          </div>
        </div>
      )}
`;

code = code.replace(/    <\/div>\n  \);\n\}\n$/, editModal + '    </div>\n  );\n}\n');

fs.writeFileSync('page_edit.tsx', code);
console.log('Done refactoring gallery');
