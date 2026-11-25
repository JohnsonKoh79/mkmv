"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

export interface ShopStep {
  id: string; level: number; product: string; ink: "black" | "oxblood"; isFree: boolean;
  state: "locked" | "unlocked" | "payable" | "free" | "held" | "ordered"; price: number | null; sizes: string[];
}
export interface ShopOrder { id: string; label: string; size: string; status: string; price: number }

const STATUS: Record<string, string> = { preordered: "Pre-ordered", paid: "Paid", sent_to_printer: "Sent to printer", handed_over: "Handed over" };
const friendly = (m: string) =>
  m.includes("finish first") ? "Finish first. This one is earned."
  : m.includes("locked") ? "Not unlocked yet."
  : m.includes("price not set") ? "Price not set yet."
  : m.includes("duplicate") ? "Already ordered."
  : "Order failed. Go again.";
const rm = (n: number) => `RM ${n.toFixed(2)}`;

export function Shop({ steps, orders, payment }: { steps: ShopStep[]; orders: ShopOrder[]; payment: string }) {
  const router = useRouter();
  const [cart, setCart] = useState<Record<string, string>>({}); // stepId -> size
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const byId = new Map(steps.map((s) => [s.id, s]));
  const items = Object.entries(cart).map(([id, size]) => ({ step: byId.get(id)!, size }));
  const total = items.reduce((n, i) => n + (i.step.isFree ? 0 : i.step.price ?? 0), 0);

  async function checkout() {
    setBusy(true); setMsg("");
    const db = supabaseBrowser();
    for (const { step, size } of items) {
      const { error } = await db.rpc("place_order", { step: step.id, p_size: size });
      if (error) { setBusy(false); return setMsg(`${step.product}: ${friendly(error.message)}`); }
    }
    setBusy(false); setCart({}); router.refresh();
  }
  async function cancel(id: string) {
    await supabaseBrowser().rpc("cancel_order", { oid: id });
    router.refresh();
  }

  const unpaid = orders.filter((o) => o.status === "preordered");
  const due = unpaid.reduce((n, o) => n + o.price, 0);

  return (
    <div className="mt-6 space-y-8">
      <ul className="space-y-3">
        {steps.map((s) => {
          const open = s.state === "payable" || s.state === "free";
          const unlocked = s.state !== "locked";
          const band = !unlocked ? "border-dashed" : s.ink === "oxblood" ? "bg-oxblood text-offwhite" : "bg-ink text-offwhite";
          const picked = cart[s.id];
          return (
            <li key={s.id} className="border border-ink">
              <div className={`flex items-baseline justify-between p-3 ${band}`}>
                <span className="font-display text-xl">{s.product}</span>
                <span className="uppercase text-xs tracking-widest">LV {s.level} · {s.ink}</span>
              </div>
              <div className="p-3 text-sm">
                {s.state === "locked" && <p className="uppercase tracking-wide">Locked · reach LV {s.level}</p>}
                {s.state === "held" && <p className="uppercase tracking-wide">Unlocked · Available when you finish</p>}
                {s.state === "ordered" && <p className="uppercase tracking-wide">Ordered</p>}
                {open && (
                  <>
                    <p className="uppercase tracking-wide mb-2">{s.isFree ? "Earned" : s.price == null ? "Price soon" : rm(s.price)}</p>
                    {(s.isFree || s.price != null) && (
                      <>
                        <div className="flex flex-wrap gap-2" role="group" aria-label={`Size for ${s.product}`}>
                          {s.sizes.map((z) => (
                            <button key={z} type="button" aria-pressed={picked === z}
                              onClick={() => setCart((c) => ({ ...c, [s.id]: z }))}
                              className={`min-h-11 min-w-11 px-3 border border-ink font-bold ${picked === z ? "bg-ink text-offwhite" : ""}`}>{z}</button>
                          ))}
                        </div>
                        {picked && (
                          <button type="button" onClick={() => setCart((c) => { const n = { ...c }; delete n[s.id]; return n; })}
                            className="mt-2 min-h-11 underline uppercase text-xs tracking-wide">Remove from cart</button>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {items.length > 0 && (
        <section className="sticky bottom-16 z-10 bg-offwhite border border-ink" aria-label="Cart">
          <details>
            <summary className="flex min-h-12 items-center justify-between px-4 cursor-pointer uppercase text-xs font-bold tracking-widest">
              <span>Cart · {items.length} {items.length === 1 ? "piece" : "pieces"}</span><span>{rm(total)}</span>
            </summary>
            <ul className="px-4 pb-2 space-y-1 text-sm">
              {items.map(({ step, size }) => (
                <li key={step.id} className="flex justify-between"><span>{step.product} · {step.ink} · {size}</span><span>{step.isFree ? "Earned" : rm(step.price ?? 0)}</span></li>
              ))}
            </ul>
          </details>
          {msg && <p role="alert" className="mx-4 mb-2 border border-ink p-3 text-sm">{msg}</p>}
          <button type="button" disabled={busy} onClick={checkout} className="w-full min-h-14 bg-ink text-offwhite uppercase text-sm font-bold tracking-wide disabled:opacity-40">
            {busy ? "Locking it in" : `Pre-order now · ${rm(total)}`}
          </button>
        </section>
      )}

      {orders.length > 0 && (
        <section>
          <h2 className="uppercase text-xs tracking-widest border-b border-ink pb-2 mb-3">My orders</h2>
          <ul className="space-y-2">
            {orders.map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-3 border border-ink p-3">
                <span>{o.label} · {o.size}<br /><span className="uppercase text-xs tracking-widest">Ref {o.id.slice(0, 6).toUpperCase()} · {STATUS[o.status] ?? o.status}</span></span>
                {o.status === "preordered" && (
                  <button type="button" onClick={() => cancel(o.id)} className="min-h-11 px-3 border border-ink uppercase text-xs font-bold tracking-wide">Cancel</button>
                )}
              </li>
            ))}
          </ul>
          {unpaid.length > 0 && (
            <div className="mt-4 border border-ink p-4">
              <p className="uppercase text-xs tracking-widest">To pay</p>
              <p className="font-display text-3xl mt-1">{rm(due)}</p>
              <p className="mt-2 text-sm whitespace-pre-line">{payment}</p>
              <p className="mt-2 text-sm">Use the reference{unpaid.length > 1 ? "s" : ""}: {unpaid.map((o) => o.id.slice(0, 6).toUpperCase()).join(", ")}</p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
