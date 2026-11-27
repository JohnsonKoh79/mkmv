import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { PayForm } from "./PayForm";
import { CopyButton } from "./CopyButton";
import { getViewer } from "@/lib/viewer";
import { supabaseServer } from "@/lib/supabase/server";
import { needsPayment, rm } from "@/lib/orders";
import { rewardName } from "@/lib/kit";

async function Content() {
  await connection();
  const v = await getViewer();
  if (!v.signedIn || !v.playerId) redirect("/sign-in?next=/pay");
  const db = await supabaseServer();
  const [{ data }, { data: pay }] = await Promise.all([
    db.from("order").select("id, size, status, price, proof_url, step:ladder_step_id(ink, product:product_id(name))").eq("player_id", v.playerId).order("created_at"),
    db.from("setting").select("value").eq("key", "payment_instructions").maybeSingle(),
  ]);
  const orders = (data ?? []).map((o) => {
    const step = o.step as unknown as { ink: "black" | "oxblood"; product: { name: string } };
    return { id: o.id as string, size: o.size as string, status: o.status as string, price: Number(o.price), proof: Boolean(o.proof_url), name: rewardName({ product: step.product.name, ink: step.ink }) };
  });
  const due = orders.filter(needsPayment);
  const checking = orders.filter((o) => o.status === "preordered" && o.proof);
  const total = due.reduce((n, o) => n + o.price, 0);
  const instructions = pay?.value ?? "";
  const number = instructions.match(/\+?\d[\d\s-]{8,}\d/)?.[0].replace(/[\s-]/g, "");

  if (!due.length) {
    return (
      <>
        <div className="bg-ink p-5 text-offwhite" role="status">
          <p className="h2 !text-3xl">{checking.length ? "Pending for approval." : "Nothing to pay."}</p>
          {checking.length > 0 && <p className="mt-3">A founder confirms your payment. The status shows under Me.</p>}
        </div>
        <Link href="/me?tab=kit" className="btn mt-4 border-ink">My kit</Link>
      </>
    );
  }
  return (
    <>
      <ul className="border-t border-ink">
        {due.map((o) => (
          <li key={o.id} className="flex justify-between gap-3 border-b border-ink/40 py-3">
            <span><b>{o.name}</b> · {o.size}<br /><span className="lbl !text-[10px]">Ref {o.id.slice(0, 6).toUpperCase()}</span></span>
            <span className="font-bold tabular-nums">{rm(o.price)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-5 bg-ink p-5 text-offwhite">
        <p className="lbl">Step 1 · Transfer</p>
        <p className="mt-2 text-4xl font-extrabold tabular-nums">{rm(total)}</p>
        <p className="mt-3 whitespace-pre-line text-lg font-bold">{instructions}</p>
        <p className="mt-2 text-sm">Reference: {due.map((o) => o.id.slice(0, 6).toUpperCase()).join(", ")}</p>
        {number && <div className="mt-3"><CopyButton text={number} label="Copy number" /></div>}
      </div>
      <p className="lbl mt-6">Step 2 · Send us the proof</p>
      <PayForm playerId={v.playerId} orderIds={due.map((o) => o.id)} total={total} />
    </>
  );
}

export default function PayPage() {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 pb-8 pt-6">
        <h1 className="h2 mb-5 !text-4xl">Payment</h1>
        <Suspense fallback={null}><Content /></Suspense>
      </main>
    </>
  );
}
