"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase/config";
import { collection, getDocs, query, orderBy, where } from "firebase/firestore";
import { ImageIcon, Download, Search } from "lucide-react";
import Image from "next/image";

export default function GenerationsPage() {
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        if (!db) {
          setLoading(false);
          return;
        }
        // Fetch logic
        const uid = auth?.currentUser?.uid || 'anonymous';
        const q = query(
          collection(db, "generated_images"),
          where("userId", "==", uid),
          orderBy("createdAt", "desc")
        );
        
        const querySnapshot = await getDocs(q);
        const fetched = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setImages(fetched);
      } catch (error) {
        console.error("Error fetching images:", error);
      } finally {
        setLoading(false);
      }
    };

    // Sometimes auth takes a second to initialize, so we listen to auth state
    const unsubscribe = auth?.onAuthStateChanged(() => {
      fetchImages();
    });
    
    fetchImages();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleDownload = async (url: string, name: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${name}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (e) {
      console.error("Download failed", e);
      // Fallback
      window.open(url, '_blank');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">الصور المولدة</h1>
          <p className="text-slate-500">مكتبة جميع صورك وتصاميمك السابقة محفوظة بأمان.</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-xl border shadow-sm flex items-center gap-2">
          <Search className="w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="البحث برقم الموديل..." 
            className="border-none outline-none text-sm bg-transparent w-48"
            onChange={(e) => {
              // basic client side filter if needed
            }}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600"></div>
        </div>
      ) : images.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed p-16 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
            <ImageIcon className="w-10 h-10 text-slate-300" />
          </div>
          <h2 className="text-xl font-bold text-slate-700 mb-2">لا توجد صور بعد</h2>
          <p className="text-slate-500 max-w-md">
            لم تقم بتوليد أي صور حتى الآن. ابدأ برفع منتجاتك وتوليد الصور لتراها هنا.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {images.map((img) => (
            <div key={img.id} className="bg-white rounded-2xl overflow-hidden border shadow-sm group relative">
              <div className="aspect-[3/4] relative bg-slate-100">
                <img 
                  src={img.previewUrl || img.cleanUrl} 
                  alt={img.sku || 'Generated Image'} 
                  className="w-full h-full object-cover"
                />
                
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-sm">
                  <button 
                    onClick={() => handleDownload(img.previewUrl || img.cleanUrl, img.sku || 'fashion-image')}
                    className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-slate-800 hover:scale-110 transition-transform shadow-lg"
                    title="تحميل"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm text-slate-800">{img.sku || 'بدون رقم'}</span>
                  <span className="text-xs font-medium px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg">
                    {img.sizes || 'بدون مقاس'}
                  </span>
                </div>
                {img.desc && (
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {img.desc}
                  </p>
                )}
                <div className="mt-3 text-[10px] text-slate-400">
                  {img.createdAt?.toDate ? new Date(img.createdAt.toDate()).toLocaleDateString('ar-SA') : ''}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
