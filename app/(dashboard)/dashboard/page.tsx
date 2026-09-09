import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">لوحة التحكم</h1>
        <Link href="/dashboard/products/new" className={buttonVariants({ variant: "default" })}>
          <Plus className="ml-2 h-4 w-4" />
          إضافة منتج جديد
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>المنتجات</CardTitle>
            <CardDescription>إجمالي المنتجات المرفوعة</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">12</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>الصور المولدة</CardTitle>
            <CardDescription>إجمالي الصور الاحترافية</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">45</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>الرصيد</CardTitle>
            <CardDescription>الرصيد المتبقي (Credits)</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">150</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
