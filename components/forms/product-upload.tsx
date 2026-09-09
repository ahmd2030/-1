"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, X } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";

interface ProductUploadProps {
  onImageSelected: (file: File, previewUrl: string) => void;
}

export function ProductUpload({ onImageSelected }: ProductUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      setFile(selectedFile);
      const url = URL.createObjectURL(selectedFile);
      setPreview(url);
      onImageSelected(selectedFile, url);
    }
  }, [onImageSelected]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpeg", ".jpg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
    },
    maxFiles: 1,
  });

  const clearFile = () => {
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="p-6">
        {!preview ? (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors
              ${isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"}`}
          >
            <input {...getInputProps()} />
            <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-1">
              {isDragActive ? "أفلت الصورة هنا" : "اسحب وأفلت صورة المنتج هنا"}
            </p>
            <p className="text-sm text-muted-foreground">
              أو انقر لاختيار ملف (JPG, PNG, WEBP)
            </p>
          </div>
        ) : (
          <div className="relative rounded-lg overflow-hidden border">
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 z-10 rounded-full"
              onClick={clearFile}
            >
              <X className="h-4 w-4" />
            </Button>
            <div className="relative aspect-square w-full max-w-sm mx-auto">
              <Image
                src={preview}
                alt="Product Preview"
                fill
                className="object-contain"
              />
            </div>
            <div className="p-4 bg-muted/50 border-t flex justify-between items-center">
              <span className="text-sm font-medium truncate dir-ltr">{file?.name}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
