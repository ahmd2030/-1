const fs = require('fs');
let code = fs.readFileSync('app/(dashboard)/dashboard/products/new/page.tsx', 'utf8');

const oldBtns = `<button 
                  onClick={downloadAllAsZip}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 py-3 rounded-xl font-bold text-sm transition-colors shadow-lg"
                >
                  <Download className="w-4 h-4" />
                  تحميل جميع الصور (ZIP)
                </button>
              </div>`;

const newBtns = `<button 
                  onClick={downloadAllAsZip}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 py-3 rounded-xl font-bold text-sm transition-colors shadow-lg mb-2"
                >
                  <Download className="w-4 h-4" />
                  تحميل جميع الصور (ZIP)
                </button>
                <button 
                  onClick={() => {
                    if(confirm('هل أنت متأكد من مسح جميع الصور من المعرض الجانبي؟ (لن تحذف من قاعدة البيانات الرئيسية)')) {
                      setGalleryImages([]);
                      localStorage.removeItem('ai_fashion_generated_images');
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-rose-100 text-rose-700 hover:bg-rose-200 py-2 rounded-xl font-bold text-xs transition-colors shadow-sm"
                >
                  مسح المعرض الجانبي
                </button>
              </div>`;

code = code.replace(oldBtns, newBtns);
fs.writeFileSync('app/(dashboard)/dashboard/products/new/page.tsx', code);
console.log('Added clear button');
