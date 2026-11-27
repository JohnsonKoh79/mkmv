import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { SubmitButton } from "@/components/SubmitButton";
import { UnlockMoment } from "@/components/UnlockMoment";
import { getMe } from "@/lib/me";
import { getViewer } from "@/lib/viewer";
import { kitImage } from "@/lib/kit";
import { supabaseServer } from "@/lib/supabase/server";
import { markUnlockSeen } from "../actions";

async function UnlockContent() {
  await connection();
  const me = await getMe();
  if (me.kind !== "ok") redirect("/move");
  const step = me.ctx.ladder.find((s) => s.id === me.ctx.unseen[0]);
  if (!step) redirect("/move");

  const db = await supabaseServer();
  const [viewer, { data }] = await Promise.all([
    getViewer(),
    db.from("ladder_step").select("product:product_id(has_cut)").eq("id", step.id).maybeSingle(),
  ]);
  const hasCut = (data?.product as unknown as { has_cut: boolean } | null)?.has_cut ?? false;
  const reserved = step.ink === "oxblood";
  const note = step.isFree ? "Earned by finishing." : reserved ? "Yours to buy when you finish." : "Yours to buy now.";

  return (
    <UnlockMoment key={step.id} level={step.level} product={step.product} reserved={reserved} note={note}
      image={kitImage({ product: step.product, ink: step.ink, hasCut }, viewer.cut)}>
      <form action={markUnlockSeen.bind(null, step.id)}>
        <SubmitButton className={`w-full min-h-14 border text-sm font-bold uppercase tracking-widest ${reserved ? "border-oxblood" : "border-offwhite"}`}>Continue</SubmitButton>
      </form>
    </UnlockMoment>
  );
}

export default function UnlockPage() {
  return <Suspense fallback={null}><UnlockContent /></Suspense>;
}
