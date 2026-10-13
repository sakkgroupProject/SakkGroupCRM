import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#0f172a",
};

export const metadata: Metadata = { 
  title: "SAKK Group CRM — Enterprise CRM & Business Management", 
  description: "SAKK Group CRM: clients, pipeline, quotations, contracts, projects, invoices, payments & allocations, expenses, vendors, documents, reports — PostgreSQL backed.",
  icons: { icon: "/logo.png", apple: "/logo.png" }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-100 text-slate-900 antialiased selection:bg-emerald-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}

