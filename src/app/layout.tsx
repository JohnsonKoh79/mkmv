import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import { Suspense } from "react";
import { MemberChrome } from "@/components/MemberChrome";
import "./globals.css";

const archivo = Archivo({ variable: "--font-archivo", subsets: ["latin"], axes: ["wdth"] });

export const metadata: Metadata = {
  title: "MKMV",
  description: "Make your move.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${archivo.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}<Suspense fallback={null}><MemberChrome /></Suspense></body>
    </html>
  );
}
