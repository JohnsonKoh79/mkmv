import Link from "next/link";
import { Suspense } from "react";
import { signOut } from "@/app/actions";
import { supabaseConfigured, supabaseServer } from "@/lib/supabase/server";
/* eslint-disable @next/next/no-img-element */

const item = "min-h-11 px-3 flex items-center";

async function Nav() {
  let user = null as { id: string } | null;
  let founder = false;
  if (supabaseConfigured()) {
    const db = await supabaseServer();
    user = (await db.auth.getUser()).data.user;
    if (user) {
      const { data } = await db.from("player").select("role").eq("auth_user_id", user.id).maybeSingle();
      founder = data?.role === "founder";
    }
  }
  // Signed out: Sign in, Join. Signed in: account actions only (Me, Inventory, Profile live in the bottom bar).
  if (!user) {
    return (
      <nav className="flex items-center gap-1 text-sm uppercase tracking-wide font-bold">
        <Link href="/sign-in" className={item}>Sign in</Link>
        <Link href="/join" className={`${item} border border-ink`}>Join</Link>
      </nav>
    );
  }
  return (
    <nav className="flex items-center gap-1 text-sm uppercase tracking-wide font-bold">
      {founder && <Link href="/admin" className={`${item} border border-ink`}>Admin</Link>}
      <form action={signOut}><button className={item}>Sign out</button></form>
    </nav>
  );
}

export function Header() {
  return (
    <header className="flex items-center justify-between px-4 h-16 border-b border-ink">
      <Link href="/" aria-label="MKMV home" className="flex items-center h-11">
        <img src="/logo/mkmv-horizontal-black.svg" alt="MKMV" className="h-6 w-auto" />
      </Link>
      <Suspense fallback={null}><Nav /></Suspense>
    </header>
  );
}
