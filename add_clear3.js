const fs = require('fs');
let code = fs.readFileSync('app/(dashboard)/dashboard/products/new/page.tsx', 'utf8');

const target = `                </button>
              </div>
            )}
          </div>`;

const replacement = `                </button>
                <button 
                  onClick={() => {
                    if(confirm('هل أنت متأكد من مسح المعرض الجانبي؟')) {
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
          </div>`;

// Actually let's just use string split and join
const lines = code.split('\n');
const idx = lines.findIndex(l => l.includes('onClick={downloadAllAsZip}'));
if (idx > -1) {
  // find the closing button tag
  let endIdx = idx;
  while (!lines[endIdx].includes('</button>')) {
    endIdx++;
  }
  lines.splice(endIdx + 1, 0, `                <button 
                  onClick={() => {
                    if(confirm('هل أنت متأكد من مسح جميع الصور المعلقة من المعرض الجانبي؟')) {
                      setGalleryImages([]);
                      localStorage.removeItem('ai_fashion_generated_images');
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-rose-100 text-rose-700 hover:bg-rose-200 py-2 rounded-xl font-bold text-xs transition-colors shadow-sm mt-2"
                >
                  مسح المعرض الجانبي
                </button>`);
  fs.writeFileSync('app/(dashboard)/dashboard/products/new/page.tsx', lines.join('\n'));
  console.log('Injected by line index!');
} else {
  console.log('Could not find onClick={downloadAllAsZip}');
}
