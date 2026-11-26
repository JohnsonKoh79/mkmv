"use client";
import { useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

// Admin IDs are stored as <id>@admin.mkmv.club. That domain has no mailbox: reset passwords in Supabase.
const toEmail = (id: string) => (id.includes("@") ? id.trim() : `${id.trim().toLowerCase()}@admin.mkmv.club`);
const field = "w-full min-h-14 border border-ink bg-offwhite px-4 text-lg";

export function AdminSignInForm() {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (lock.current) return;
    lock.current = true; setBusy(true); setMsg("");
    const db = supabaseBrowser();
    const { error } = await db.auth.signInWithPassword({ email: toEmail(id), password });
    if (error) {
      lock.current = false; setBusy(false);
      return setMsg(error.status === 429 ? "Too many tries. Wait a minute." : "Wrong ID or password.");
    }
    await db.rpc("link_player");
    window.location.assign("/admin");
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-4">
      <div>
        <label htmlFor="admin-id" className="block uppercase text-xs tracking-widest mb-1">ID</label>
        <input id="admin-id" required autoComplete="username" autoCapitalize="none" value={id} onChange={(e) => setId(e.target.value)} className={field} />
      </div>
      <div>
        <label htmlFor="admin-password" className="block uppercase text-xs tracking-widest mb-1">Password</label>
        <input id="admin-password" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className={field} />
      </div>
      {msg && <p role="alert" className="border border-ink p-3">{msg}</p>}
      <button disabled={busy} aria-busy={busy} className="w-full min-h-14 bg-ink text-offwhite uppercase text-sm font-bold tracking-widest disabled:opacity-50">
        {busy ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
