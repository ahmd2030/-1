const fs = require('fs');
let code = fs.readFileSync('app/(dashboard)/dashboard/products/new/page.tsx', 'utf8');

const target = `<FileArchive className="w-4 h-4" />
                  تحميل جميع الصور (ZIP)
                </button>`;

const replacement = `<FileArchive className="w-4 h-4" />
                  تحميل جميع الصور (ZIP)
                </button>
                <button 
                  onClick={() => {
                    if(confirm('هل أنت متأكد من مسح جميع الصور من المعرض الجانبي؟')) {
                      setGalleryImages([]);
                      localStorage.removeItem('ai_fashion_generated_images');
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-rose-100 text-rose-700 hover:bg-rose-200 py-2 rounded-xl font-bold text-xs transition-colors shadow-sm mt-2"
                >
                  مسح المعرض الجانبي
                </button>`;

code = code.replace(target, replacement);
fs.writeFileSync('app/(dashboard)/dashboard/products/new/page.tsx', code);
console.log('Fixed clear button');
