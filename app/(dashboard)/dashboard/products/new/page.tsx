"use client";

import { useState } from "react";
import { ProductUpload } from "@/components/forms/product-upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import Image from "next/image";

export default function NewProductPage() {
  const [step, setStep] = useState(1);
  const [image, setImage] = useState<{ file: File; url: string } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);

  const handleImageSelected = (file: File, url: string) => {
    setImage({ file, url });
  };

  const handleGenerate = async () => {
    if (!image) return;
    setIsGenerating(true);
    try {
      // 1. Upload to Firebase Storage
      const { storage } = await import("@/lib/firebase/config");
      const { ref, uploadBytes, getDownloadURL } = await import("firebase/storage");
      
      const fileName = `products/${Date.now()}-${image.file.name}`;
      const storageRef = ref(storage, fileName);
      await uploadBytes(storageRef, image.file);
      const garmentImageUrl = await getDownloadURL(storageRef);

      // 2. Call our API route
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          garmentImage: garmentImageUrl,
          category: "tshirt",
          modelType: "woman",
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "فشل توليد الصورة");
      }

      const data = await res.json();
      setResultImage(data.imageUrl);
      setStep(3);
      toast.success("تم التوليد بنجاح!");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col gap-2 text-center mb-8">
        <h1 className="text-3xl font-bold">إضافة منتج جديد</h1>
        <p className="text-muted-foreground">
          {step === 1 && "قم برفع صورة المنتج الحقيقية (على شماعة أو سطح مستوٍ أو مودل)."}
          {step === 2 && "اختر إعدادات الموديل والأسلوب للصورة الجديدة."}
          {step === 3 && "النتيجة النهائية لصورة منتجك."}
        </p>
      </div>
      
      {step === 1 && (
        <div className="py-8 flex flex-col items-center gap-6">
          <ProductUpload onImageSelected={handleImageSelected} />
          {image && (
            <Button size="lg" onClick={() => setStep(2)}>
              التالي: إعدادات الصورة
            </Button>
          )}
        </div>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>إعدادات الموديل (تجريبي)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-4">
              <Button variant="outline" className="flex-1">رجل</Button>
              <Button variant="outline" className="flex-1">امرأة</Button>
              <Button variant="outline" className="flex-1">طفل</Button>
            </div>
            
            <div className="flex justify-end gap-4 mt-8">
              <Button variant="ghost" onClick={() => setStep(1)} disabled={isGenerating}>رجوع</Button>
              <Button onClick={handleGenerate} disabled={isGenerating}>
                {isGenerating ? "جاري التوليد..." : "توليد الصورة الاحترافية"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && resultImage && (
        <Card>
          <CardHeader>
            <CardTitle className="text-center">النتيجة الاحترافية</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-6">
            <div className="relative w-full max-w-md aspect-[4/5] rounded-xl overflow-hidden border">
              <Image src={resultImage} alt="Generated Model" fill className="object-cover" />
            </div>
            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setStep(2)}>تعديل الإعدادات</Button>
              <Button>حفظ ونشر</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
