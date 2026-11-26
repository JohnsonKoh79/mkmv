import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { LevelBar } from "@/components/LevelBar";
import { Missions } from "@/components/Missions";
import { StatusActions } from "./StatusActions";
import { Shop, type ShopStep, type ShopOrder } from "./Shop";
import { getMe, klToday } from "@/lib/me";
import { getPublic } from "@/lib/public";
import { getViewer } from "@/lib/viewer";
import { canStillFinish, isFinisher, level, stepState, wednesdaysRemaining } from "@/lib/rules";
import { fmtDate } from "@/lib/format";
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

// Step 6 replaces the seated view with the My Move mock-up.
async function Content() {
  await connection();
  const me = await getMe();
  if (me.kind === "signed-out") redirect("/sign-in?next=/move");
  if (me.kind !== "ok") return <Preview />;
  const { ctx } = me;
  if (ctx.unseen.length) redirect("/unlock");

  const db = await supabaseServer();
  const [{ data: extra }, { data: orders }, { data: pay }] = await Promise.all([
    db.from("ladder_step").select("id, price, product:product_id(sizes)"),
    db.from("order").select("id, ladder_step_id, size, status, price").eq("player_id", ctx.playerId).order("created_at"),
    db.from("setting").select("value").eq("key", "payment_instructions").maybeSingle(),
  ]);

  const today = klToday();
  const { season, rows } = ctx;
  const lvl = level(rows, season);
  const fin = isFinisher(rows, season);
  const todayRow = rows.find((r) => r.date === today);
  const isSessionDay = season.dates.includes(today);
  const soloOpen = isSessionDay && (!todayRow || todayRow.type === "absent");
  const nextNotice = season.dates.find((d) => new Date(ctx.noticeDeadlines[d]) > new Date());
  const noticeGiven = nextNotice ? rows.some((r) => r.date === nextNotice && r.type === "absent" && r.noticeGiven) : false;
  const noticeOpen = Boolean(nextNotice) && !noticeGiven && !rows.some((r) => r.date === nextNotice);
  const noticeLabel = !nextNotice ? "Season over" : noticeGiven ? `You're out · ${fmtDate(nextNotice)}` : noticeOpen ? `Closes Tue 21:00 · ${fmtDate(nextNotice)}` : "Closed";
  const soloNote = todayRow && todayRow.type !== "absent" ? "Logged today" : isSessionDay ? "Today" : "Wednesdays only";

  const extraById = new Map((extra ?? []).map((e) => [e.id as string, e]));
  const ordered = new Set((orders ?? []).map((o) => o.ladder_step_id as string));
  const steps: ShopStep[] = ctx.ladder.map((s) => {
    const e = extraById.get(s.id);
    return {
      id: s.id, level: s.level, product: s.product, ink: s.ink, isFree: s.isFree,
      state: ordered.has(s.id) ? "ordered" : stepState(s, lvl, fin),
      price: e?.price == null ? null : Number(e.price),
      sizes: (e?.product as unknown as { sizes: string[] } | null)?.sizes ?? [],
    };
  });
  const names = new Map(ctx.ladder.map((s) => [s.id, `${s.product} · ${s.ink}`]));
  const myOrders: ShopOrder[] = (orders ?? []).map((o) => ({ id: o.id, label: names.get(o.ladder_step_id) ?? "Piece", size: o.size, status: o.status, price: Number(o.price) }));

  return (
    <>
      <p className="lbl">{ctx.projectName}</p>
      <section className="mt-2 border border-ink p-4">
        <LevelBar level={lvl} total={season.sessionsRequired} />
        <dl className="mt-4 grid grid-cols-2 gap-3">
          <div><dt className="lbl">Sessions</dt><dd className="text-lg font-bold tabular-nums">{lvl} / {season.sessionsRequired}</dd></div>
          <div><dt className="lbl">Wednesdays left</dt><dd className="text-lg font-bold tabular-nums">{wednesdaysRemaining(rows, season, today)}</dd></div>
        </dl>
        {!canStillFinish(rows, season, today) && <p className="mt-4 text-sm">Your level stays. Your black kit stays. Next season has a seat for you.</p>}
      </section>
      <section className="mt-8">
        <h2 className="lbl mb-4 border-b border-ink pb-2">This week</h2>
        <StatusActions playerId={ctx.playerId} noticeLabel={noticeLabel} noticeOpen={noticeOpen} soloOpen={soloOpen} soloNote={soloNote} />
      </section>
      <section className="mt-8">
        <h2 className="h2">Missions</h2>
        <Shop steps={steps} orders={myOrders} payment={pay?.value ?? ""} />
      </section>
    </>
  );
}

export default function MovePage() {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 pb-8 pt-6"><Suspense fallback={null}><Content /></Suspense></main>
    </>
  );
}
