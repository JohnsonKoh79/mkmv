import Link from "next/link";
import { Ladder } from "@/components/Ladder";
import { PlayerCard } from "@/components/PlayerCard";
import { fmtDate } from "@/lib/format";
import { klToday } from "@/lib/me";
import { weekLabel, type PublicProject } from "@/lib/public";

const H = ({ children, note }: { children: React.ReactNode; note?: string }) => (
  <div className="mb-4 flex items-end justify-between gap-3">
    <h2 className="font-display text-3xl"><span className="slant">{children}</span></h2>
    {note && <p className="uppercase text-xs tracking-widest text-right">{note}</p>}
  </div>
);

const days = (from: string, to: string) => Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000);
const short = (iso: string) => fmtDate(iso).replace(/ \d{4}$/, "");

/** The project is the stage. `mine` is the signed-in player's logged dates, or null when signed out. */
export function Stage({ p, mine }: { p: PublicProject; mine: Set<string> | null }) {
  const today = klToday();
  const first = p.dates[0];
  const before = Boolean(first) && today < first;
  const next = p.dates.find((d) => d >= today);
  const done = p.dates.filter((d) => d < today).length;
  const total = Object.values(p.showed).reduce((a, b) => a + b, 0);
  const week = Math.min(p.dates.filter((d) => d <= today).length, p.dates.length);
  const big = before ? days(today, first) : week;
  const bigLabel = before ? `${big === 1 ? "day" : "days"} to go` : `of ${p.dates.length} weeks`;

  return (
    <>
      <section className="bg-ink text-offwhite px-4 pt-8 pb-8">
        <div className="mx-auto max-w-3xl">
          <p className="uppercase text-xs tracking-widest">{p.status === "finished" ? "Finished" : weekLabel(p, today)}</p>
          <h1 className="font-display mt-3 text-[13.5vw] leading-[0.9] sm:text-8xl"><span className="slant">{p.name}</span></h1>
          <p className="mt-4 text-lg">{p.descriptor}</p>
          {first && p.status !== "finished" && (
            <p className="mt-8 flex items-end gap-3 border-t border-offwhite pt-4">
              <span className="font-display text-8xl leading-none tabular-nums"><span className="slant">{big}</span></span>
              <span className="uppercase text-sm font-bold tracking-widest pb-2">{bigLabel}</span>
            </p>
          )}
          <div className="mt-6 grid grid-cols-2 gap-3">
            <Link href={mine ? "/status" : "/join"} className="flex min-h-14 items-center justify-center bg-offwhite text-ink uppercase text-sm font-bold tracking-widest">
              {mine ? "My move" : "Join"}
            </Link>
            <a href="#kit" className="flex min-h-14 items-center justify-center border border-offwhite uppercase text-sm font-bold tracking-widest">The kit</a>
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-3xl">
        <section className="px-4 py-10">
          <H note={mine ? "Filled = yours" : undefined}>The map</H>
          <ol className="grid grid-cols-4 gap-2 sm:grid-cols-7">
            {p.dates.map((d, i) => {
              const past = d < today;
              const now = d === next;
              const own = mine?.has(d) ?? false;
              const showed = p.showed[d] ?? 0;
              return (
                <li key={d} style={{ animationDelay: `${i * 15}ms` }} aria-current={now ? "step" : undefined}
                  className={`wipe flex aspect-square flex-col justify-between p-2 ${own ? "bg-ink text-offwhite" : ""} ${
                    now ? "border-4 border-ink" : past ? "border border-ink" : "border border-dashed border-ink/60"}`}>
                  <span className="uppercase text-[10px] font-bold tracking-widest">{now ? (d === today ? "Today" : "Next") : `Wk ${i + 1}`}</span>
                  {past || (d === today && showed > 0) ? (
                    <span><span className="font-display text-2xl leading-none tabular-nums">{showed}</span><span className="block text-[10px] uppercase tracking-wide">showed up</span></span>
                  ) : (
                    <span className="text-xs font-bold uppercase leading-tight">{short(d)}</span>
                  )}
                </li>
              );
            })}
          </ol>
        </section>

        <section className="px-4 pb-10">
          <dl className="grid grid-cols-3 border-y border-ink">
            {[["Sessions logged", total], ["Weeks done", done], ["Finishers", p.finishers]].map(([label, n], i) => (
              <div key={label} className={`flex flex-col-reverse py-4 ${i ? "border-l border-ink pl-3" : ""}`}>
                <dt className="uppercase text-[10px] font-bold tracking-widest">{label}</dt>
                <dd className="font-display text-5xl leading-none tabular-nums mb-2">{n}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section id="kit" className="scroll-mt-4 px-4 pb-10">
          <H note={`Show up. Unlock all ${p.ladder.length}.`}>The kit</H>
          <Ladder steps={p.ladder} />
        </section>

        <section className="px-4 pb-10">
          <H>Who is in</H>
          {p.players.length ? (
            // Join order. Never sorted by level.
            <ul className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-4">
              {p.players.map((pl) => (
                <PlayerCard key={pl.id} id={pl.id} nickname={pl.nickname} level={pl.level} photo={pl.photo} finisher={pl.level >= p.sessionsRequired} />
              ))}
            </ul>
          ) : (
            <p className="border border-dashed border-ink p-6 text-center uppercase text-sm font-bold tracking-widest">Roster drops soon. Referral only.</p>
          )}
        </section>

        <section className="px-4 pb-10">
          <H>The rules</H>
          <ul className="border-t border-ink">
            {[
              `${p.sessionsRequired} sessions. ${p.dates.length} Wednesdays. Show up.`,
              `${p.dates.length - p.sessionsRequired} misses allowed. Say so before Tuesday 21:00.`,
              "Every session is +1 level. Nothing resets.",
              "Finish. The oxblood kit is earned.",
            ].map((r) => <li key={r} className="border-b border-ink/40 py-3 font-bold">{r}</li>)}
          </ul>
          <details className="mt-2">
            <summary className="flex min-h-12 cursor-pointer items-center uppercase text-xs font-bold tracking-widest underline">All {p.dates.length} dates</summary>
            <ol className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm uppercase tracking-wide tabular-nums">
              {p.dates.map((d, i) => <li key={d}><span className="inline-block w-8">{String(i + 1).padStart(2, "0")}</span>{fmtDate(d)}</li>)}
            </ol>
          </details>
        </section>
      </div>
    </>
  );
}
