import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Missions } from "@/components/Missions";
import { PlayerCard } from "@/components/PlayerCard";
import { ProjectButton } from "@/components/ProjectButton";
import { getPublic } from "@/lib/public";
import { getViewer } from "@/lib/viewer";
import { batchState, closesLabel, weekLine } from "@/lib/batch";
import { supabaseServer } from "@/lib/supabase/server";
import { klToday } from "@/lib/me";
import { fmtDate } from "@/lib/format";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ batch?: string }> };
const short = (iso: string) => fmtDate(iso).replace(/ \d{4}$/, "").toUpperCase();

/** The signed-in player's own logged dates. Only ever their own rows. */
async function myDates(playerId: string | null): Promise<Set<string>> {
  if (!playerId) return new Set();
  const db = await supabaseServer();
  const { data } = await db.from("attendance").select("session_date:session_date_id(date)").eq("player_id", playerId).in("type", ["group", "solo"]);
  return new Set((data ?? []).map((a) => (a.session_date as unknown as { date: string }).date));
}

async function Content({ params, searchParams }: Props) {
  await connection();
  const [{ slug }, { batch: wanted }, projects, viewer] = await Promise.all([params, searchParams, getPublic(), getViewer()]);
  const p = projects.find((x) => x.slug === slug || x.id === slug);
  if (!p) notFound();
  const today = klToday(), now = new Date();
  const b = p.batches.find((x) => String(x.number) === wanted) ?? p.batches[0];
  const state = b ? batchState(b, today, now) : "undated";
  const dated = Boolean(b?.dates.length);
  const left = b ? b.dates.filter((d) => d >= today).length : 0;
  const next = b?.dates.find((d) => d >= today);
  const mine = await myDates(viewer.playerId);
  const required = b?.sessionsRequired ?? 12;
  const openSeats = b ? Math.max(b.seatLimit - b.seatsTaken, 0) : 0;
  const hidden = b ? Math.max(b.seatsTaken - b.players.length, 0) : 0; // seats whose player has not gone public

  return (
    <>
      <Link href="/" className="flex min-h-11 items-center px-4 text-xs font-bold uppercase tracking-[0.14em]">‹ All projects</Link>
      <section className="bg-ink px-5 py-6 text-offwhite">
        <div className="mx-auto flex max-w-xl flex-col gap-3.5">
          <p className="lbl">{p.label}</p>
          <h1 className="h2 whitespace-nowrap !text-[min(11.5vw,58px)] !leading-[0.95]">{p.title}</h1>
          <p className="text-base">{p.descriptor}</p>
          {p.batches.length > 1 && (
            <div className="flex gap-2">
              {p.batches.map((x) => (
                <Link key={x.id} href={`/project/${p.slug}?batch=${x.number}`} scroll={false} aria-current={x.id === b?.id ? "true" : undefined}
                  className={`flex min-h-11 flex-1 items-center justify-center border border-offwhite text-xs font-bold uppercase tracking-[0.14em] ${x.id === b?.id ? "bg-offwhite text-ink" : "border-dashed"}`}>
                  Batch {x.number}{x.startDate ? "" : " · Next"}
                </Link>
              ))}
            </div>
          )}
          <p className="lbl opacity-80">{b && dated ? `${weekLine(b, today)} · ${b.seatsTaken} of ${b.seatLimit} seats taken` : "Date to be confirmed."}</p>
          <ProjectButton projectId={p.id} slug={p.slug} batchId={b?.id ?? null} state={state} viewer={viewer} tone="dark" />
          {state === "open" && b?.closesAt && (
            <p className="text-xs opacity-80">
              Requests close {closesLabel(b.closesAt)}. Join now and you have {left} Wednesdays to make {required}.
              {left === required ? " You need all of them." : ""}
            </p>
          )}
        </div>
      </section>

      <div className="mx-auto flex w-full max-w-xl flex-col gap-8 px-4 py-7">
        {b && dated && (
          <>
            <section className="flex flex-col gap-3.5">
              <div className="flex items-baseline justify-between gap-3"><h2 className="h2">The map</h2><p className="lbl">Number = showed up</p></div>
              <ol className="grid grid-cols-7 gap-1">
                {b.dates.map((d, i) => {
                  const past = d < today, isNext = d === next, own = mine.has(d);
                  return (
                    <li key={d} aria-current={isNext ? "step" : undefined} style={{ animationDelay: `${i * 15}ms` }}
                      className={`wipe flex h-[62px] flex-col justify-between px-1 py-[5px] ${own ? "bg-ink text-offwhite" : ""} ${
                        isNext ? "border-[3px] border-ink" : past ? "border border-ink" : "border border-dashed border-ink"}`}>
                      <span className="text-[9px] font-bold tracking-[0.08em]">WK {i + 1}</span>
                      <span className="text-[13px] font-extrabold">{past ? b.showed[d] ?? 0 : isNext ? (d === today ? "NOW" : "NEXT") : ""}</span>
                      <span className="text-[9px] font-semibold">{short(d)}</span>
                    </li>
                  );
                })}
              </ol>
            </section>

            <dl className="grid grid-cols-3 border-y border-ink">
              {[
                ["Sessions logged", Object.values(b.showed).reduce((a, n) => a + n, 0)],
                ["Weeks done", b.dates.filter((d) => d < today).length],
                ["Finishers", b.finishers],
              ].map(([label, n], i) => (
                <div key={label} className={`flex flex-col-reverse py-4 ${i ? "border-l border-ink pl-3" : ""}`}>
                  <dt className="lbl !text-[10px]">{label}</dt>
                  <dd className="font-display mb-1.5 text-4xl leading-none tabular-nums">{n}</dd>
                </div>
              ))}
            </dl>
          </>
        )}

        <section className="flex flex-col gap-3.5">
          <div className="flex items-baseline justify-between gap-3"><h2 className="h2">Missions</h2><p className="lbl">{p.ladder.length} in this project</p></div>
          <p className="text-sm">Every mission unlocks one piece of the {p.title} kit. You only get the kit by showing up.</p>
          <Missions steps={p.ladder} signedIn={viewer.signedIn} savedCut={viewer.cut} fixedCut={viewer.fixedCut} />
        </section>

        {b && dated && (
          <section className="flex flex-col gap-3.5">
            <div className="flex items-baseline justify-between gap-3"><h2 className="h2">Who is in</h2><p className="lbl">Batch {b.number}</p></div>
            {/* Join order. Never sorted by level. */}
            <ul className="grid grid-cols-3 gap-x-2.5 gap-y-3">
              {b.players.map((pl) => <PlayerCard key={pl.id} id={pl.id} nickname={pl.nickname} level={pl.level} photo={pl.photo} finisher={pl.level >= required} />)}
              {Array.from({ length: hidden }, (_, i) => (
                <li key={`t${i}`} className="lbl flex aspect-square items-center justify-center border border-ink text-center">Seat<br />taken</li>
              ))}
              {Array.from({ length: openSeats }, (_, i) => (
                <li key={`o${i}`} className="lbl flex aspect-square items-center justify-center border border-dashed border-ink text-center">Open<br />seat</li>
              ))}
            </ul>
          </section>
        )}

        <section className="flex flex-col gap-3.5">
          <h2 className="h2">The rules</h2>
          <ul className="border-t border-ink">
            {[
              `${required} sessions. ${b?.dates.length || 14} Wednesdays. Show up.`,
              `${(b?.dates.length || 14) - required} misses allowed. Say so before Tuesday 21:00.`,
              "Every session is +1 level. Nothing resets.",
              "Finish. The Reserved singlet is earned.",
            ].map((r) => <li key={r} className="border-b border-ink/40 py-3 font-bold">{r}</li>)}
          </ul>
        </section>
      </div>
    </>
  );
}

export default function ProjectPage(props: Props) {
  return (<><Header /><main className="flex-1"><Suspense fallback={null}><Content {...props} /></Suspense></main></>);
}
