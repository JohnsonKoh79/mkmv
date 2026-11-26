import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { RequestForm } from "./RequestForm";
import { getPublic } from "@/lib/public";
import { getViewer } from "@/lib/viewer";
import { batchState } from "@/lib/batch";
import { klToday } from "@/lib/me";
import { fmtDate } from "@/lib/format";

async function Content({ params }: { params: Promise<{ slug: string }> }) {
  await connection();
  const [{ slug }, projects, viewer] = await Promise.all([params, getPublic(), getViewer()]);
  const p = projects.find((x) => x.slug === slug);
  if (!p) notFound();
  if (!viewer.signedIn) redirect(`/sign-in?next=/project/${p.slug}/request`);

  const today = klToday(), now = new Date();
  const b = p.batches.find((x) => batchState(x, today, now) === "open");
  const mine = viewer.requests.find((r) => r.projectId === p.id && r.status !== "waitlisted");
  const seated = p.batches.some((x) => viewer.seats.includes(x.id));
  const left = b ? b.dates.filter((d) => d >= today).length : 0;

  return (
    <>
      <Link href={`/project/${p.slug}`} className="flex min-h-11 items-center px-4 text-xs font-bold uppercase tracking-[0.14em]">‹ {p.title}</Link>
      <section className="bg-ink px-5 py-6 text-offwhite">
        <div className="mx-auto flex max-w-xl flex-col gap-2.5">
          <p className="lbl">Request to join</p>
          <h1 className="h2 whitespace-nowrap !text-[40px] !leading-none">{p.title}</h1>
          {b && (
            <>
              <p>Batch {b.number} · {fmtDate(b.dates[0])} to {fmtDate(b.dates[b.dates.length - 1])}</p>
              <p className="font-bold">You have {left} Wednesdays left and need {left === b.sessionsRequired ? "all " : ""}{b.sessionsRequired}.</p>
            </>
          )}
        </div>
      </section>
      <div className="mx-auto w-full max-w-xl px-4 py-6">
        {seated ? <><p>You already have a seat.</p><Link href="/move" className="btn mt-4 border-ink bg-ink text-offwhite">My move</Link></>
          : mine ? <><p>Your request is in. The answer shows under Me.</p><Link href="/me" className="btn mt-4 border-ink">Me</Link></>
          : !b ? <><p>No batch is taking requests right now.</p><Link href={`/project/${p.slug}`} className="btn mt-4 border-ink">Back to the project</Link></>
          : <RequestForm projectId={p.id} />}
      </div>
    </>
  );
}

export default function RequestPage({ params }: { params: Promise<{ slug: string }> }) {
  return (<><Header /><main className="flex-1"><Suspense fallback={null}><Content params={params} /></Suspense></main></>);
}
