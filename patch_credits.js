const fs = require('fs');
let code = fs.readFileSync('app/(dashboard)/dashboard/products/new/page.tsx', 'utf8');

const oldFetch = `      .then(data => {
        if (data && typeof data.credits === 'number') {
          setFashnCredits(data.credits);
        }
      })`;

const newFetch = `      .then(data => {
        if (data && typeof data.credits === 'number') {
          setFashnCredits(data.credits);
        } else if (data && data.error) {
          setFashnCredits(-1); // -1 means API key error
        }
      })`;

code = code.replace(oldFetch, newFetch);

const oldBtn = `{fashnCredits !== null && (
            <div className="px-4 py-2.5 bg-amber-50 border border-amber-200 shadow-sm rounded-xl font-bold text-amber-700 flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <span className="text-sm">النقاط: {Math.floor(fashnCredits)}</span>
            </div>
          )}`;

const newBtn = `{fashnCredits !== null && (
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

code = code.replace(oldBtn, newBtn);

fs.writeFileSync('app/(dashboard)/dashboard/products/new/page.tsx', code);
