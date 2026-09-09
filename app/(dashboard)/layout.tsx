import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1 overflow-x-hidden p-6">
        <SidebarTrigger className="mb-4" />
        {children}
      </main>
    </SidebarProvider>
  );
}
