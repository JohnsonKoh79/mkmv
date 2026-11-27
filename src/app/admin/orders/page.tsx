import { connection } from "next/server";
/* eslint-disable @next/next/no-img-element */
import { AdminShell, H, btn, btnDark } from "@/components/AdminShell";
import { SubmitButton } from "@/components/SubmitButton";
import { requireFounder } from "@/lib/founder";
import { advanceOrder, rejectProof } from "../actions";

const LABEL: Record<string, string> = { preordered: "Payment pending", paid: "Paid", sent_to_printer: "With the printer", handed_over: "Handed over" };
const BUTTON: Record<string, string> = { paid: "Sent to printer", sent_to_printer: "Handed over" };

async function Content() {
  await connection();
  const { db } = await requireFounder();
  const { data } = await db.from("order")
    .select("id, size, cut, status, price, proof_url, created_at, step:ladder_step_id(ink, product:product_id(name)), player:player_id(nickname, real_name)")
    .order("created_at");
  const orders = await Promise.all((data ?? []).map(async (o) => {
    const step = o.step as unknown as { ink: string; product: { name: string } };
    const pl = o.player as unknown as { nickname: string | null; real_name: string | null };
    // Payment screenshots are private: a short-lived link, only for a founder.
    const proof = o.proof_url && o.status === "preordered" ? (await db.storage.from("proofs").createSignedUrl(o.proof_url, 600)).data?.signedUrl ?? null : null;
    return {
      id: o.id as string, status: o.status as string, price: Number(o.price), hasProof: Boolean(o.proof_url), proof,
      heic: /\.hei[cf]$/i.test(o.proof_url ?? ""),
      size: o.cut ? `${o.size} · ${o.cut === "w" ? "Women's" : "Men's"}` : (o.size as string),
      piece: `${step.product.name} · ${step.ink}`, who: `${pl.nickname ?? ""} (${pl.real_name ?? "no name"})`.trim(),
    };
  }));
  if (!orders.length) return <p>No orders yet.</p>;

  const checking = orders.filter((o) => o.status === "preordered" && (o.hasProof || o.price === 0));
  const waiting = orders.filter((o) => o.status === "preordered" && !o.hasProof && o.price > 0);
  const confirmed = orders.filter((o) => o.status !== "preordered");

  // Only confirmed orders go to the printer, grouped by piece, ink and size.
  const groups = new Map<string, number>();
  for (const o of orders.filter((o) => o.status === "paid")) { const k = `${o.piece} · ${o.size}`; groups.set(k, (groups.get(k) ?? 0) + 1); }
  const printer = [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));

  const card = (o: (typeof orders)[number]) => (
    <li key={o.id} className="border border-ink p-3">
      <p className="text-sm"><b>{o.who}</b><br />{o.piece} · {o.size} · {o.price ? `RM ${o.price.toFixed(2)}` : "Earned"}<br />
        <span className="uppercase text-xs tracking-widest">Ref {o.id.slice(0, 6).toUpperCase()} · {o.status === "preordered" && o.hasProof ? "Proof uploaded" : LABEL[o.status]}</span></p>
      {o.proof && (
        <a href={o.proof} target="_blank" rel="noreferrer" className="mt-2 block">
          {o.heic
            ? <span className={`${btn} inline-flex items-center`}>Download screenshot (iPhone photo)</span>
            : <img src={o.proof} alt={`Payment screenshot from ${o.who}`} className="max-h-72 border border-ink object-contain" />}
        </a>
      )}
      <div className="mt-2 flex flex-wrap gap-2">
        {o.status === "preordered" && (
          <form action={advanceOrder.bind(null, o.id, o.status)}>
            <SubmitButton className={o.hasProof || o.price === 0 ? btnDark : btn}>{o.price === 0 ? "Confirm" : o.hasProof ? "Approve payment" : "Mark paid without proof"}</SubmitButton>
          </form>
        )}
        {o.status === "preordered" && o.hasProof && <form action={rejectProof.bind(null, o.id)}><SubmitButton className={btn}>Ask for proof again</SubmitButton></form>}
        {BUTTON[o.status] && <form action={advanceOrder.bind(null, o.id, o.status)}><SubmitButton className={btnDark}>{BUTTON[o.status]}</SubmitButton></form>}
      </div>
    </li>
  );

  return (
    <>
      <H>To approve ({checking.length})</H>
      {checking.length ? <ul className="space-y-2">{checking.map(card)}</ul> : <p>Nothing to check.</p>}
      <H>Waiting for payment ({waiting.length})</H>
      <ul className="space-y-2">{waiting.map(card)}</ul>
      <H>For the printer (paid)</H>
      {printer.length ? (
        <table className="w-full text-sm"><tbody>
          {printer.map(([k, n]) => <tr key={k} className="border-b border-ink/30"><td className="py-2">{k}</td><td className="py-2 text-right font-bold tabular-nums">{n}</td></tr>)}
        </tbody></table>
      ) : <p>Nothing paid and waiting to print.</p>}
      <H>Confirmed ({confirmed.length})</H>
      <ul className="space-y-2">{confirmed.map(card)}</ul>
    </>
  );
}
export default function Orders() { return <AdminShell title="Orders"><Content /></AdminShell>; }
