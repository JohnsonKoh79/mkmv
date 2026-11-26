import { supabaseServer } from "@/lib/supabase/server";
import { Label } from "@/components/History";
import { rewardName } from "@/lib/kit";
import { missionState } from "@/lib/missions";
import { ORDER_STATUS, rm } from "@/lib/orders";
import type { Step } from "@/lib/public";
import { CancelOrder } from "./CancelOrder";

/** The viewer's own kit, grouped by project, with the amount due and how to pay. */
export async function MyKit({ playerId, projects }: { playerId: string; projects: { title: string; seasonId: string; level: number; ladder: Step[] }[] }) {
  const db = await supabaseServer();
  const [{ data: orders }, { data: pay }] = await Promise.all([
    db.from("order").select("id, ladder_step_id, size, cut, status, price").eq("player_id", playerId).order("created_at"),
    db.from("setting").select("value").eq("key", "payment_instructions").maybeSingle(),
  ]);
  const unpaid = (orders ?? []).filter((o) => o.status === "preordered" && Number(o.price) > 0);
  const due = unpaid.reduce((n, o) => n + Number(o.price), 0);

  return (
    <section>
      <Label>My kit</Label>
      {projects.map((p) => {
        const mine = (orders ?? []).filter((o) => p.ladder.some((s) => s.id === o.ladder_step_id));
        const finisher = p.level >= Math.max(...p.ladder.map((s) => s.level), 12);
        const complete = p.ladder.filter((s) => missionState(s, p.ladder, p.level, finisher, false) !== "locked" && p.level >= s.level).length;
        return (
          <div key={p.seasonId} className="mt-3">
            <p className="lbl">{p.title}</p>
            <ul>
              {mine.map((o) => {
                const s = p.ladder.find((x) => x.id === o.ladder_step_id)!;
                return (
                  <li key={o.id} className="flex items-center justify-between gap-3 border-b border-ink/40 py-3">
                    <span>
                      <b>{rewardName(s)}</b> · {o.size}{o.cut ? ` · ${o.cut === "w" ? "Women's" : "Men's"}` : ""}
                      <br /><span className="lbl !text-[10px]">{s.missionLabel} · {o.status === "preordered" ? "Ordered" : `Ordered, ${(ORDER_STATUS[o.status] ?? o.status).toLowerCase()}`} · Ref {o.id.slice(0, 6).toUpperCase()}</span>
                    </span>
                    {o.status === "preordered" && <CancelOrder id={o.id} />}
                  </li>
                );
              })}
            </ul>
            <p className="mt-2 text-sm">{complete} of {p.ladder.length} missions complete. {p.ladder.length - complete} {p.ladder.length - complete === 1 ? "piece" : "pieces"} still locked.</p>
          </div>
        );
      })}
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
