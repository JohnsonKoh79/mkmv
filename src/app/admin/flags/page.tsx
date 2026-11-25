import { connection } from "next/server";
import { AdminShell } from "@/components/AdminShell";
import { requireFounder } from "@/lib/founder";
import { fmtDate } from "@/lib/format";

async function Content() {
  await connection();
  const { db } = await requireFounder();
  const { data } = await db.from("attendance")
    .select("type, notice_given, player:player_id(id, nickname, real_name), session_date:session_date_id(date)");
  const by = new Map<string, { name: string; silent: string[]; solo: number }>();
  for (const a of data ?? []) {
    const p = a.player as unknown as { id: string; nickname: string | null; real_name: string };
    const d = (a.session_date as unknown as { date: string }).date;
    const e = by.get(p.id) ?? { name: `${p.nickname ?? ""} (${p.real_name})`.trim(), silent: [], solo: 0 };
    if (a.type === "absent" && !a.notice_given) e.silent.push(d);
    if (a.type === "solo") e.solo++;
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
