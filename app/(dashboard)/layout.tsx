import { SidebarProvider } from "@/components/ui/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <main className="flex-1 overflow-x-hidden p-0 md:p-6 w-full">
        {children}
      </main>
    </SidebarProvider>
  );
}
