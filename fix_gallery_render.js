const fs = require('fs');
let code = fs.readFileSync('app/(dashboard)/dashboard/products/new/page.tsx', 'utf8');

const regex = /galleryImages\.map\(\(url, i\) => \([\s\S]*?<img src=\{url\} className="w-full h-auto rounded-xl" alt="Generated" \/>[\s\S]*?<a href=\{url\} download=\{\`catalogue-\$\{i\}\.jpg\`\}[\s\S]*?<\/a>\s*<\/div>\s*<\/div>\s*\)\)/;

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

if (regex.test(code)) {
  code = code.replace(regex, renderNew);
  fs.writeFileSync('app/(dashboard)/dashboard/products/new/page.tsx', code);
  console.log('Fixed gallery render');
} else {
  console.log('Regex did not match!');
}
