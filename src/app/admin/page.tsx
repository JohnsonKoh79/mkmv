import Link from "next/link";
import { connection } from "next/server";
import { AdminShell, H } from "@/components/AdminShell";
import { requireFounder } from "@/lib/founder";
import { klToday } from "@/lib/me";
import { fmtDate } from "@/lib/format";

async function Content() {
  await connection();
  const { db } = await requireFounder();
  const today = klToday();
  const { data: next } = await db.from("session_date").select("id, date").gte("date", today).order("date").limit(1).maybeSingle();
  const [{ data: out }, orders, waiting, seats] = await Promise.all([
    next
      ? db.from("attendance").select("player:player_id(nickname, real_name)").eq("session_date_id", next.id).eq("notice_given", true)
      : Promise.resolve({ data: [] }),
    db.from("order").select("*", { count: "exact", head: true }).eq("status", "preordered"),
    db.from("join_request").select("*", { count: "exact", head: true }).eq("status", "requested"),
    db.from("enrolment").select("*", { count: "exact", head: true }),
  ]);
  const names = (out ?? []).map((a) => {
    const p = a.player as unknown as { nickname: string | null; real_name: string };
    return p.nickname ?? p.real_name;
  });
  const tiles = [
    ["/admin/setup", "Seats taken", seats.count ?? 0],
    ["/admin/orders", "Unpaid orders", orders.count ?? 0],
    ["/admin/requests", "Requests", waiting.count ?? 0],
  ] as const;

  return (
    <>
      <section className="border border-ink p-4">
        <p className="uppercase text-xs font-bold tracking-widest">Next session</p>
        <p className="font-display mt-2 text-3xl"><span className="slant">{next ? fmtDate(next.date) : "None left"}</span></p>
        <Link href="/admin/roll-call" className="mt-4 flex min-h-12 items-center justify-center bg-ink text-offwhite uppercase text-sm font-bold tracking-widest">Roll call</Link>
      </section>
      <dl className="mt-3 grid grid-cols-3 gap-3">
        {tiles.map(([href, label, n]) => (
          <Link key={label} href={href} className="flex flex-col-reverse border border-ink p-3">
            <dt className="uppercase text-[10px] font-bold tracking-widest">{label}</dt>
            <dd className="font-display text-4xl leading-none tabular-nums mb-2">{n}</dd>
          </Link>
        ))}
      </dl>
      <H>Out next session</H>
      {names.length ? <ul>{names.map((n) => <li key={n} className="border-b border-ink/30 py-2 font-bold">{n}</li>)}</ul> : <p>No notices.</p>}
    </>
  );
}
export default function AdminHome() { return <AdminShell title="Today"><Content /></AdminShell>; }
