"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  Home,
  Package,
  FolderOpen,
  Image as ImageIcon,
  Palette,
  LayoutTemplate,
  CreditCard,
  Settings,
} from "lucide-react";
import Link from "next/link";

const navItems = [
  { title: "الرئيسية", url: "/dashboard", icon: Home },
  { title: "المنتجات", url: "/dashboard/products", icon: Package },
  { title: "المشاريع", url: "/dashboard/projects", icon: FolderOpen },
  { title: "الصور المولدة", url: "/dashboard/generations", icon: ImageIcon },
  { title: "الهوية (Brand Kits)", url: "/dashboard/brands", icon: Palette },
  { title: "القوالب", url: "/dashboard/templates", icon: LayoutTemplate },
  { title: "الرصيد", url: "/dashboard/credits", icon: CreditCard },
  { title: "الإعدادات", url: "/dashboard/settings", icon: Settings },
];

export function AppSidebar() {
  return (
    <Sidebar side="right">
      <SidebarHeader className="p-4">
        <h2 className="text-xl font-bold">AI Fashion Studio</h2>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>القائمة الرئيسية</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton render={<Link href={item.url} />}>
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <div className="text-sm text-muted-foreground">
          الرصيد المتاح: 150 Credits
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
