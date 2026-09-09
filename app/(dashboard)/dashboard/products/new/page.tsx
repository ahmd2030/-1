"use client";

import { useState, useCallback } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import Image from "next/image";
import { useDropzone } from "react-dropzone";
import { UploadCloud } from "lucide-react";

export default function NewProductPage() {
  const [step, setStep] = useState(1);
  const [image, setImage] = useState<{ url: string; file: File } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<"man" | "woman" | "boy" | "girl">("woman");

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setImage({
        url: URL.createObjectURL(file),
        file,
      });
      setStep(2);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    maxFiles: 1,
  });

  const handleGenerate = async () => {
    if (!image) return;
    setIsGenerating(true);
    try {
      const formData = new FormData();
      formData.append("file", image.file);
      formData.append("category", "one-pieces");
      formData.append("modelType", selectedModel);

      const res = await fetch("/api/generate", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "فشل توليد الصورة من الخادم");
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
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">إضافة منتج جديد</h1>
        <p className="text-muted-foreground">
          {step === 1 && "قم برفع صورة المنتج الحقيقية (على شماعة أو سطح مستوٍ أو مودل)."}
          {step === 2 && "اختر إعدادات الموديل والأسلوب للصورة الجديدة."}
          {step === 3 && "النتيجة النهائية لصورة منتجك."}
        </p>
      </div>

      <Card className="p-6">
        {step === 1 && (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors
              ${isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"}`}
          >
            <input {...getInputProps()} />
            <UploadCloud className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-1">اسحب وأفلت صورة المنتج هنا</h3>
            <p className="text-sm text-muted-foreground mb-4">أو اضغط لاختيار ملف من جهازك</p>
            <Button variant="secondary">اختيار صورة</Button>
          </div>
        )}

        {step === 2 && image && (
          <div className="space-y-6">
            <div className="aspect-square relative max-w-sm mx-auto rounded-xl overflow-hidden border">
              <Image src={image.url} alt="Product" fill className="object-cover" />
            </div>
            
            <div className="space-y-4">
              <h3 className="font-medium text-lg">إعدادات الموديل</h3>
              <div className="flex gap-4">
                <Button 
                  variant={selectedModel === "man" ? "default" : "outline"} 
                  className="flex-1"
                  onClick={() => setSelectedModel("man")}
                >
                  رجل
                </Button>
                <Button 
                  variant={selectedModel === "woman" ? "default" : "outline"} 
                  className="flex-1"
                  onClick={() => setSelectedModel("woman")}
                >
                  امرأة
                </Button>
                <Button 
                  variant={selectedModel === "boy" ? "default" : "outline"} 
                  className="flex-1"
                  onClick={() => setSelectedModel("boy")}
                >
                  طفل
                </Button>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
              <Button variant="ghost" onClick={() => setStep(1)}>رجوع</Button>
              <Button onClick={handleGenerate} disabled={isGenerating}>
                {isGenerating ? "جاري التوليد..." : "توليد الصورة الاحترافية"}
              </Button>
            </div>
          </div>
        )}
      </Card>

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
