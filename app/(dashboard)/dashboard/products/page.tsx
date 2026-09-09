import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import Link from "next/link";

export default function ProductsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">المنتجات</h1>
          <p className="text-muted-foreground">قم بإدارة منتجاتك وتوليد صور احترافية لها.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/products/new">
            <Plus className="ml-2 h-4 w-4" /> إضافة منتج جديد
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-24 text-center">
          <div className="rounded-full bg-primary/10 p-4 mb-4">
            <Plus className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-xl font-medium mb-2">لا توجد منتجات بعد</h3>
          <p className="text-muted-foreground max-w-sm mb-6">
            قم بإضافة منتجك الأول الآن لتتمكن من توليد صور احترافية باستخدام الذكاء الاصطناعي.
          </p>
          <Button asChild>
            <Link href="/dashboard/products/new">
              إضافة منتج جديد
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
