"use client";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/** The only part of the page that scrolls. The document itself never moves. */
export function Scroller({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const ref = useRef<HTMLDivElement>(null);

  // A new page starts at the top (anchors such as #projects keep their place).
  useEffect(() => { if (!window.location.hash) ref.current?.scrollTo(0, 0); }, [path]);

  // iOS shifts the whole screen up for the keyboard and may not put it back.
  useEffect(() => {
    const settle = () => setTimeout(() => window.scrollTo(0, 0), 120);
    document.addEventListener("focusout", settle);
    return () => document.removeEventListener("focusout", settle);
  }, []);

  return <div ref={ref} id="scroller" className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">{children}</div>;
}
