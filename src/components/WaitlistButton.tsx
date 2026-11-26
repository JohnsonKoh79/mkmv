"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

export function WaitlistButton({ projectId, kind, className }: { projectId: string | null; kind: "waitlist_next_batch" | "waitlist_next_project"; className: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  async function join() {
    setBusy(true); setMsg("");
    const { error } = await supabaseBrowser().rpc("join_waitlist", { p_project: projectId, p_kind: kind });
    if (error) { setBusy(false); return setMsg("That did not save. Go again."); }
    router.refresh();
  }
  return (
    <>
      <button type="button" onClick={join} disabled={busy} className={`btn ${className} disabled:opacity-60`}>{busy ? "Saving…" : "Join the waitlist"}</button>
      {msg && <p role="alert" className="text-xs">{msg}</p>}
    </>
  );
}
