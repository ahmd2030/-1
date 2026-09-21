const fs = require('fs');
let code = fs.readFileSync('app/(dashboard)/dashboard/products/new/page.tsx', 'utf8');

// 1. Add the state variable
const stateInject = `  const [editingItem, setEditingItem] = useState<any>(null);
  const [dualMode, setDualMode] = useState<'front-back' | 'two-colors'>('front-back');`;
code = code.replace('  const [editingItem, setEditingItem] = useState<any>(null);', stateInject);

// 2. Change the UI labels dynamically
const uiInject = `<span className="absolute -top-3 right-4 bg-white px-2 text-xs font-bold text-slate-500">
                    {dualMode === 'front-back' ? 'المنتج من الأمام' : 'اللون الأول'}
                  </span>`;
code = code.replace(/<span className="absolute -top-3 right-4 bg-white px-2 text-xs font-bold text-slate-500">\s*المنتج من الأمام\s*<\/span>/g, uiInject);

const uiInjectBack = `<span className="absolute -top-3 right-4 bg-white px-2 text-xs font-bold text-slate-500">
                    {dualMode === 'front-back' ? 'المنتج من الخلف (اختياري)' : 'اللون الثاني (اختياري)'}
                  </span>`;
code = code.replace(/<span className="absolute -top-3 right-4 bg-white px-2 text-xs font-bold text-slate-500">\s*المنتج من الخلف \(اختياري\)\s*<\/span>/g, uiInjectBack);

// 3. Add the toggle switch above the uploader
const toggleHtml = `            <div className="flex items-center justify-between mb-4 bg-slate-50 p-2 rounded-lg border border-slate-100">
              <span className="text-sm font-semibold text-slate-600">طبيعة الصور المرفوعة:</span>
              <div className="flex bg-slate-200 p-1 rounded-md">
                <button 
                  onClick={() => setDualMode('front-back')}
                  className={\`px-3 py-1.5 text-xs font-bold rounded-sm transition-colors \${dualMode === 'front-back' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}\`}
                >
                  أمام وخلف
                </button>
                <button 
                  onClick={() => setDualMode('two-colors')}
                  className={\`px-3 py-1.5 text-xs font-bold rounded-sm transition-colors \${dualMode === 'two-colors' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}\`}
                >
                  تشكيلة ألوان
                </button>
              </div>
            </div>`;
// Find the exact place to inject the toggle
code = code.replace('<div className="flex gap-4">', toggleHtml + '\n            <div className="flex gap-4">');

// 4. Fix the prompt logic
const oldPrompt = 'const backPrompt = `Model is facing backwards, walking away from the camera, showing the BACK of the garment. ${stylePrompt}`;';
const newPrompt = 'const backPrompt = dualMode === \'front-back\' ? `Model is facing backwards, walking away from the camera, showing the BACK of the garment. ${stylePrompt}` : stylePrompt;';
code = code.replace(oldPrompt, newPrompt);

fs.writeFileSync('app/(dashboard)/dashboard/products/new/page.tsx', code);
console.log('Successfully patched for color variations!');
