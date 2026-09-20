const fs = require('fs');
let code = fs.readFileSync('app/(dashboard)/dashboard/products/new/page.tsx', 'utf8');

// Count how many times the pattern appears
const count = (code.match(/\{fashnCredits !== null/g) || []).length;
console.log('Found fashnCredits !== null occurrences:', count);

// Replace with a simpler always-visible version 
code = code.replace(
  `{fashnCredits !== null && (
              <div className={\`px-4 py-2.5 shadow-sm rounded-xl font-bold flex items-center gap-2 \${fashnCredits < 0 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'}\`}>
              {fashnCredits >= 0 && (
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                )},
                <span className="text-sm">
                  {fashnCredits < 0 ? 'مفتاح Fashn غير صالح' : \`النقاط: \${Math.floor(fashnCredits)}\`}
                </span>
              </div>`,
  `PLACEHOLDER_NOT_FOUND`
);

// Direct approach - find and replace the badge section
const badgeStart = code.indexOf('{fashnCredits !== null');
console.log('Badge starts at index:', badgeStart);
if (badgeStart > -1) {
  const before = code.substring(0, badgeStart);
  const after = code.substring(badgeStart);
  // Find the end of this JSX block (look for next sibling div)
  const endPattern = '          <button onClick';
  const endIdx = after.indexOf(endPattern);
  console.log('End found at:', endIdx);
  if (endIdx > -1) {
    const newBadge = `<div className="px-4 py-2.5 border shadow-sm rounded-xl font-bold flex items-center gap-2 bg-amber-50 text-amber-700 border-amber-200">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <span className="text-sm">
                {fashnCredits === null ? 'جاري التحميل...' : fashnCredits < 0 ? 'مفتاح Fashn خاطئ' : \`النقاط: \${Math.floor(fashnCredits)}\`}
              </span>
            </div>
          ` + endPattern;
    
    code = before + newBadge + after.substring(endIdx + endPattern.length);
    console.log('Replacement done');
  }
}

fs.writeFileSync('app/(dashboard)/dashboard/products/new/page.tsx', code);
console.log('Saved');
