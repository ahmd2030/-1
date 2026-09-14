const fs = require('fs');
let code = fs.readFileSync('app/(dashboard)/dashboard/products/new/page.tsx', 'utf8');

if (!code.includes('import { db, auth }')) {
  code = code.replace('import { toast } from "react-hot-toast";', 'import { toast } from "react-hot-toast";\nimport { db, auth } from "@/lib/firebase/config";\nimport { collection, addDoc, serverTimestamp } from "firebase/firestore";');
}

// Fix single generate
let lines = code.split('\n');
let i = lines.findIndex(l => l.includes('const existing = JSON.parse(localStorage.getItem(\'ai_fashion_generated_images\') || \'[]\');'));
if (i > -1) {
  lines.splice(i, 8, 
`          const newItem = { 
            cleanUrl: data.imageUrl, 
            previewUrl: finalImageUrl, 
            sizes, 
            sku: productCode, 
            desc: marketingDesc,
            userId: auth?.currentUser?.uid || 'anonymous',
            createdAt: serverTimestamp()
          };
          let docId = Math.random().toString();
          if (db) {
            try {
              const docRef = await addDoc(collection(db, "generated_images"), newItem);
              docId = docRef.id;
            } catch (e) { console.error("Firebase err", e); }
          }
          const finalItem = { id: docId, ...newItem, createdAt: new Date() };
          
          setGalleryImages(prev => [finalItem, ...prev]);
          try {
            const existing = JSON.parse(localStorage.getItem('ai_fashion_generated_images') || '[]');
            localStorage.setItem('ai_fashion_generated_images', JSON.stringify([finalItem, ...existing].slice(0, 10)));
          } catch(e) {}`
  );
  console.log("Fixed handleGenerate");
}

code = lines.join('\n');
lines = code.split('\n');
let j = lines.findIndex(l => l.includes('const newItem = { id: Math.random().toString(), cleanUrl: genData.imageUrl, previewUrl: finalImageUrl, sizes: genSizes, sku: genSku, desc: genDesc };'));
if (j > -1) {
  lines.splice(j, 8,
`            const newItem = { 
              cleanUrl: genData.imageUrl, 
              previewUrl: finalImageUrl, 
              sizes: genSizes, 
              sku: genSku, 
              desc: genDesc,
              userId: auth?.currentUser?.uid || 'anonymous',
              createdAt: serverTimestamp()
            };
            let docId = Math.random().toString();
            if (db) {
              try {
                const docRef = await addDoc(collection(db, "generated_images"), newItem);
                docId = docRef.id;
              } catch (e) { console.error("Firebase err", e); }
            }
            const finalItem = { id: docId, ...newItem, createdAt: new Date() };
            currentGallery = [finalItem, ...currentGallery];
            setGalleryImages([...currentGallery]);
            try {
              localStorage.setItem('ai_fashion_generated_images', JSON.stringify(currentGallery.slice(0, 10)));
            } catch(e) {}`
  );
  console.log("Fixed processQueue");
}

fs.writeFileSync('app/(dashboard)/dashboard/products/new/page.tsx', lines.join('\n'));
