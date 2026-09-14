const fs = require('fs');
let code = fs.readFileSync('app/(dashboard)/dashboard/products/new/page.tsx', 'utf8');

// Imports
if (!code.includes('import { db, auth } from "@/lib/firebase/config"')) {
  code = code.replace(/import \{ toast \} from "react-hot-toast";/, `import { toast } from "react-hot-toast";
import { db, auth } from "@/lib/firebase/config";
import { collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp, where } from "firebase/firestore";`);
}

// Fetch images from Firebase instead of localStorage
const oldUseEffect = `  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('ai_fashion_generated_images') || '[]');
      const normalized = saved.map((item: any) => {
        if (typeof item === 'string') {
          return { id: Math.random().toString(), cleanUrl: item, previewUrl: item, sizes: '', sku: '', desc: '' };
        }
        return item;
      });
      setGalleryImages(normalized);
    } catch(e) {}
  }, []); // Fixed race condition that erased RAM images when storage is full`;

const newUseEffect = `  useEffect(() => {
    const fetchImages = async () => {
      try {
        if (!db) return;
        const uid = auth?.currentUser?.uid || 'anonymous';
        const q = query(
          collection(db, "generated_images"), 
          where("userId", "==", uid),
          orderBy("createdAt", "desc"),
          limit(50)
        );
        const querySnapshot = await getDocs(q);
        const fetched = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (fetched.length > 0) {
          setGalleryImages(fetched);
        } else {
          // Fallback to localStorage for old guests
          const saved = JSON.parse(localStorage.getItem('ai_fashion_generated_images') || '[]');
          setGalleryImages(saved);
        }
      } catch(e) {
        console.warn("Failed to fetch from Firebase, using localStorage", e);
        const saved = JSON.parse(localStorage.getItem('ai_fashion_generated_images') || '[]');
        setGalleryImages(saved);
      }
    };
    fetchImages();
  }, []);`;

code = code.replace(oldUseEffect, newUseEffect);

// Save to Firebase in handleGenerate
const oldSaveSingle = `          const existing = JSON.parse(localStorage.getItem('ai_fashion_generated_images') || '[]');
          const newItem = { id: Math.random().toString(), cleanUrl: data.imageUrl, previewUrl: finalImageUrl, sizes, sku: productCode, desc: marketingDesc };
          const updated = [newItem, ...existing];
          try {
            localStorage.setItem('ai_fashion_generated_images', JSON.stringify(updated));
          } catch(e) {
            console.warn("Storage full, kept in RAM");
          }
          setGalleryImages(updated);`;

const newSaveSingle = `          const newItem = { 
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
            } catch (e) {
              console.error("Firebase save error", e);
            }
          }
          const itemWithId = { id: docId, ...newItem, createdAt: new Date() };
          
          setGalleryImages(prev => [itemWithId, ...prev]);
          try {
            const existing = JSON.parse(localStorage.getItem('ai_fashion_generated_images') || '[]');
            localStorage.setItem('ai_fashion_generated_images', JSON.stringify([itemWithId, ...existing].slice(0,10)));
          } catch(e) {}`;

code = code.replace(oldSaveSingle, newSaveSingle);

// Save to Firebase in processQueue
const oldSaveBulk = `            const newItem = { id: Math.random().toString(), cleanUrl: genData.imageUrl, previewUrl: finalImageUrl, sizes: genSizes, sku: genSku, desc: genDesc };
            currentGallery = [newItem, ...currentGallery];
            try {
              localStorage.setItem('ai_fashion_generated_images', JSON.stringify(currentGallery));
            } catch(e) {
              console.warn("Storage full, kept in RAM");
            }
            setGalleryImages([...currentGallery]); // trigger re-render`;

const newSaveBulk = `            const newItem = { 
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
              } catch (e) {}
            }
            const itemWithId = { id: docId, ...newItem, createdAt: new Date() };
            
            currentGallery = [itemWithId, ...currentGallery];
            setGalleryImages([...currentGallery]); // trigger re-render
            try {
              localStorage.setItem('ai_fashion_generated_images', JSON.stringify(currentGallery.slice(0,10)));
            } catch(e) {}`;

code = code.replace(oldSaveBulk, newSaveBulk);

fs.writeFileSync('app/(dashboard)/dashboard/products/new/page.tsx', code);
console.log('Firebase integrated');
