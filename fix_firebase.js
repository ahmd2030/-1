const fs = require('fs');
let code = fs.readFileSync('app/(dashboard)/dashboard/products/new/page.tsx', 'utf8');

// 1. Add Firebase imports
if (!code.includes('import { db, auth } from "@/lib/firebase/config"')) {
  code = code.replace(/import \{ toast \} from "react-hot-toast";/, `import { toast } from "react-hot-toast";
import { db, auth } from "@/lib/firebase/config";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";`);
}

// 2. Replace handleGenerate save logic
const oldHandleGen = `const existing = JSON.parse(localStorage.getItem('ai_fashion_generated_images') || '[]');
          const newItem = { id: Math.random().toString(), cleanUrl: data.imageUrl, previewUrl: finalImageUrl, sizes, sku: productCode, desc: marketingDesc };
          const updated = [newItem, ...existing];
          try {
            localStorage.setItem('ai_fashion_generated_images', JSON.stringify(updated));
          } catch(e) {
            console.warn("Storage full, kept in RAM");
          }
          setGalleryImages(updated);`;

const newHandleGen = `const newItem = { 
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
          } catch(e) {}`;

if (code.includes(oldHandleGen)) {
  code = code.replace(oldHandleGen, newHandleGen);
  console.log("Replaced handleGenerate");
}

// 3. Replace processQueue save logic
const oldProcessQueue = `const newItem = { id: Math.random().toString(), cleanUrl: genData.imageUrl, previewUrl: finalImageUrl, sizes: genSizes, sku: genSku, desc: genDesc };
            currentGallery = [newItem, ...currentGallery];
            try {
              localStorage.setItem('ai_fashion_generated_images', JSON.stringify(currentGallery));
            } catch(e) {
              console.warn("Storage full, kept in RAM");
            }
            setGalleryImages([...currentGallery]);`;

const newProcessQueue = `const newItem = { 
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
            } catch(e) {}`;

if (code.includes(oldProcessQueue)) {
  code = code.replace(oldProcessQueue, newProcessQueue);
  console.log("Replaced processQueue");
}

fs.writeFileSync('app/(dashboard)/dashboard/products/new/page.tsx', code);
