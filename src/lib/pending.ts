import { supabaseServer } from "@/lib/supabase/server";
import { needsPayment } from "@/lib/orders";

/** What the viewer still has to pay. Their own rows only. */
export async function pendingPayment(playerId: string) {
  const db = await supabaseServer();
  const { data } = await db.from("order").select("status, price, proof_url").eq("player_id", playerId);
  const due = (data ?? []).filter((o) => needsPayment({ status: o.status, price: Number(o.price), proof: Boolean(o.proof_url) }));
  return { count: due.length, total: due.reduce((n, o) => n + Number(o.price), 0) };
}
