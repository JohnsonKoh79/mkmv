import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import Link from "next/link";
/* eslint-disable @next/next/no-img-element */
import { Header } from "@/components/Header";
import { SubmitButton } from "@/components/SubmitButton";
import { Achievements, Label, RecordList } from "@/components/History";
import { ProfileForm } from "./ProfileForm";
import { WithdrawButton } from "./WithdrawButton";
import { MyKit } from "./MyKit";
import { PendingBanner } from "@/components/PendingBanner";
import { signOut } from "../actions";
import { getViewer } from "@/lib/viewer";
import { getHistory, getPublic } from "@/lib/public";
import { supabaseServer } from "@/lib/supabase/server";
import { avatarUrl } from "@/lib/photo";
import { earned, recordLines, type Logged } from "@/lib/record";

const STATUS: Record<string, string> = { requested: "Requested", waitlisted: "On the waitlist", approved: "You're in" };

async function Content({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  await connection();
  const { tab: wanted } = await searchParams;
  const tab = wanted === "kit" || wanted === "account" ? wanted : "progress";
  const v = await getViewer();
  if (!v.signedIn || !v.playerId) redirect("/sign-in?next=/me");
  const db = await supabaseServer();
  const [{ data: p }, projects, history, { data: att }] = await Promise.all([
    db.from("player").select("nickname, photo_url, public_consent").eq("id", v.playerId).single(),
    getPublic(),
    getHistory(),
    // Own rows only; the record lists logged sessions and nothing else.
    db.from("attendance").select("type, session_date:session_date_id(season_id, date)").eq("player_id", v.playerId).in("type", ["group", "solo"]),
  ]);
  const logged = (att ?? []).map((a) => {
    const d = a.session_date as unknown as { season_id: string; date: string };
    return { season: d.season_id, date: d.date, type: a.type as "group" | "solo" };
  });
  const mine = projects.flatMap((pr) =>
    pr.batches.filter((b) => v.seats.includes(b.id)).map((b) => {
      const sessions: Logged[] = logged.filter((l) => l.season === b.id);
      return { pr, b, sessions };
    }),
  );
  const photo = avatarUrl(p?.photo_url);
  const name = p?.nickname ?? "Pick a nickname";

  const achievements = mine.flatMap(({ b, sessions }) =>
    history.definitions.filter((d) => d.season_id === b.id).map((d) => ({ name: d.name, got: earned(d, sessions, b) })),
  );
  const lines = mine.flatMap(({ b, sessions }) =>
    recordLines(sessions, history.definitions.filter((d) => d.season_id === b.id), b.ladder, b).map((l) => ({ ...l, key: `${b.id}${l.date}` })),
  );

  const tabs = [["progress", "Progress"], ["kit", "My kit"], ["account", "Account"]] as const;
  return (
    <div className="flex flex-col gap-6">
      <section className="flex items-center gap-4">
        <div className="flex aspect-square w-24 shrink-0 items-center justify-center overflow-hidden border border-ink">
          {photo ? <img src={photo} alt="Your photo" className="h-full w-full object-cover" /> : <span className="font-display text-4xl opacity-30" aria-hidden>{name.slice(0, 1)}</span>}
        </div>
        <div className="min-w-0">
          <p className="lbl">MKMV player</p>
          <h1 className="h2 mt-1 break-words !text-4xl">{name}</h1>
          {!p?.nickname && <Link href="/me?tab=account" className="flex min-h-11 items-center text-xs font-bold uppercase tracking-widest underline">Set up profile</Link>}
        </div>
      </section>

      <div><PendingBanner playerId={v.playerId} />
        <nav aria-label="My sections" className="flex border border-ink">
          {tabs.map(([key, text]) => (
            <Link key={key} href={`/me?tab=${key}`} scroll={false} aria-current={tab === key ? "page" : undefined}
              className={`flex min-h-12 flex-1 items-center justify-center text-xs font-bold uppercase tracking-[0.14em] ${tab === key ? "bg-ink text-offwhite" : ""}`}>{text}</Link>
          ))}
        </nav>
      </div>

      {tab === "progress" && (
        <>
          <section>
            <Label>My projects</Label>
            {mine.length ? mine.map(({ pr, b, sessions }) => (
              <Link key={b.id} href="/move" className="flex items-center justify-between gap-3 border-b border-ink/40 py-3">
                <span><span className="lbl block">{pr.label} · Batch {b.number}</span><b className="text-lg">{pr.title}</b></span>
                <span className="font-display text-2xl tabular-nums">LV {sessions.length}</span>
              </Link>
            )) : <p className="mt-3">Not in a project yet. <Link href="/" className="font-bold underline">Pick one.</Link></p>}
          </section>
          {v.requests.length > 0 && (
            <section>
              <Label>My requests</Label>
              <ul>
                {v.requests.map((r) => {
                  const pr = projects.find((x) => x.id === r.projectId);
                  return (
                    <li key={r.id} className="flex items-center justify-between gap-3 border-b border-ink/40 py-3">
                      <span className="font-bold">{pr ? `${pr.label} · ${pr.title}` : "Next project"}</span>
                      <span className="flex items-center gap-3">
                        {r.status !== "approved" && <WithdrawButton id={r.id} />}
                        <span className="lbl !text-[10px] border border-ink px-2 py-0.5">{STATUS[r.status]}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
          {mine.length > 0 && (
            <>
              <section><Label>Achievements</Label><Achievements items={achievements} /></section>
              <section><Label note={p?.public_consent ? "Public" : "Private"}>My record</Label><RecordList lines={lines} /></section>
            </>
          )}
        </>
      )}

      {tab === "kit" && (mine.length
        ? <MyKit playerId={v.playerId} projects={mine.map(({ pr, b, sessions }) => ({ title: pr.title, seasonId: b.id, level: sessions.length, ladder: b.ladder }))} />
        : <p>Your kit shows up once you have a seat.</p>)}

      {tab === "account" && (
        <section>
          <Label>Profile</Label>
          <ProfileForm playerId={v.playerId} nickname={p?.nickname ?? ""} photo={photo} consent={p?.public_consent ?? false} />
          {v.isFounder && (
            <Link href="/admin" className="mt-8 flex min-h-12 items-center justify-between border border-ink px-4 text-sm font-bold uppercase tracking-wide"><span>Admin</span><span aria-hidden>→</span></Link>
          )}
          <form action={signOut} className="mt-4">
            <SubmitButton className="btn border-ink" pendingLabel="Signing out…">Sign out</SubmitButton>
          </form>
        </section>
      )}
    </div>
  );
}

export default function MePage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 pb-8 pt-6"><Suspense fallback={null}><Content searchParams={searchParams} /></Suspense></main>
    </>
  );
}
