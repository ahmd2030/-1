const fs = require('fs');
let code = fs.readFileSync('app/(dashboard)/dashboard/products/new/page.tsx', 'utf8');

// Change input to textarea
const oldInput = `<input type="text" value={sizes} onChange={e=>setSizes(e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-300 text-left" dir="ltr" placeholder="S.M.L | 2-5 Years" />`;
const newInput = `<textarea value={sizes} onChange={e=>setSizes(e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-300 text-left resize-none h-[42px] focus:h-24 transition-all" dir="ltr" placeholder="S.M.L \n2-5 Years" />`;
code = code.replace(oldInput, newInput);

// Update split logic to include \n
code = code.replace(/sizes\.split\(\/\[,\/\|،\]\/\)/, 'sizes.split(/[,/|،\\n]/)');

fs.writeFileSync('app/(dashboard)/dashboard/products/new/page.tsx', code);
console.log('Fixed sizes input');
