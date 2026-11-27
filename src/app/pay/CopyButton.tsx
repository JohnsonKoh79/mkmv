"use client";
import { useState } from "react";

export function CopyButton({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button type="button" className="min-h-11 border border-offwhite px-4 text-xs font-bold uppercase tracking-widest"
      onClick={async () => { try { await navigator.clipboard.writeText(text); setDone(true); } catch { /* clipboard blocked */ } }}>
      {done ? "Copied" : label}
    </button>
  );
}
