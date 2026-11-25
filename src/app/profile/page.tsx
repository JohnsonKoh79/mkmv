import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { ProfileForm } from "./ProfileForm";
import { supabaseServer } from "@/lib/supabase/server";
import { avatarUrl } from "@/lib/photo";

async function Content() {
  await connection();
  const db = await supabaseServer();
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect("/sign-in");
  const { data: p } = await db.from("player").select("id, nickname, photo_url, public_consent").eq("auth_user_id", user.id).maybeSingle();
  if (!p) redirect("/status");
  return <ProfileForm playerId={p.id} nickname={p.nickname ?? ""} photo={avatarUrl(p.photo_url)} consent={p.public_consent} />;
}

export default function ProfilePage() {
  return (
    <>
      <Header />
      <main className="flex-1 px-4 pt-6 pb-8 max-w-xl w-full mx-auto">
        <Link href="/status" className="uppercase text-xs tracking-widest underline">My status</Link>
        <h1 className="font-display text-4xl mt-2"><span className="slant">Profile</span></h1>
        <p className="mt-2 text-sm">The public sees your nickname, photo and level. Nothing else.</p>
        <Suspense fallback={null}><Content /></Suspense>
      </main>
    </>
  );
}
