import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { Ladder } from "@/components/Ladder";
import { LevelBar } from "@/components/LevelBar";
import { StatusActions } from "./StatusActions";
import { signOut } from "../actions";
import { getMe, klToday } from "@/lib/me";
import { canStillFinish, level, wednesdaysRemaining } from "@/lib/rules";
import { fmtDate } from "@/lib/format";

function Message({ children }: { children: React.ReactNode }) {
  return (<><Header /><main className="flex-1 px-4 py-10 max-w-xl w-full mx-auto"><p className="text-lg">{children}</p>
    <Link href="/" className="mt-6 inline-flex min-h-11 items-center border border-ink px-5 uppercase text-sm font-bold tracking-wide">Home</Link></main></>);
}

async function StatusContent() {
  await connection(); // per-request: depends on who is signed in and the current time
  const me = await getMe();
  if (me.kind === "signed-out") redirect("/sign-in");
  if (me.kind === "no-player") return <Message>You&apos;re not in yet. Ask whoever referred you.</Message>;
  if (me.kind === "not-enrolled") return <Message>No project yet. Your move comes next.</Message>;

  const { ctx } = me;
  if (ctx.unseen.length) redirect("/unlock");

  const today = klToday();
  const { season, rows } = ctx;
  const lvl = level(rows, season);
  const left = wednesdaysRemaining(rows, season, today);
  const todayRow = rows.find((r) => r.date === today);
  const isSessionDay = season.dates.includes(today);
  const soloOpen = isSessionDay && (!todayRow || todayRow.type === "absent");

  const nextNotice = season.dates.find((d) => new Date(ctx.noticeDeadlines[d]) > new Date());
  const noticeGiven = nextNotice ? rows.some((r) => r.date === nextNotice && r.type === "absent" && r.noticeGiven) : false;
  const noticeOpen = Boolean(nextNotice) && !noticeGiven && !rows.some((r) => r.date === nextNotice);
  const noticeLabel = !nextNotice ? "Season over" : noticeGiven ? `You're out · ${fmtDate(nextNotice)}` : noticeOpen ? `Closes Tue 21:00 · ${fmtDate(nextNotice)}` : "Closed";
  const soloNote = todayRow && todayRow.type !== "absent" ? "Logged today" : isSessionDay ? "Today" : "Wednesdays only";

  return (
    <>
      <Header />
      <main className="flex-1 px-4 pt-6 pb-8 max-w-xl w-full mx-auto">
        <p className="uppercase text-xs tracking-widest">My status</p>
        <h1 className="font-display text-4xl mt-1"><span className="slant">{ctx.nickname ?? "Player"}</span></h1>

        <section className="mt-6 border border-ink p-4">
          <p className="uppercase text-xs tracking-widest mb-3">{ctx.projectName}</p>
          <LevelBar level={lvl} total={season.sessionsRequired} />
          <dl className="mt-4 grid grid-cols-2 gap-3 uppercase text-xs tracking-widest">
            <div><dt>Sessions</dt><dd className="text-lg font-bold tabular-nums">{lvl} / {season.sessionsRequired}</dd></div>
            <div><dt>Wednesdays left</dt><dd className="text-lg font-bold tabular-nums">{left}</dd></div>
          </dl>
          {!canStillFinish(rows, season, today) && (
            <p className="mt-4 text-sm">Your level stays. Your black kit stays. Next season has a seat for you.</p>
          )}
        </section>

        <section className="mt-8">
          <h2 className="uppercase text-xs tracking-widest border-b border-ink pb-2 mb-4">This week</h2>
          <StatusActions playerId={ctx.playerId} noticeLabel={noticeLabel} noticeOpen={noticeOpen} soloOpen={soloOpen} soloNote={soloNote} />
        </section>

        <section className="mt-8">
          <div className="flex items-baseline justify-between border-b border-ink pb-2 mb-0"><h2 className="uppercase text-xs tracking-widest">Inventory</h2><Link href="/inventory" className="uppercase text-xs font-bold tracking-widest underline min-h-11 flex items-center">Pre-order</Link></div>
          <Ladder steps={ctx.ladder} level={lvl} compact />
        </section>

        {ctx.isFounder && (
          <Link href="/admin" className="mt-8 flex min-h-12 items-center justify-between border border-ink px-4 uppercase text-sm font-bold tracking-wide">
            <span>Admin</span><span aria-hidden>→</span>
          </Link>
        )}
        <form action={signOut} className="mt-6">
          <button className="min-h-11 underline uppercase text-xs font-bold tracking-widest">Sign out</button>
        </form>
      </main>
    </>
  );
}

export default function StatusPage() {
  return <Suspense fallback={null}><StatusContent /></Suspense>;
}
