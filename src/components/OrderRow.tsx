"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/client";
import { needsPayment, orderStatus, rm } from "@/lib/orders";

export interface MyKitOrder { id: string; name: string; cutLabel: string; size: string; sizes: string[]; status: string; price: number; proof: boolean }

/** One order: status, size (changeable until a founder confirms), pay and cancel. */
export function OrderRow({ order }: { order: MyKitOrder }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const open = order.status === "preordered";

  async function run(fn: () => PromiseLike<{ error: unknown }>) {
    setBusy(true); setMsg("");
    const { error } = await fn();
    setBusy(false);
    if (error) return setMsg("That did not save. Go again.");
    setEditing(false);
    router.refresh();
  }

  return (
    <li className="border-b border-ink/40 py-3">
      <div className="flex justify-between gap-3">
        <span><b>{order.name}</b><br />Size {order.size}{order.cutLabel ? ` · ${order.cutLabel}` : ""}</span>
        <span className="text-right"><b className="tabular-nums">{order.price ? rm(order.price) : "Earned"}</b><br />
          <span className={`lbl !text-[10px] ${needsPayment(order) ? "bg-ink px-1.5 py-0.5 text-offwhite" : ""}`}>{orderStatus(order)}</span></span>
      </div>
      <p className="lbl mt-1 !text-[10px]">Ref {order.id.slice(0, 6).toUpperCase()}</p>
      {open && (
        <div className="mt-1 flex flex-wrap items-center gap-x-5">
          {needsPayment(order) && <Link href="/pay" className="flex min-h-11 items-center text-xs font-bold uppercase tracking-widest underline">Pay now</Link>}
          <button type="button" onClick={() => setEditing((e) => !e)} className="min-h-11 text-xs font-bold uppercase tracking-widest underline">{editing ? "Close" : "Change size"}</button>
          {!order.proof && (
            <button type="button" disabled={busy} className="min-h-11 text-xs font-bold uppercase tracking-widest underline disabled:opacity-50"
              onClick={() => { if (window.confirm("Cancel this order?")) void run(() => supabaseBrowser().rpc("cancel_order", { oid: order.id })); }}>Cancel</button>
          )}
        </div>
      )}
      {editing && (
        <div role="group" aria-label="New size" className="flex flex-wrap gap-2">
          {order.sizes.map((z) => (
            <button key={z} type="button" disabled={busy} aria-pressed={z === order.size}
              onClick={() => run(() => supabaseBrowser().rpc("change_size", { p_order: order.id, p_size: z }))}
              className={`min-h-11 min-w-11 border border-ink px-3 font-bold ${z === order.size ? "bg-ink text-offwhite" : ""}`}>{z}</button>
          ))}
        </div>
      )}
      {msg && <p role="alert" className="mt-2 border border-ink p-2 text-sm">{msg}</p>}
    </li>
  );
}
