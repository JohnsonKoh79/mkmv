import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { LevelBar } from "@/components/LevelBar";
import { MyMissions, type MyOrder, type MyStep } from "@/components/MyMissions";
import { Missions } from "@/components/Missions";
import { StatusActions } from "./StatusActions";
import { ScanButton } from "./ScanButton";
import { getMe, klToday } from "@/lib/me";
import { getPublic } from "@/lib/public";
import { getViewer } from "@/lib/viewer";
import { canStillFinish, isFinisher, level, wednesdaysRemaining } from "@/lib/rules";
import { missionState } from "@/lib/missions";
import { closesLabel } from "@/lib/batch";
import { supabaseServer } from "@/lib/supabase/server";

/** Signed in without a seat: what My Move will look like, greyed out. */
async function Preview() {
  const [projects, viewer] = await Promise.all([getPublic(), getViewer()]);
  const p = projects[0];
  return (
    <>
      <section className="bg-ink p-5 text-offwhite">
        <p className="lbl">Locked preview</p>
        <h1 className="h2 mt-3 !text-4xl">Your move starts here.</h1>
        <p className="mt-3">Get a seat in a batch to open My Move.</p>
        <Link href={p ? `/project/${p.slug}` : "/"} className="btn mt-4 border-offwhite bg-offwhite text-ink">See the project</Link>
      </section>
      <div className="mt-6 opacity-50" aria-hidden><LevelBar level={0} total={p?.batches[0]?.sessionsRequired ?? 12} /></div>
      <div className="mt-6 space-y-3" aria-hidden>
        <p className="btn border-dashed border-ink opacity-50">Upload solo session</p>
        <p className="btn border-dashed border-ink opacity-50">I&apos;m out this week</p>
      </div>
      {p && (
        <section className="mt-8 flex flex-col gap-3.5">
          <h2 className="h2">Missions</h2>
          <Missions steps={p.ladder} signedIn savedCut={viewer.cut} locked />
        </section>
      )}
    </>
  );
}

const wednesday = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Kuala_Lumpur" })
    .format(new Date(`${iso}T00:00:00+08:00`)).replace(",", "");

async function Content() {
  await connection();
  const me = await getMe();
  if (me.kind === "signed-out") redirect("/sign-in?next=/move");
  if (me.kind !== "ok") return <Preview />;
  const { ctx } = me;
  if (ctx.unseen.length) redirect("/unlock");

  const db = await supabaseServer();
  const [projects, viewer, { data: extra }, { data: orders }, { data: pay }] = await Promise.all([
    getPublic(),
    getViewer(),
    db.from("ladder_step").select("id, product:product_id(sizes)").eq("season_id", ctx.seasonId),
    db.from("order").select("id, ladder_step_id, size, status, price").eq("player_id", ctx.playerId).order("created_at"),
    db.from("setting").select("value").eq("key", "payment_instructions").maybeSingle(),
  ]);
  const { data: times } = await db.from("setting").select("key, value").in("key", ["window_open", "window_close"]);
  const opens = times?.find((t) => t.key === "window_open")?.value ?? "04:30";
  const closes = times?.find((t) => t.key === "window_close")?.value ?? "23:59";
  const clock = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Kuala_Lumpur" }).format(new Date());

  const today = klToday();
  const { season, rows } = ctx;
  const lvl = level(rows, season);
  const fin = isFinisher(rows, season);
  const week = season.dates.find((d) => d >= today);
  const todayRow = rows.find((r) => r.date === today);
  const isSessionDay = season.dates.includes(today);
  const logged = Boolean(todayRow && todayRow.type !== "absent");
  const inWindow = isSessionDay && clock >= opens && clock <= closes;
  const soloOpen = inWindow && !logged;
  const noticeWeek = season.dates.find((d) => new Date(ctx.noticeDeadlines[d]) > new Date());
  const noticeRow = noticeWeek ? rows.find((r) => r.date === noticeWeek) : undefined;
  const noticeOpen = Boolean(noticeWeek) && !noticeRow;
  const noticeNote = !noticeWeek ? "Batch finished."
    : noticeRow?.type === "absent" && noticeRow.noticeGiven ? `You're out for ${wednesday(noticeWeek)}.`
    : noticeRow ? "Already recorded."
    : `Closes ${closesLabel(ctx.noticeDeadlines[noticeWeek])}.`;
  const soloNote = logged ? "Logged today." : inWindow ? "Training somewhere else? Counts straight away." : `Training somewhere else? Opens Wednesday ${opens}.`;

  const sizes = new Map((extra ?? []).map((e) => [e.id as string, (e.product as unknown as { sizes: string[] } | null)?.sizes ?? []]));
  const batch = projects.flatMap((p) => p.batches).find((b) => b.id === ctx.seasonId);
  const steps: MyStep[] = (batch?.ladder ?? []).map((s) => ({ ...s, sizes: sizes.get(s.id) ?? [] }));
  const mine: MyOrder[] = (orders ?? []).map((o) => ({ id: o.id, stepId: o.ladder_step_id, size: o.size, status: o.status, price: Number(o.price) }));
  const complete = steps.filter((s) => ["complete", "held", "ordered"].includes(missionState(s, steps, lvl, fin, mine.some((o) => o.stepId === s.id)))).length;

  return (
    <>
      <section className="flex flex-col gap-3">
        <Link href={`/project/${ctx.projectSlug}`} className="lbl flex min-h-11 items-center underline">
          {ctx.projectLabel} · {ctx.projectTitle} · Batch {ctx.batchNumber}
        </Link>
        <h1 className="h2 !text-[96px] !leading-[0.9]">LV {lvl}</h1>
        <div className="flex gap-[3px]" role="img" aria-label={`${lvl} of ${season.sessionsRequired} sessions`}>
          {Array.from({ length: season.sessionsRequired }, (_, i) => <div key={i} className={`h-3.5 flex-1 border border-ink ${i < lvl ? "bg-ink" : ""}`} />)}
        </div>
        <div className="flex justify-between font-bold">
          <p>{lvl} of {season.sessionsRequired} sessions</p>
          <p>{wednesdaysRemaining(rows, season, today)} Wednesdays left</p>
        </div>
        {!canStillFinish(rows, season, today) && <p className="text-sm">Your level stays. Your black kit stays. Next season has a seat for you.</p>}
      </section>

      <section className="mt-6 flex flex-col gap-3 bg-ink p-5 text-offwhite">
        <p className="lbl">This week</p>
        <p className="h2 !text-[28px] !leading-none">{week ? `${wednesday(week)} · 5:00` : "Batch finished"}</p>
        {week && <p className="text-sm opacity-80">At the session, scan the founder&apos;s code.</p>}
        <ScanButton enabled={inWindow && !logged} />
        <p className="text-xs opacity-80">{logged ? "You're in for this week." : inWindow ? "Point your camera at the code." : `Opens Wednesday ${opens}. Nothing logged by the end of the day is a miss.`}</p>
        <StatusActions playerId={ctx.playerId} noticeNote={noticeNote} noticeOpen={noticeOpen} soloNote={soloNote} soloOpen={soloOpen} />
      </section>

      <section className="mt-6 flex flex-col gap-3.5">
        <div className="flex items-baseline justify-between gap-3"><h2 className="h2">Missions</h2><p className="lbl">{complete} of {steps.length} complete</p></div>
        <MyMissions steps={steps} level={lvl} finisher={fin} orders={mine} savedCut={viewer.cut} payment={pay?.value ?? ""} />
      </section>
    </>
  );
}

export default function MovePage() {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 pb-8 pt-4"><Suspense fallback={null}><Content /></Suspense></main>
    </>
  );
}
