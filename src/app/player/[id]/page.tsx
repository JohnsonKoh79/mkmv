import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { notFound } from "next/navigation";
/* eslint-disable @next/next/no-img-element */
import { Header } from "@/components/Header";
import { Ladder } from "@/components/Ladder";
import { LevelBar } from "@/components/LevelBar";
import { getHistory, getPublic } from "@/lib/public";
import { Achievements, Label, RecordList } from "@/components/History";
import { earned, recordLines } from "@/lib/record";

async function Content({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  const joined = (await getPublic()).flatMap((p) =>
    p.batches.flatMap((b) => {
      const me = b.players.find((pl) => pl.id === id);
      return me ? [{ p, b, me }] : [];
    }),
  );
  if (!joined.length) notFound();
  const me = joined[0].me;
  const finished = joined.filter((j) => j.me.level >= j.b.sessionsRequired);
  const history = await getHistory(id);
  const per = joined.map(({ b }) => ({ b, defs: history.definitions.filter((d) => d.season_id === b.id), logged: history.record.filter((r) => r.season_id === b.id) }));
  const achievements = per.flatMap(({ b, defs, logged }) => defs.map((d) => ({ name: d.name, got: earned(d, logged, b) })));
  const lines = per.flatMap(({ b, defs, logged }) => recordLines(logged, defs, b.ladder, b).map((l) => ({ ...l, key: `${b.id}${l.date}` })));

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 py-8">
      <div className="border border-ink">
        <div className="aspect-square overflow-hidden border-b border-ink">
          {me.photo ? <img src={me.photo} alt={me.nickname} className="h-full w-full object-cover" /> : (
            <div className="flex h-full items-end p-3"><span className="font-display text-7xl leading-none opacity-30" aria-hidden>{me.nickname.slice(0, 1)}</span></div>
          )}
        </div>
        <div className="p-4"><p className="lbl">MKMV player</p><h1 className="h2 mt-1 !text-4xl">{me.nickname}</h1></div>
      </div>

      {joined.map(({ p, b, me: m }) => (
        <section key={b.id} className="mt-8">
          <h2 className="lbl mb-4 border-b border-ink pb-2">{p.title} · Batch {b.number}</h2>
          <LevelBar level={m.level} total={b.sessionsRequired} />
          {m.level >= b.sessionsRequired && <p className="lbl mt-3 inline-block border border-oxblood px-3 py-1 text-oxblood">Finisher</p>}
          <div className="mt-6"><Ladder steps={b.ladder} level={m.level} /></div>
        </section>
      ))}

      <section className="mt-8"><Label>Achievements</Label><Achievements items={achievements} /></section>
      <section className="mt-8"><Label>Record</Label><RecordList lines={lines} /></section>

      <section className="mt-8">
        <h2 className="lbl mb-4 border-b border-ink pb-2">Finished</h2>
        {finished.length ? finished.map((j) => <p key={j.b.id} className="h2 !text-xl text-oxblood">{j.p.title}</p>) : <p>Not yet.</p>}
      </section>
      <Link href={`/project/${joined[0].p.slug}`} className="btn mt-8 border-ink">Back to {joined[0].p.title}</Link>
    </main>
  );
}

export default function PlayerPage({ params }: { params: Promise<{ id: string }> }) {
  return (<><Header /><Suspense fallback={null}><Content params={params} /></Suspense></>);
}
