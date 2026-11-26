import { Suspense } from "react";
import { AdminBar } from "@/components/AdminBar";

export const field = "w-full min-h-11 border border-ink bg-offwhite px-3 py-2 text-base";
export const btn = "min-h-11 px-5 border border-ink uppercase text-xs font-bold tracking-wide";
export const btnDark = "min-h-11 px-5 bg-ink text-offwhite uppercase text-xs font-bold tracking-wide";

export function AdminShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <AdminBar />
      <main className="flex-1 px-4 py-6 max-w-3xl w-full mx-auto">
        <h1 className="font-display text-3xl mb-6"><span className="slant">{title}</span></h1>
        <Suspense fallback={null}>{children}</Suspense>
      </main>
    </>
  );
}

export const H = ({ children }: { children: React.ReactNode }) => (
  <h2 className="uppercase text-xs tracking-widest border-b border-ink pb-2 mb-4 mt-8">{children}</h2>
);
