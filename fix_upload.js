const fs = require('fs');
let code = fs.readFileSync('app/(dashboard)/dashboard/products/new/page.tsx', 'utf8');

const oldHandle = `const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      if (event.target?.result) {
        const b64 = event.target.result as string;
        setBase64Image(b64);
        analyzeGarment(b64);
      }
    };
    reader.readAsDataURL(selectedFile);
  };`;

const newHandle = `const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    if (e.target.files.length > 1) {
      setIsBulkMode(true);
      setQueue(Array.from(e.target.files));
      setFile(e.target.files[0]);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) setBase64Image(event.target.result as string);
      };
      reader.readAsDataURL(e.target.files[0]);
      toast.success(\`تم إضافة \${e.target.files.length} صور للطابور. اضغط زر التوليد الجماعي للبدء!\`);
    } else {
      setIsBulkMode(false);
      setQueue([]);
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      const reader = new FileReader();
      reader.onload = async (event) => {
        if (event.target?.result) {
          const b64 = event.target.result as string;
          setBase64Image(b64);
          analyzeGarment(b64);
        }
      };
      reader.readAsDataURL(selectedFile);
    }
  };`;

code = code.replace(oldHandle, newHandle);

code = code.replace(/<input type="file" accept="image\/\*" onChange=\{handleFileSelect\} className="hidden" \/>/g, `<input type="file" accept="image/*" multiple onChange={handleFileSelect} className="hidden" />`);

fs.writeFileSync('app/(dashboard)/dashboard/products/new/page.tsx', code);
console.log('Fixed upload handler');
