import { SubmitButton } from "@/components/SubmitButton";
import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getMe } from "@/lib/me";
import { markUnlockSeen } from "../actions";

async function UnlockContent() {
  await connection(); // per-request: depends on who is signed in and the current time
  const me = await getMe();
  if (me.kind !== "ok") redirect("/move");
  const step = me.ctx.ladder.find((s) => s.id === me.ctx.unseen[0]);
  if (!step) redirect("/move");

  // Oxblood only on off-white, never on black.
  const ox = step.ink === "oxblood";
  const note = step.isFree ? "Earned by finishing." : ox ? "Available when you finish." : "Yours to buy now.";
  return (
    <main className={`min-h-dvh flex flex-col justify-between p-6 ${ox ? "bg-offwhite text-oxblood" : "bg-ink text-offwhite"}`}>
      <p className="uppercase text-xs tracking-widest">System · LV {step.level}</p>
      <div className={`border-y py-8 ${ox ? "border-oxblood" : "border-offwhite"}`}>
        <p className="uppercase text-sm tracking-widest">Unlocked</p>
        <h1 className="font-display text-5xl sm:text-7xl mt-2"><span className="slant">{step.product}</span></h1>
        <p className="mt-3 uppercase text-sm tracking-widest">{step.ink}</p>
        <p className="mt-6 text-lg">{note}</p>
      </div>
      <form action={markUnlockSeen.bind(null, step.id)}>
        <SubmitButton className={`w-full min-h-14 border uppercase text-sm font-bold tracking-wide ${ox ? "border-oxblood" : "border-offwhite"}`}>Continue</SubmitButton>
      </form>
    </main>
  );
}

export default function UnlockPage() {
  return <Suspense fallback={null}><UnlockContent /></Suspense>;
}
