import Link from "next/link";
import { Suspense } from "react";
import { adminSignOut } from "@/app/admin/actions";
import { AdminMenu } from "@/components/AdminMenu";
import { SubmitButton } from "@/components/SubmitButton";
import { supabaseServer } from "@/lib/supabase/server";
/* eslint-disable @next/next/no-img-element */

/** The menu with the number of requests waiting for a decision. Row-level security returns 0 to non-founders. */
async function MenuWithCount() {
  const db = await supabaseServer("admin");
  const [requests, proofs] = await Promise.all([
    db.from("join_request").select("*", { count: "exact", head: true }).eq("status", "requested"),
    db.from("order").select("*", { count: "exact", head: true }).eq("status", "preordered").not("proof_url", "is", null),
  ]);
  return <AdminMenu pending={requests.count ?? 0} payments={proofs.count ?? 0} />;
}

/** Admin's own chrome. Shares nothing with the player pages except the logo. */
export function AdminBar({ menu = true }: { menu?: boolean }) {
  return (
    <header className="sticky top-0 z-20 bg-ink text-offwhite">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
        <Link href="/admin" className="flex min-h-11 items-center gap-3">
          <img src="/logo/mkmv-horizontal-offwhite.svg" alt="MKMV" className="h-5 w-auto" />
          <span className="border-l border-offwhite pl-3 uppercase text-xs font-bold tracking-widest">Admin</span>
        </Link>
        {menu && (
          <form action={adminSignOut}>
            <SubmitButton className="min-h-11 uppercase text-xs font-bold tracking-widest" pendingLabel="Signing out…">Sign out</SubmitButton>
          </form>
        )}
      </div>
      {menu && <Suspense fallback={<div className="h-12" />}><MenuWithCount /></Suspense>}
    </header>
  );
}
