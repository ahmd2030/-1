const fs = require('fs');
let code = fs.readFileSync('app/(dashboard)/dashboard/products/new/page.tsx', 'utf8');

const oldButton = `<button 
                onClick={createCollage}
                className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 py-3 rounded-xl font-bold text-sm transition-colors mb-2 shadow-lg"
              >
                <Columns className="w-4 h-4" />
                دمج أول صورتين (كتالوج)
              </button>`;

const newButton = `<div className="bg-purple-50 p-4 rounded-xl border border-purple-100 shadow-sm mb-4">
                <h4 className="font-bold text-purple-900 text-right mb-1">✨ صانع أطقم الكتالوج</h4>
                <p className="text-xs text-purple-700 text-right mb-3">هل لديك طقم من قطعتين؟ قم بتوليد القطعة الأولى، ثم القطعة الثانية، ثم اضغط هنا لدمجهما معاً في صورة احترافية واحدة!</p>
                <button 
                  onClick={createCollage}
                  className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-bold text-sm transition-colors shadow-md"
                >
                  <Columns className="w-4 h-4" />
                  دمج أحدث صورتين في صورة واحدة
                </button>
              </div>`;

code = code.replace(oldButton, newButton);

fs.writeFileSync('app/(dashboard)/dashboard/products/new/page.tsx', code);
console.log('UI updated');
