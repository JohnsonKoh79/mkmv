import { supabaseServer } from "@/lib/supabase/server";
import { needsPayment } from "@/lib/orders";

/** What the viewer still has to pay, and what is waiting for a founder. Their own rows only. */
export async function pendingPayment(playerId: string) {
  const db = await supabaseServer();
  const { data } = await db.from("order").select("status, price, proof_url").eq("player_id", playerId);
  const all = (data ?? []).map((o) => ({ status: o.status as string, price: Number(o.price), proof: Boolean(o.proof_url) }));
  const sum = (list: typeof all) => ({ count: list.length, total: list.reduce((n, o) => n + o.price, 0) });
  return { due: sum(all.filter(needsPayment)), checking: sum(all.filter((o) => o.status === "preordered" && o.proof)) };
}
