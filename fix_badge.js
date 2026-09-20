const fs = require('fs');
let code = fs.readFileSync('app/(dashboard)/dashboard/products/new/page.tsx', 'utf8');

// Replace the conditional badge with an always-visible one
const oldBadge = `{fashnCredits !== null && (
            <div className={\`px-4 py-2.5 shadow-sm rounded-xl font-bold flex items-center gap-2 \${fashnCredits < 0 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'}\`}>
              {fashnCredits >= 0 && (
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
              )}
              <span className="text-sm">
                {fashnCredits < 0 ? 'مفتاح Fashn غير صالح' : \`النقاط: \${Math.floor(fashnCredits)}\`}
              </span>
            </div>
          )}`;

const newBadge = `<div className={\`px-4 py-2.5 border shadow-sm rounded-xl font-bold flex items-center gap-2 \${fashnCredits === null ? 'bg-slate-100 text-slate-400 border-slate-200' : fashnCredits < 0 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'}\`}>
            {fashnCredits !== null && fashnCredits >= 0 && (
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
            )}
            <span className="text-sm">
              {fashnCredits === null ? '...' : fashnCredits < 0 ? 'مفتاح Fashn خاطئ' : \`النقاط: \${Math.floor(fashnCredits)}\`}
            </span>
          </div>`;

code = code.replace(oldBadge, newBadge);

fs.writeFileSync('app/(dashboard)/dashboard/products/new/page.tsx', code);
console.log('Badge always-visible patch applied');
