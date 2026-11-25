import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Stage } from "@/components/Stage";
import { getPublic } from "@/lib/public";
import { myLoggedDates } from "@/lib/mine";
import { fmtDate } from "@/lib/format";

async function Projects() {
  await connection();
  const [all, mine] = await Promise.all([getPublic(), myLoggedDates()]);
  const ongoing = all.filter((p) => p.status === "ongoing");
  const others = all.filter((p) => p.status !== "ongoing");

  return (
    <>
      {ongoing.length === 0 && <p className="px-4 py-10">Nothing running right now.</p>}
      {ongoing.map((p) => <Stage key={p.id} p={p} mine={mine} />)}

      {others.length > 0 && (
        <section className="mx-auto w-full max-w-3xl px-4 pb-10 space-y-3">
          {others.map((o) => (
            <Link key={o.id} href={`/project/${o.id}`} className="block border border-ink p-4">
              <p className="uppercase text-xs tracking-widest">{o.status}</p>
              <p className="font-display text-2xl mt-1"><span className="slant">{o.name}</span></p>
              <p className="text-sm mt-1">{o.descriptor}{o.status === "upcoming" && o.startDate ? ` Starts ${fmtDate(o.startDate)}.` : ""}</p>
            </Link>
          ))}
        </section>
      )}

      <section className="bg-ink text-offwhite px-4 py-12">
        <div className="mx-auto max-w-3xl">
          <p className="font-display text-5xl leading-none"><span className="slant">Make your move.</span></p>
          {!mine && (
            <Link href="/join" className="mt-6 inline-flex min-h-12 items-center border border-offwhite px-8 uppercase text-sm font-bold tracking-widest">Join</Link>
          )}
        </div>
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
