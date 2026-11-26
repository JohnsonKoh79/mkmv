import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/Header";
import { ProjectButton } from "@/components/ProjectButton";
import { kitImage, rewardName } from "@/lib/kit";
import { getPublic, type Batch, type Project } from "@/lib/public";
import { getViewer, type Viewer } from "@/lib/viewer";
import { batchState, closesLabel, weekLine } from "@/lib/batch";
import { klToday } from "@/lib/me";
import { fmtDate } from "@/lib/format";

function BatchBox({ p, b, viewer, today, now }: { p: Project; b: Batch; viewer: Viewer; today: string; now: Date }) {
  const state = batchState(b, today, now);
  return (
    <div className={`flex flex-col gap-2.5 border border-offwhite p-4 ${state === "undated" ? "border-dashed" : ""}`}>
      <div className="flex items-baseline justify-between"><p className="lbl">Batch {b.number}</p><p className="lbl opacity-80">{weekLine(b, today)}</p></div>
      {state === "undated" ? <p>Date to be confirmed.</p> : (
        <>
          <p>{fmtDate(b.dates[0])} to {fmtDate(b.dates[b.dates.length - 1])}</p>
          <p className="font-bold">{b.seatsTaken} of {b.seatLimit} seats taken</p>
        </>
      )}
      <ProjectButton projectId={p.id} slug={p.slug} batchId={b.id} state={state} viewer={viewer} tone="dark" solid={state !== "undated"} />
      {state === "open" && b.closesAt && <p className="text-xs opacity-80">Open until {closesLabel(b.closesAt)}.</p>}
    </div>
  );
}

async function Content() {
  await connection();
  const [projects, viewer] = await Promise.all([getPublic(), getViewer()]);
  const today = klToday(), now = new Date();
  const running = projects.filter((p) => p.status === "ongoing").length;
  const seated = viewer.seats.length > 0;

  return (
    <>
      <section className="bg-ink px-5 py-10 text-offwhite">
        <div className="mx-auto flex max-w-xl flex-col gap-5">
          <p className="lbl">{!viewer.signedIn ? "Johor Bahru" : seated ? "You're in" : "You're registered"}</p>
          <h1 className="h2 !text-[52px] !leading-[0.98]">{!viewer.signedIn || seated ? "Make your move." : "Pick a project."}</h1>
          <p className="text-[17px]">
            {!viewer.signedIn
              ? "A community of ordinary busy people who keep their word. We run projects. You show up, and you earn the kit."
              : seated ? "Your batch is on. Show up Wednesday."
              : "You are not in a project yet. Request a seat, or join a waitlist."}
          </p>
          {!viewer.signedIn && <a href="#projects" className="btn border-offwhite bg-offwhite text-ink">See the projects</a>}
          {seated && <Link href="/move" className="btn border-offwhite bg-offwhite text-ink">My move</Link>}
        </div>
      </section>

      <div id="projects" className="mx-auto flex w-full max-w-xl flex-col gap-5 px-4 py-7">
        <div className="flex items-baseline justify-between gap-3"><h2 className="h2">Projects</h2><p className="lbl">{running} running</p></div>
        {projects.map((p) => (
          <section key={p.id} className="flex flex-col gap-4 bg-ink p-5 text-offwhite">
            <div className="flex items-center justify-between">
              <p className="lbl">{p.label}</p>
              <p className="lbl border border-offwhite px-2 py-1">{p.status === "ongoing" ? "Running" : p.status === "upcoming" ? "Coming" : "Finished"}</p>
            </div>
            <Link href={`/project/${p.slug}`}><h2 className="h2 whitespace-nowrap !text-[min(10.5vw,50px)] !leading-none">{p.title}</h2></Link>
            <p className="text-base">{p.descriptor}</p>
            {p.ladder.length > 0 && (
              // Reserved pieces sit on off-white, so oxblood never meets black.
              <Link href={`/project/${p.slug}`} className="flex justify-between gap-2 bg-offwhite p-2">
                {[p.ladder[0], p.ladder[1], p.ladder[p.ladder.length - 1]].filter(Boolean).map((s) => (
                  <Image key={s.id} src={kitImage(s, "m")} alt={rewardName(s)} width={196} height={196} sizes="30vw" className="aspect-square w-1/3 object-contain" />
                ))}
              </Link>
            )}
            <p className="lbl opacity-80">{p.ladder.length} missions. Show up to unlock the kit.</p>
            {p.batches.map((b) => <BatchBox key={b.id} p={p} b={b} viewer={viewer} today={today} now={now} />)}
          </section>
        ))}

        <section className="flex flex-col gap-3 border border-dashed border-ink p-5">
          <div className="flex items-center justify-between"><p className="lbl">Next project</p><p className="lbl">Coming</p></div>
          <p>A new challenge{projects[0] ? ` after ${projects[0].title}` : ""}. To be announced.</p>
          <ProjectButton projectId={null} slug={null} batchId={null} state="undated" viewer={viewer} tone="light" solid={false} />
        </section>
        {!viewer.signedIn && <p className="text-[13px]">Anyone can look around. Create an account when you want in.</p>}
      </div>
    </>
  );
}

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-1"><Suspense fallback={null}><Content /></Suspense></main>
    </>
  );
}
