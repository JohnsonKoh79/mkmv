"use client";
import Image from "next/image";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { kitImage, rewardName, type Cut } from "@/lib/kit";
import { missionState } from "@/lib/missions";
import { ORDER_STATUS, rm } from "@/lib/orders";
import type { Step } from "@/lib/public";

export type MyStep = Step & { sizes: string[] };
export interface MyOrder { id: string; stepId: string; size: string; status: string; price: number }

const friendly = (m: string) =>
  m.includes("finish first") ? "Finish first. This one is earned."
  : m.includes("locked") ? "Not unlocked yet."
  : m.includes("price not set") ? "Price not set yet."
  : m.includes("duplicate") ? "Already ordered."
  : "That did not go through. Go again.";

export function MyMissions({ steps, level, finisher, orders, savedCut, payment, fixedCut = false }: {
  steps: MyStep[]; level: number; finisher: boolean; orders: MyOrder[]; savedCut: Cut; payment: string; fixedCut?: boolean;
}) {
  const router = useRouter();
  const [picked, setCut] = useState<Cut>(savedCut);
  const cut = fixedCut ? savedCut : picked;
  const [openId, setOpenId] = useState<string | null>(null);
  const [size, setSize] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [done, setDone] = useState<{ ref: string; price: number; label: string } | null>(null);
  const lock = useRef(false);

  function pickCut(c: Cut) {
    setCut(c);
    try { localStorage.setItem("mkmv_cut", c); } catch { /* private window */ }
    void supabaseBrowser().rpc("set_cut", { p_cut: c }).then(() => {});
  }

  async function order(s: MyStep) {
    if (lock.current || !size) return;
    lock.current = true; setBusy(true); setMsg("");
    const { data, error } = await supabaseBrowser().rpc("place_order", { step: s.id, p_size: size, p_cut: cut });
    lock.current = false; setBusy(false);
    if (error) return setMsg(friendly(error.message));
    setDone({ ref: String(data).slice(0, 6).toUpperCase(), price: s.isFree ? 0 : s.price ?? 0, label: rewardName(s) });
    setOpenId(null);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3.5">
      {!fixedCut && <div role="group" aria-label="Cut" className="flex gap-2">
        {([["m", "Men's"], ["w", "Women's"]] as const).map(([c, label]) => (
          <button key={c} type="button" aria-pressed={cut === c} onClick={() => pickCut(c)}
            className={`min-h-11 flex-1 border border-ink text-xs font-bold uppercase tracking-[0.14em] ${cut === c ? "bg-ink text-offwhite" : ""}`}>{label}</button>
        ))}
      </div>}

      {done && (
        <div role="status" className="wipe bg-ink p-5 text-offwhite">
          <p className="lbl">Ordered</p>
          <p className="h2 mt-2 !text-2xl">{done.label}</p>
          {done.price > 0 ? (
            <>
              <p className="mt-3 text-3xl font-extrabold tabular-nums">{rm(done.price)}</p>
              <p className="mt-2 whitespace-pre-line text-sm">{payment}</p>
              <p className="mt-2 text-sm font-bold">Reference: {done.ref}</p>
            </>
          ) : <p className="mt-3 text-sm">Nothing to pay. Earned. Reference: {done.ref}</p>}
          <p className="mt-3 text-xs opacity-80">Also under Me.</p>
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        {steps.map((s) => {
          const mine = orders.find((o) => o.stepId === s.id);
          const state = missionState(s, steps, level, finisher, Boolean(mine));
          const reserved = s.ink === "oxblood";
          const reached = state === "ordered" || state === "complete" || state === "held";
          const tone = reserved && reached ? "border-oxblood text-oxblood" : "border-ink";
          const fill = reserved && reached ? "bg-oxblood" : "bg-ink";
          const toGo = s.level - level;
          const chip = state === "ordered" ? "Ordered" : reached ? "Complete" : state === "progress" ? `${level} of ${s.level}` : "Locked";
          const buyable = s.isFree || s.price != null;
          return (
            <article key={s.id} className={`flex items-start gap-3 border bg-offwhite p-3 ${tone} ${state === "locked" ? "border-dashed" : ""}`}>
              <div className="relative h-[92px] w-[92px] shrink-0 overflow-hidden">
                <Image src={kitImage(s, cut)} alt={reached ? rewardName(s) : "Locked piece"} width={184} height={184} sizes="92px"
                  className={`h-full w-full object-contain ${!reached ? "opacity-90 brightness-0" : state === "held" ? "opacity-40" : ""}`} />
                {(state === "complete" || state === "ordered") && (
                  <span aria-hidden className={`absolute -left-2 -right-2 bottom-2 -rotate-[8deg] py-0.5 text-center text-[11px] font-extrabold uppercase tracking-[0.14em] text-offwhite ${fill}`}>Unlocked</span>
                )}
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="lbl !text-[10px]">{s.missionLabel}</p>
                  <p className={`lbl !text-[10px] border border-current px-1.5 py-0.5 ${reached ? `${fill} !border-transparent text-offwhite` : ""}`}>{chip}</p>
                </div>
                <h3 className="h2 !text-lg">{s.missionTitle}</h3>
                <p className="text-[13px]"><strong>Reward:</strong> {rewardName(s)}</p>
                <div className="flex gap-0.5" aria-hidden>
                  {Array.from({ length: s.level }, (_, i) => <span key={i} className={`h-1.5 flex-1 border border-current ${i < level ? "bg-current" : ""}`} />)}
                </div>

                {state === "ordered" && mine && <p className="text-[13px] font-bold">Size {mine.size} · {ORDER_STATUS[mine.status] ?? mine.status}</p>}
                {state === "held" && <p className="text-[13px]">Yours to buy when you finish.</p>}
                {(state === "progress" || state === "locked") && (
                  <p className="text-[13px] font-bold">
                    {toGo} {toGo === 1 ? "session" : "sessions"} to go.{s.isFree ? " Earned when you finish." : s.release === "on_finish" ? " Yours to buy when you finish." : ""}
                  </p>
                )}
                {state === "complete" && openId !== s.id && (
                  <>
                    <button type="button" disabled={!buyable} onClick={() => { setOpenId(s.id); setSize(""); setMsg(""); setDone(null); }}
                      className="min-h-11 border border-ink bg-ink px-4 text-[13px] font-bold uppercase tracking-[0.14em] text-offwhite disabled:opacity-50">Get it</button>
                    <p className="text-xs">{s.isFree ? "Earned" : s.price != null ? rm(s.price) : "Price soon"}</p>
                  </>
                )}
                {state === "complete" && openId === s.id && (
                  <div className="flex flex-col gap-2">
                    <div role="group" aria-label="Size" className="flex flex-wrap gap-2">
                      {s.sizes.map((z) => (
                        <button key={z} type="button" aria-pressed={size === z} onClick={() => setSize(z)}
                          className={`min-h-11 min-w-11 border border-current px-3 font-bold ${size === z ? `${fill} text-offwhite` : ""}`}>{z}</button>
                      ))}
                    </div>
                    {s.hasCut && <p className="text-xs">Cut: {cut === "w" ? "Women's" : "Men's"}</p>}
                    <button type="button" disabled={!size || busy} onClick={() => order(s)}
                      className="min-h-11 border border-ink bg-ink px-4 text-[13px] font-bold uppercase tracking-[0.14em] text-offwhite disabled:opacity-50">
                      {busy ? "Ordering…" : !size ? "Pick a size" : s.isFree ? "Confirm" : `Confirm · ${rm(s.price ?? 0)}`}
                    </button>
                    <button type="button" onClick={() => setOpenId(null)} className="min-h-11 text-xs font-bold uppercase tracking-widest underline">Not now</button>
                    {msg && <p role="alert" className="border border-current p-2 text-[13px]">{msg}</p>}
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
