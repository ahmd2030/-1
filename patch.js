const fs = require('fs');
let code = fs.readFileSync('app/(dashboard)/dashboard/products/new/page.tsx', 'utf8');

code = code.replace(
  'const [galleryImages, setGalleryImages] = useState<any[]>([]);',
  'const [galleryImages, setGalleryImages] = useState<any[]>([]);\n  const [fashnCredits, setFashnCredits] = useState<number | null>(null);'
);

const fetchCredits = `
  useEffect(() => {
    fetch('/api/credits')
      .then(res => res.json())
      .then(data => {
        if (data && typeof data.credits === 'number') {
          setFashnCredits(data.credits);
        }
      })
      .catch(err => console.error('Failed to fetch credits'));
  }, []);
`;

code = code.replace(
  'useEffect(() => {\n    try {\n      const stored',
  fetchCredits + '\n  useEffect(() => {\n    try {\n      const stored'
);

const btnHtml = `{fashnCredits !== null && (
            <div className="px-4 py-2.5 bg-amber-50 border border-amber-200 shadow-sm rounded-xl font-bold text-amber-700 flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <span className="text-sm">النقاط: {Math.floor(fashnCredits)}</span>
            </div>
          )}
          <button onClick={() => setShowGallery(true)}`;

code = code.replace('<button onClick={() => setShowGallery(true)}', btnHtml);

fs.writeFileSync('app/(dashboard)/dashboard/products/new/page.tsx', code);
