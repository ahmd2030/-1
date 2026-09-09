import { ProductUpload } from "@/components/forms/product-upload";

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">إضافة منتج جديد</h1>
        <p className="text-muted-foreground">
          قم برفع صورة المنتج الحقيقية (على شماعة أو سطح مستوٍ أو مودل).
        </p>
      </div>
      
      <div className="py-8">
        <ProductUpload />
      </div>
    </div>
  );
}
