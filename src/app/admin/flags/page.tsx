import { connection } from "next/server";
import { AdminShell } from "@/components/AdminShell";
import { requireFounder } from "@/lib/founder";
import { fmtDate } from "@/lib/format";
import { klToday } from "@/lib/me";

async function Content() {
  await connection();
  const { db } = await requireFounder();
  const today = klToday();
  const [{ data: seats }, { data: att }, { data: dates }] = await Promise.all([
    db.from("enrolment").select("joined_at, player:player_id(id, nickname, real_name), group:group_id(season_id)"),
    db.from("attendance").select("player_id, session_date_id, type, notice_given"),
    db.from("session_date").select("id, season_id, date").lt("date", today),
  ]);
  const row = new Map((att ?? []).map((a) => [`${a.player_id}:${a.session_date_id}`, a]));
  const by = new Map<string, { name: string; silent: string[]; solo: number }>();
  for (const seat of seats ?? []) {
    const p = seat.player as unknown as { id: string; nickname: string | null; real_name: string | null };
    const season = (seat.group as unknown as { season_id: string }).season_id;
    const joined = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kuala_Lumpur" }).format(new Date(seat.joined_at));
    const e = { name: `${p.nickname ?? ""} (${p.real_name ?? "no name"})`.trim(), silent: [] as string[], solo: 0 };
    for (const d of (dates ?? []).filter((d) => d.season_id === season && d.date >= joined)) {
      const a = row.get(`${p.id}:${d.id}`);
      // Nothing recorded, or marked absent, with no notice given.
      if (!a || (a.type === "absent" && !a.notice_given)) e.silent.push(d.date);
    }
    e.solo = (att ?? []).filter((a) => a.player_id === p.id && a.type === "solo").length;
    by.set(p.id, e);
  }
  const rows = [...by.values()].filter((e) => e.silent.length >= 1 || e.solo > 2);
  if (!rows.length) return <p>All clear.</p>;
  return (
    <ul className="space-y-2">
      {rows.map((e) => (
        <li key={e.name} className="border border-ink p-3 text-sm">
          <p className="font-bold">{e.name}</p>
          {e.silent.length > 0 && (
            <p>{e.silent.length >= 2 ? "FLAG · " : ""}Silent misses {e.silent.length}: {e.silent.sort().map(fmtDate).join(", ")}</p>
          )}
          {e.solo > 2 && <p>FLAG · Solo sessions {e.solo}</p>}
        </li>
      ))}
    </ul>
  );
}
export default function Flags() { return <AdminShell title="Flags"><Content /></AdminShell>; }
