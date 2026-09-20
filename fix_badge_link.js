const fs = require('fs');
let code = fs.readFileSync('app/(dashboard)/dashboard/products/new/page.tsx', 'utf8');

const oldDiv = '<div className=\"px-4 py-2.5 border shadow-sm rounded-xl font-bold flex items-center gap-2 bg-amber-50 text-amber-700 border-amber-200\">';

if (code.includes(oldDiv)) {
  // Find the badge start and end
  const start = code.indexOf(oldDiv);
  // Find the closing </div> for this block - count nesting
  let depth = 0;
  let i = start;
  let foundEnd = -1;
  while (i < code.length) {
    if (code[i] === '<' && code[i+1] === 'd' && code[i+2] === 'i' && code[i+3] === 'v') depth++;
    if (code[i] === '<' && code[i+1] === '/' && code[i+2] === 'd' && code[i+3] === 'i' && code[i+4] === 'v') {
      depth--;
      if (depth === 0) {
        foundEnd = i + 6; // include </div>
        break;
      }
    }
    i++;
  }
  
  if (foundEnd > -1) {
    const before = code.substring(0, start);
    const after = code.substring(foundEnd);
    const newBadge = `<a href="https://fashn.ai/dashboard" target="_blank" rel="noopener noreferrer" className="px-4 py-2.5 border border-amber-200 bg-amber-50 shadow-sm rounded-xl font-bold text-amber-700 flex items-center gap-2 hover:bg-amber-100 transition-colors">\r\n              {fashnCredits !== null && fashnCredits > 0 ? (\r\n                <span className="text-sm">💳 النقاط: {Math.floor(fashnCredits)}</span>\r\n              ) : (\r\n                <span className="text-sm">💳 رصيد Fashn</span>\r\n              )}\r\n            </a>`;
    code = before + newBadge + after;
    console.log('Done! Badge replaced at index', start);
  } else {
    console.log('Could not find end of badge div, depth stuck at:', depth);
  }
} else {
  console.log('Old div not found');
}

fs.writeFileSync('app/(dashboard)/dashboard/products/new/page.tsx', code);
