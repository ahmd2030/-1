const fs = require('fs');
let code = fs.readFileSync('page_edit2.tsx', 'utf8');

// 1. Add queueStatus state
code = code.replace(/const \[queue, setQueue\] = useState<File\[\]>\(\[\]\);/,
`const [queue, setQueue] = useState<File[]>([]);
  const [queueStatus, setQueueStatus] = useState<{status: string, error?: string}[]>([]);`);

// 2. Initialize queueStatus on select
code = code.replace(/setQueue\(Array\.from\(e\.target\.files\)\);/, 
`setQueue(Array.from(e.target.files));
        setQueueStatus(Array.from(e.target.files).map(() => ({ status: 'waiting' })));`);

// 3. Update processQueue to use setQueueStatus
code = code.replace(/setProcessingIndex\(i\);\n\s*try \{/g, 
`setProcessingIndex(i);
        setQueueStatus(prev => prev.map((s, idx) => idx === i ? { status: 'analyzing' } : s));
        try {`);

code = code.replace(/\/\/ 3\. Generate Image/g, 
`setQueueStatus(prev => prev.map((s, idx) => idx === i ? { status: 'generating' } : s));
          // 3. Generate Image`);

code = code.replace(/setGalleryImages\(\[\.\.\.currentGallery\]\); \/\/ trigger re-render\n\s*\}/g, 
`setGalleryImages([...currentGallery]); // trigger re-render
            setQueueStatus(prev => prev.map((s, idx) => idx === i ? { status: 'done' } : s));
          } else if (genData.error) {
            throw new Error(genData.error);
          }`);

code = code.replace(/console\.error\("Error processing item", i, err\);\n\s*\}/g,
`console.error("Error processing item", i, err);
          setQueueStatus(prev => prev.map((s, idx) => idx === i ? { status: 'error', error: err.message || "فشلت العملية" } : s));
        }`);

// 4. Render Queue Status UI
const queueUI = `
            {isBulkMode && queue.length > 0 && (
              <div className="bg-white p-4 rounded-xl border border-slate-200 mb-6 space-y-2 max-h-60 overflow-y-auto" dir="rtl">
                 <h4 className="font-bold text-slate-800 mb-3">طابور التوليد ({queue.length} صور)</h4>
                 {queue.map((file, i) => (
                    <div key={i} className="flex justify-between items-center text-sm p-3 bg-slate-50 rounded-lg border border-slate-100">
                       <span className="truncate w-40 font-medium text-slate-600" dir="ltr">{file.name}</span>
                       <span className="text-left">
                         {(!queueStatus[i] || queueStatus[i].status === 'waiting') && <span className="text-slate-400 font-bold">في الانتظار ⏳</span>}
                         {queueStatus[i]?.status === 'analyzing' && <span className="text-blue-500 font-bold flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin"/> يقرأ المقاس...</span>}
                         {queueStatus[i]?.status === 'generating' && <span className="text-indigo-500 font-bold flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin"/> يرسم الموديل...</span>}
                         {queueStatus[i]?.status === 'done' && <span className="text-emerald-500 font-bold">اكتملت ✅</span>}
                         {queueStatus[i]?.status === 'error' && <span className="text-red-500 font-bold" title={queueStatus[i]?.error}>فشلت ❌</span>}
                       </span>
                    </div>
                 ))}
              </div>
            )}
`;

code = code.replace(/\{error && \(\n\s*<div className="bg-red-50/, queueUI + '\n              {error && (\n                <div className="bg-red-50');

fs.writeFileSync('page_edit2.tsx', code);
console.log('Done adding queue UI');
