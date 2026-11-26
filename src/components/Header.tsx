import Link from "next/link";
import { Suspense } from "react";
import { supabaseConfigured, supabaseServer } from "@/lib/supabase/server";
/* eslint-disable @next/next/no-img-element */

async function Nav() {
  let user = null as { id: string } | null;
  let nickname: string | null = null;
  if (supabaseConfigured()) {
    const db = await supabaseServer();
    user = (await db.auth.getUser()).data.user;
    if (user) nickname = (await db.from("player").select("nickname").eq("auth_user_id", user.id).maybeSingle()).data?.nickname ?? null;
  }
  // Signed out: Sign in, Join. Signed in: just who you are; the tabs do the rest.
  if (!user) {
    return (
      <nav className="flex items-center gap-4">
        <Link href="/sign-in" className="flex min-h-11 items-center text-[13px] font-semibold">Sign in</Link>
        <Link href="/sign-in" className="flex min-h-11 items-center border border-ink px-3.5 text-xs font-bold uppercase tracking-[0.14em]">Join</Link>
      </nav>
    );
  }
  return (
    <Link href="/me" className="flex min-h-11 items-center text-xs font-bold uppercase tracking-[0.14em]">{nickname ?? "Me"}</Link>
  );
}

export function Header() {
  return (
    <header className="flex items-center justify-between border-b border-ink px-4 py-1">
      <Link href="/" aria-label="MKMV home" className="flex min-h-11 items-center">
        <img src="/logo/mkmv-horizontal-black.svg" alt="MKMV" className="h-4 w-auto" />
      </Link>
      <Suspense fallback={null}><Nav /></Suspense>
    </header>
  );
}
