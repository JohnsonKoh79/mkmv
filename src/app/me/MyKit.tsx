import { supabaseServer } from "@/lib/supabase/server";
import { OrderRow, type MyKitOrder } from "@/components/OrderRow";
import { rewardName } from "@/lib/kit";
import type { Step } from "@/lib/public";

/** The viewer's own kit, grouped by project. */
export async function MyKit({ playerId, projects }: { playerId: string; projects: { title: string; seasonId: string; level: number; ladder: Step[] }[] }) {
  const db = await supabaseServer();
  const { data: orders } = await db.from("order")
    .select("id, ladder_step_id, size, cut, status, price, proof_url, step:ladder_step_id(product:product_id(sizes))")
    .eq("player_id", playerId).order("created_at");

  return (
    <>
      {projects.map((p) => {
        const mine: MyKitOrder[] = (orders ?? []).flatMap((o) => {
          const s = p.ladder.find((x) => x.id === o.ladder_step_id);
          if (!s) return [];
          return [{
            id: o.id, name: rewardName(s), cutLabel: o.cut === "w" ? "Women's" : o.cut === "m" ? "Men's" : "", size: o.size,
            sizes: (o.step as unknown as { product: { sizes: string[] } } | null)?.product.sizes ?? [],
            status: o.status, price: Number(o.price), proof: Boolean(o.proof_url),
          }];
        });
        const complete = p.ladder.filter((s) => p.level >= s.level).length;
        const locked = p.ladder.length - complete;
        return (
          <section key={p.seasonId}>
            <p className="lbl">{p.title}</p>
            {mine.length ? <ul className="mt-2 border-t border-ink">{mine.map((o) => <OrderRow key={o.id} order={o} />)}</ul> : <p className="mt-2">Nothing ordered yet.</p>}
            <p className="mt-3 text-sm">{complete} of {p.ladder.length} missions complete. {locked} {locked === 1 ? "piece" : "pieces"} still locked.</p>
          </section>
        );
      })}
    </>
  );
}
