import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { notFound } from "next/navigation";
/* eslint-disable @next/next/no-img-element */
import { Header } from "@/components/Header";
import { Ladder } from "@/components/Ladder";
import { LevelBar } from "@/components/LevelBar";
import { getPublic } from "@/lib/public";

const H = ({ children }: { children: React.ReactNode }) => (
  <h2 className="uppercase text-xs tracking-widest border-b border-ink pb-2 mb-4">{children}</h2>
);

async function Content({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  const projects = (await getPublic()).filter((p) => p.players.some((pl) => pl.id === id));
  const me = projects[0]?.players.find((pl) => pl.id === id);
  if (!me) notFound();
  const finished = projects.filter((p) => (p.players.find((pl) => pl.id === id)?.level ?? 0) >= p.sessionsRequired);

  return (
    <main className="flex-1 px-4 py-8 max-w-xl w-full mx-auto">
      <div className="border border-ink">
        <div className="aspect-[4/5] border-b border-ink overflow-hidden">
          {me.photo ? <img src={me.photo} alt={me.nickname} className="h-full w-full object-cover" /> : (
            <div className="h-full flex items-end p-3"><span className="font-display text-7xl leading-none opacity-30" aria-hidden>{me.nickname.slice(0, 1)}</span></div>
          )}
        </div>
        <div className="p-4">
          <p className="uppercase text-xs tracking-widest">Player</p>
          <h1 className="font-display text-4xl mt-1"><span className="slant">{me.nickname}</span></h1>
        </div>
      </div>

      {projects.map((p) => {
        const lvl = p.players.find((pl) => pl.id === id)?.level ?? 0;
        const done = lvl >= p.sessionsRequired;
        return (
          <div key={p.id}>
            <section className="mt-8">
              <H>{p.name}</H>
              <LevelBar level={lvl} total={p.sessionsRequired} />
              {done && <p className="mt-3 inline-block border border-oxblood text-oxblood px-3 py-1 uppercase text-xs font-bold tracking-widest">Finisher</p>}
            </section>
            <section className="mt-8"><H>Inventory</H><Ladder steps={p.ladder} level={lvl} /></section>
          </div>
        );
      })}

      <section className="mt-8">
        <H>Finished</H>
        {finished.length ? finished.map((p) => <p key={p.id} className="font-display text-xl text-oxblood"><span className="slant">{p.name}</span></p>) : <p>Not yet.</p>}
      </section>

      <Link href={`/project/${projects[0].id}`} className="mt-8 inline-flex min-h-11 items-center border border-ink px-5 uppercase text-sm font-bold tracking-wide">
        Back to {projects[0].name}
      </Link>
    </main>
  );
}

export default function PlayerPage({ params }: { params: Promise<{ id: string }> }) {
  return (<><Header /><Suspense fallback={null}><Content params={params} /></Suspense></>);
}
