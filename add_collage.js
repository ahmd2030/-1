const fs = require('fs');
let code = fs.readFileSync('app/(dashboard)/dashboard/products/new/page.tsx', 'utf8');

// 1. Add lucide import for Columns
code = code.replace(/import \{([^}]+)\} from 'lucide-react';/, "import {$1, Columns} from 'lucide-react';");

// 2. Add collage function
const collageFunc = `
  const createCollage = async () => {
    if (galleryImages.length < 2) {
      toast.error("يجب أن يكون لديك صورتين على الأقل في المعرض لدمجهما!");
      return;
    }
    toast.info("جاري دمج أول صورتين...");
    try {
      const img1Obj = galleryImages[0];
      const img2Obj = galleryImages[1];
      
      const url1 = typeof img1Obj === 'string' ? img1Obj : img1Obj.previewUrl;
      const url2 = typeof img2Obj === 'string' ? img2Obj : img2Obj.previewUrl;
      
      const loadImage = (src: string): Promise<HTMLImageElement> => {
        return new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => resolve(img);
          img.src = src;
        });
      };
      
      const i1 = await loadImage(url1);
      const i2 = await loadImage(url2);
      
      const canvas = document.createElement('canvas');
      canvas.width = i1.width + i2.width;
      canvas.height = Math.max(i1.height, i2.height);
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(i1, 0, 0, i1.width, i1.height);
      ctx.drawImage(i2, i1.width, 0, i2.width, i2.height);
      
      const finalBase64 = canvas.toDataURL('image/jpeg', 0.9);
      
      const newItem = {
        id: Math.random().toString(),
        cleanUrl: finalBase64,
        previewUrl: finalBase64,
        sizes: typeof img1Obj === 'string' ? '' : img1Obj.sizes,
        sku: typeof img1Obj === 'string' ? '' : img1Obj.sku,
        desc: typeof img1Obj === 'string' ? '' : img1Obj.desc
      };
      
      const updatedGallery = [newItem, ...galleryImages];
      setGalleryImages(updatedGallery);
      try {
        localStorage.setItem('ai_fashion_generated_images', JSON.stringify(updatedGallery));
      } catch(e) {}
      
      toast.success("تم دمج الصورتين بنجاح!");
    } catch(err) {
      console.error(err);
      toast.error("فشل دمج الصورتين");
    }
  };
`;

code = code.replace(/const handleGenerate = async \(\) => \{/, collageFunc + '\n  const handleGenerate = async () => {');

// 3. Add button to gallery header
const btnOld = `<button 
                onClick={printGalleryAsCatalogue}`;
const btnNew = `<button 
                onClick={createCollage}
                className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 py-3 rounded-xl font-bold text-sm transition-colors mb-2 shadow-lg"
              >
                <Columns className="w-4 h-4" />
                دمج أول صورتين معاً (للكتالوج)
              </button>
              <button 
                onClick={printGalleryAsCatalogue}`;
code = code.replace(btnOld, btnNew);

fs.writeFileSync('app/(dashboard)/dashboard/products/new/page.tsx', code);
console.log('Added Collage Engine');
