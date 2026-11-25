import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Shop, type ShopStep, type ShopOrder } from "./Shop";
import { getMe } from "@/lib/me";
import { level, isFinisher, stepState } from "@/lib/rules";
import { supabaseServer } from "@/lib/supabase/server";

async function Content() {
  await connection();
  const me = await getMe();
  if (me.kind === "signed-out") redirect("/sign-in");
  if (me.kind !== "ok") redirect("/status");
  const { ctx } = me;
  const db = await supabaseServer();

  const [{ data: extra }, { data: orders }, { data: pay }] = await Promise.all([
    db.from("ladder_step").select("id, price, product:product_id(sizes)"),
    db.from("order").select("id, ladder_step_id, size, status, price").eq("player_id", ctx.playerId).order("created_at"),
    db.from("setting").select("value").eq("key", "payment_instructions").maybeSingle(),
  ]);
  const extraById = new Map((extra ?? []).map((e) => [e.id as string, e]));
  const lvl = level(ctx.rows, ctx.season);
  const fin = isFinisher(ctx.rows, ctx.season);
  const ordered = new Map((orders ?? []).map((o) => [o.ladder_step_id as string, o]));

  const steps: ShopStep[] = ctx.ladder.map((s) => {
    const e = extraById.get(s.id);
    const o = ordered.get(s.id);
    // Oxblood at LV 8 and 10 shows as unlocked but is held until finishing.
    const state = stepState(s, lvl, fin);
    return {
      id: s.id, level: s.level, product: s.product, ink: s.ink, isFree: s.isFree,
      state: o ? "ordered" : state,
      price: e?.price == null ? null : Number(e.price),
      sizes: ((e?.product as unknown as { sizes: string[] } | null)?.sizes) ?? [],
    };
  });
  const names = new Map(ctx.ladder.map((s) => [s.id, `${s.product} · ${s.ink}`]));
  const myOrders: ShopOrder[] = (orders ?? []).map((o) => ({
    id: o.id, label: names.get(o.ladder_step_id) ?? "Piece", size: o.size, status: o.status, price: Number(o.price),
  }));

  return <Shop steps={steps} orders={myOrders} payment={pay?.value ?? ""} />;
}

export default function InventoryPage() {
  return (
    <>
      <Header />
      <main className="flex-1 px-4 pt-6 pb-8 max-w-xl w-full mx-auto">
        <Link href="/status" className="uppercase text-xs tracking-widest underline">My status</Link>
        <h1 className="font-display text-4xl mt-2"><span className="slant">Inventory</span></h1>
        <p className="mt-2 text-sm">Pre-order only. Pay by bank transfer once you order.</p>
        <Suspense fallback={null}><Content /></Suspense>
      </main>
    </>
  );
}
