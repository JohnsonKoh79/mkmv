import { SubmitButton } from "@/components/SubmitButton";
import { connection } from "next/server";
import { AdminShell, H, btnDark } from "@/components/AdminShell";
import { requireFounder } from "@/lib/founder";
import { advanceOrder } from "../actions";

const LABEL: Record<string, string> = { preordered: "Ordered", paid: "Paid", sent_to_printer: "Sent to printer", handed_over: "Handed over" };
const BUTTON: Record<string, string> = { preordered: "Mark paid", paid: "Sent to printer", sent_to_printer: "Handed over" };

async function Content() {
  await connection();
  const { db } = await requireFounder();
  const { data } = await db.from("order")
    .select("id, size, cut, status, price, created_at, step:ladder_step_id(ink, product:product_id(name)), player:player_id(nickname, real_name)")
    .order("created_at");
  const orders = (data ?? []).map((o) => {
    const step = o.step as unknown as { ink: string; product: { name: string } };
    const pl = o.player as unknown as { nickname: string | null; real_name: string };
    return { id: o.id as string, size: o.cut ? `${o.size} · ${o.cut === "w" ? "Women's" : "Men's"}` : (o.size as string), status: o.status as string, price: Number(o.price),
      piece: `${step.product.name} · ${step.ink}`, who: `${pl.nickname ?? ""} (${pl.real_name})`.trim() };
  });
  if (!orders.length) return <p>No orders yet. Prices first.</p>;

  // Grouped by piece, ink and size, for the printer.
  const groups = new Map<string, number>();
  for (const o of orders) { const k = `${o.piece} · ${o.size}`; groups.set(k, (groups.get(k) ?? 0) + 1); }
  const sorted = [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));

  return (
    <>
      <H>For the printer</H>
      <table className="w-full text-sm"><tbody>
        {sorted.map(([k, n]) => (<tr key={k} className="border-b border-ink/30"><td className="py-2">{k}</td><td className="py-2 text-right font-bold tabular-nums">{n}</td></tr>))}
      </tbody></table>
      <H>Orders</H>
      <ul className="space-y-2">
        {orders.map((o) => (
          <li key={o.id} className="border border-ink p-3 flex items-center justify-between gap-3">
            <span className="text-sm">{o.who}<br />{o.piece} · {o.size} · RM {o.price.toFixed(2)}<br />
              <span className="uppercase text-xs tracking-widest">Ref {o.id.slice(0, 6).toUpperCase()} · {LABEL[o.status]}</span></span>
            {BUTTON[o.status] && (
              <form action={advanceOrder.bind(null, o.id, o.status)}><SubmitButton className={btnDark}>{BUTTON[o.status]}</SubmitButton></form>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
export default function Orders() { return <AdminShell title="Orders"><Content /></AdminShell>; }
