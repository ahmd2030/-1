import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Fashion Studio",
  description: "Professional Commercial Fashion Photography using AI",
};

import { Toaster } from "@/components/ui/sonner";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className="antialiased min-h-screen">
        {children}
        <Toaster position="bottom-center" />
      </body>
    </html>
  );
}
