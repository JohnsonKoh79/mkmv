import { supabaseServer } from "@/lib/supabase/server";
import { rewardName } from "@/lib/kit";
import { ORDER_STATUS, rm } from "@/lib/orders";
import { CancelOrder } from "./CancelOrder";

/** The viewer's own orders, with the amount due and how to pay. */
export async function MyKit({ playerId }: { playerId: string }) {
  const db = await supabaseServer();
  const [{ data: orders }, { data: pay }] = await Promise.all([
    db.from("order").select("id, size, cut, status, price, step:ladder_step_id(ink, mission_label, product:product_id(name))").eq("player_id", playerId).order("created_at"),
    db.from("setting").select("value").eq("key", "payment_instructions").maybeSingle(),
  ]);
  if (!orders?.length) return null;
  const unpaid = orders.filter((o) => o.status === "preordered" && Number(o.price) > 0);
  const due = unpaid.reduce((n, o) => n + Number(o.price), 0);
  return (
    <section className="mt-6">
      <h2 className="lbl border-b border-ink pb-2">My kit</h2>
      <ul>
        {orders.map((o) => {
          const step = o.step as unknown as { ink: "black" | "oxblood"; mission_label: string | null; product: { name: string } };
          return (
            <li key={o.id} className="flex items-center justify-between gap-3 border-b border-ink/40 py-3">
              <span>
                <b>{rewardName({ product: step.product.name, ink: step.ink })}</b> · {o.size}{o.cut ? ` · ${o.cut === "w" ? "Women's" : "Men's"}` : ""}
                <br /><span className="lbl !text-[10px]">{step.mission_label} · {ORDER_STATUS[o.status] ?? o.status} · Ref {o.id.slice(0, 6).toUpperCase()}</span>
              </span>
              {o.status === "preordered" && <CancelOrder id={o.id} />}
            </li>
          );
        })}
      </ul>
      {due > 0 && (
        <div className="mt-3 border border-ink p-4">
          <p className="lbl">To pay</p>
          <p className="mt-1 text-3xl font-extrabold tabular-nums">{rm(due)}</p>
          <p className="mt-2 whitespace-pre-line text-sm">{pay?.value}</p>
          <p className="mt-2 text-sm font-bold">Reference: {unpaid.map((o) => o.id.slice(0, 6).toUpperCase()).join(", ")}</p>
        </div>
      )}
    </section>
  );
}
