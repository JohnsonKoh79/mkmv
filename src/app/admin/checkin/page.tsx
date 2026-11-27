import { connection } from "next/server";
import Link from "next/link";
import { AdminShell, H } from "@/components/AdminShell";
import { requireFounder } from "@/lib/founder";
import { klToday } from "@/lib/me";
import { fmtDate } from "@/lib/format";

// Project -> week -> QR code.
async function Content() {
  await connection();
  const { db } = await requireFounder();
  const today = klToday();
  const { data } = await db.from("season")
    .select("id, batch_number, project:project_id(title), session_date(id, date, checkin(is_open))")
    .not("start_date", "is", null).order("batch_number");
  return (
    <>
      {(data ?? []).map((s) => {
        const weeks = [...(s.session_date as unknown as { id: string; date: string; checkin: { is_open: boolean } | { is_open: boolean }[] | null }[])].sort((a, b) => a.date.localeCompare(b.date));
        return (
          <section key={s.id}>
            <H>{(s.project as unknown as { title: string }).title} · Batch {s.batch_number}</H>
            <ul className="space-y-2">
              {weeks.map((w, i) => {
                const c = Array.isArray(w.checkin) ? w.checkin[0] : w.checkin;
                return (
                  <li key={w.id}>
                    <Link href={`/admin/checkin/${w.id}`} className={`flex min-h-14 items-center justify-between border px-4 ${w.date === today ? "border-ink bg-ink text-offwhite" : "border-ink"}`}>
                      <span className="font-bold uppercase tracking-wide">Week {i + 1} · {fmtDate(w.date)}</span>
                      <span className="text-xs font-bold uppercase tracking-widest">{c?.is_open && w.date === today ? "Open" : w.date === today ? "Today" : w.date < today ? "Done" : ""} →</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </>
  );
}
export default function Checkin() { return <AdminShell title="Check-in"><Content /></AdminShell>; }
