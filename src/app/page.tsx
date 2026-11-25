import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { Header } from "@/components/Header";
import { PlayerCard } from "@/components/PlayerCard";
import { getPublic, weekLabel } from "@/lib/public";
import { fmtDate } from "@/lib/format";

async function Projects() {
  await connection();
  const all = await getPublic();
  const ongoing = all.filter((p) => p.status === "ongoing");
  const upcoming = all.filter((p) => p.status === "upcoming");
  const finished = all.filter((p) => p.status === "finished");

  return (
    <>
      {ongoing.length === 0 && <section className="px-4 py-10"><p>Nothing running right now.</p></section>}
      {ongoing.map((p) => (
        <section key={p.id} className="bg-ink text-offwhite px-4 py-10">
          <p className="uppercase text-xs tracking-widest">Ongoing</p>
          <h1 className="font-display text-5xl sm:text-7xl mt-2"><span className="slant">{p.name}</span></h1>
          <p className="mt-3 text-lg">{p.descriptor}</p>
          <p className="mt-1 uppercase text-sm tracking-widest">{weekLabel(p)}</p>
          {/* Join order. Never sorted by level. */}
          {p.players.length ? (
            <ul className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-3 gap-y-6">
              {p.players.map((pl) => (
                <PlayerCard key={pl.id} id={pl.id} nickname={pl.nickname} level={pl.level} photo={pl.photo} finisher={pl.level >= p.sessionsRequired} dark />
              ))}
            </ul>
          ) : (
            <p className="mt-8">Roster drops soon.</p>
          )}
          <Link href={`/project/${p.id}`} className="mt-8 inline-flex min-h-11 items-center border border-offwhite px-5 uppercase text-sm font-bold tracking-wide">
            See the rules
          </Link>
        </section>
      ))}

      {upcoming.length > 0 && (
        <section className="px-4 py-10 border-b border-ink">
          <p className="uppercase text-xs tracking-widest">Upcoming</p>
          {upcoming.map((u) => (
            <div key={u.id} className="mt-2">
              <h2 className="font-display text-3xl"><span className="slant">{u.name}</span></h2>
              <p className="mt-1">{u.descriptor}{u.startDate ? ` Starts ${fmtDate(u.startDate)}.` : ""}</p>
            </div>
          ))}
        </section>
      )}

      <section className="px-4 py-10">
        <p className="uppercase text-xs tracking-widest">Finished</p>
        {finished.length === 0 ? <p className="mt-2">No finishers yet. First one is coming.</p> : finished.map((f) => (
          <Link key={f.id} href={`/project/${f.id}`} className="mt-2 block font-display text-2xl"><span className="slant">{f.name}</span></Link>
        ))}
        <Link href="/join" className="mt-8 inline-flex min-h-11 items-center bg-ink text-offwhite px-5 uppercase text-sm font-bold tracking-wide">Join</Link>
        <p className="mt-6 font-display text-2xl"><span className="slant">Make your move.</span></p>
      </section>
    </>
  );
}

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-1"><Suspense fallback={null}><Projects /></Suspense></main>
    </>
  );
}
