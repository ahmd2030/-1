import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-6 py-4 flex items-center justify-between border-b">
        <h1 className="text-2xl font-bold">AI Fashion Studio</h1>
        <nav className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium hover:underline">
            تسجيل الدخول
          </Link>
          <Link href="/dashboard" className={buttonVariants({ variant: "default" })}>
            لوحة التحكم
          </Link>
        </nav>
      </header>
      
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 max-w-4xl">
          حوّل صور ملابسك إلى جلسات تصوير احترافية بالذكاء الاصطناعي
        </h2>
        <p className="text-xl text-muted-foreground mb-10 max-w-2xl">
          بدون مودل. بدون استوديو. بدون جلسة تصوير. احصل على صور تجارية عالية الجودة لمنتجاتك في ثوانٍ معدودة.
        </p>
        <div className="flex gap-4">
          <Link href="/dashboard/products/new" className={buttonVariants({ variant: "default", size: "lg" })}>
            ابدأ الآن
            <ArrowLeft className="mr-2 h-5 w-5" />
          </Link>
          <Link href="#how-it-works" className={buttonVariants({ variant: "outline", size: "lg" })}>
            كيف يعمل؟
          </Link>
        </div>
      </main>
    </div>
  );
}
