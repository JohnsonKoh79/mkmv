"use client";
import Image from "next/image";
import { useState, useSyncExternalStore } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { Step } from "@/lib/public";
import { kitImage, rewardName, type Cut } from "@/lib/kit";

const KEY = "mkmv_cut";
const readCut = (): Cut | null => {
  try { const v = localStorage.getItem(KEY); return v === "m" || v === "w" ? v : null; } catch { return null; }
};
const subscribe = (fn: () => void) => { window.addEventListener("storage", fn); return () => window.removeEventListener("storage", fn); };

/** Mission cards. `locked` shows the preview for someone without a seat; otherwise the public catalogue. */
export function Missions({ steps, signedIn, savedCut, fixedCut = false, locked = false }: { steps: Step[]; signedIn: boolean; savedCut: Cut; fixedCut?: boolean; locked?: boolean }) {
  const [picked, setPicked] = useState<Cut | null>(null);
  const stored = useSyncExternalStore(subscribe, readCut, () => null);
  // A member whose gender is known only ever sees their own cut.
  const cut: Cut = fixedCut ? savedCut : picked ?? (signedIn ? savedCut : stored ?? savedCut);

  function pick(c: Cut) {
    setPicked(c);
    try { localStorage.setItem(KEY, c); } catch { /* private window */ }
    if (signedIn) void supabaseBrowser().rpc("set_cut", { p_cut: c }).then(() => {});
  }

  return (
    <div className="flex flex-col gap-3.5">
      {!fixedCut && <div role="group" aria-label="Cut" className="flex gap-2">
        {([["m", "Men's"], ["w", "Women's"]] as const).map(([c, label]) => (
          <button key={c} type="button" aria-pressed={cut === c} onClick={() => pick(c)}
            className={`min-h-11 flex-1 border border-ink text-xs font-bold uppercase tracking-[0.14em] ${cut === c ? "bg-ink text-offwhite" : ""}`}>{label}</button>
        ))}
      </div>}
      <div className="flex flex-col gap-2.5">
        {steps.map((s) => {
          const reserved = s.ink === "oxblood";
          const tone = reserved && !locked ? "border-oxblood text-oxblood" : "border-ink";
          const line = locked
            ? `${s.level} sessions to go.`
            : s.isFree ? "Earned. The finisher award, in a men's or women's cut."
            : s.release === "on_finish" ? "Complete it, then finish the project, and you can buy it."
            : "Complete it and you can buy this piece.";
          return (
            <article key={s.id} className={`flex items-start gap-3 border bg-offwhite p-3 ${tone} ${locked ? "border-dashed" : ""}`}>
              <Image src={kitImage(s, cut)} alt={locked ? "Locked piece" : rewardName(s)} width={184} height={184} sizes="92px"
                className={`h-[92px] w-[92px] shrink-0 object-contain ${locked ? "opacity-90 brightness-0" : ""}`} />
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="lbl !text-[10px]">{s.missionLabel}</p>
                  <p className="lbl !text-[10px] border border-current px-1.5 py-0.5">{locked ? "Locked" : `${s.level} sessions`}</p>
                </div>
                <h3 className="h2 !text-lg">{s.missionTitle}</h3>
                <p className="text-[13px]"><strong>Reward:</strong> {rewardName(s)}</p>
                <div className="flex gap-0.5" aria-hidden>
                  {Array.from({ length: s.level }, (_, i) => <span key={i} className="h-1.5 flex-1 border border-current" />)}
                </div>
                <p className="text-[13px]">{line}</p>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
