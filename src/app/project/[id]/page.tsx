import { Suspense } from "react";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Ladder } from "@/components/Ladder";
import { PlayerCard } from "@/components/PlayerCard";
import { getPublic, weekLabel } from "@/lib/public";
import { fmtDate } from "@/lib/format";
import { klToday } from "@/lib/me";

const H = ({ children }: { children: React.ReactNode }) => (
  <h2 className="uppercase text-xs tracking-widest border-b border-ink pb-2 mb-4">{children}</h2>
);

async function Content({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  const p = (await getPublic()).find((x) => x.id === id);
  if (!p) notFound();
  const today = klToday();
  return (
    <main className="flex-1">
      <section className="px-4 py-10 border-b border-ink">
        <h1 className="font-display text-5xl sm:text-7xl"><span className="slant">{p.name}</span></h1>
        <p className="mt-3 text-lg">{p.descriptor}</p>
        <p className="mt-1 uppercase text-sm tracking-widest">{weekLabel(p)}</p>
      </section>

      <section className="px-4 py-8 border-b border-ink">
        <H>Rules</H>
        <ul className="space-y-2">
          <li>{p.sessionsRequired} sessions. {p.dates.length} Wednesdays. Show up.</li>
          <li>{p.dates.length - p.sessionsRequired} misses allowed. Say so before Tuesday 21:00.</li>
          <li>Every session is +1 level. Nothing resets.</li>
          <li>Finish. The oxblood kit is earned.</li>
        </ul>
      </section>

      <section className="px-4 py-8 border-b border-ink">
        <H>Dates</H>
        <ol className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm uppercase tracking-wide tabular-nums">
          {p.dates.map((d, i) => (
            <li key={d} className={d <= today ? "" : "opacity-70"}><span className="inline-block w-8">{String(i + 1).padStart(2, "0")}</span>{fmtDate(d)}</li>
          ))}
        </ol>
      </section>

      <section className="px-4 py-8 border-b border-ink"><H>Unlocks</H><Ladder steps={p.ladder} /></section>

      <section className="px-4 py-8">
        <H>Players</H>
        {p.players.length ? (
          <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-3 gap-y-6">
            {p.players.map((pl) => <PlayerCard key={pl.id} id={pl.id} nickname={pl.nickname} level={pl.level} photo={pl.photo} finisher={pl.level >= p.sessionsRequired} />)}
          </ul>
        ) : <p>Roster drops soon.</p>}
      </section>
    </main>
  );
}

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  return (<><Header /><Suspense fallback={null}><Content params={params} /></Suspense></>);
}
