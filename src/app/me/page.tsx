import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { SubmitButton } from "@/components/SubmitButton";
import { ProfileForm } from "./ProfileForm";
import { WithdrawButton } from "./WithdrawButton";
import { signOut } from "../actions";
import { getViewer } from "@/lib/viewer";
import { getPublic } from "@/lib/public";
import { supabaseServer } from "@/lib/supabase/server";
import { avatarUrl } from "@/lib/photo";

const STATUS: Record<string, string> = { requested: "Requested", waitlisted: "On the waitlist", approved: "You're in" };

// Step 7 replaces this with the full Me page from the mock-up.
async function Content() {
  await connection();
  const v = await getViewer();
  if (!v.signedIn || !v.playerId) redirect("/sign-in?next=/me");
  const db = await supabaseServer();
  const [{ data: p }, projects] = await Promise.all([
    db.from("player").select("nickname, photo_url, public_consent").eq("id", v.playerId).single(),
    getPublic(),
  ]);
  return (
    <>
      {v.requests.length > 0 && (
        <section className="mt-6">
          <h2 className="border-b border-ink pb-2 text-[11px] font-semibold uppercase tracking-[0.16em]">My requests</h2>
          <ul>
            {v.requests.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 border-b border-ink/40 py-3">
                <span className="font-bold">{projects.find((x) => x.id === r.projectId)?.title ?? "Next project"}</span>
                <span className="flex items-center gap-3">
                  {r.status !== "approved" && <WithdrawButton id={r.id} />}
                  <span className="border border-ink px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em]">{STATUS[r.status]}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
      <ProfileForm playerId={v.playerId} nickname={p?.nickname ?? ""} photo={avatarUrl(p?.photo_url)} consent={p?.public_consent ?? false} />
      {v.isFounder && (
        <Link href="/admin" className="mt-8 flex min-h-12 items-center justify-between border border-ink px-4 text-sm font-bold uppercase tracking-wide"><span>Admin</span><span aria-hidden>→</span></Link>
      )}
      <form action={signOut} className="mt-6">
        <SubmitButton className="min-h-11 text-xs font-bold uppercase tracking-widest underline" pendingLabel="Signing out…">Sign out</SubmitButton>
      </form>
    </>
  );
}

export default function MePage() {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 pb-8 pt-6">
        <h1 className="font-display text-4xl"><span className="slant">Me</span></h1>
        <Suspense fallback={null}><Content /></Suspense>
      </main>
    </>
  );
}
