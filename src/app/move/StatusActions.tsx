"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

/** The two weekly actions, on the black "This week" block. Two taps maximum for either. */
export function StatusActions({ playerId, noticeNote, noticeOpen, soloNote, soloOpen }: {
  playerId: string; noticeNote: string; noticeOpen: boolean; soloNote: string; soloOpen: boolean;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function notice() {
    setBusy(true); setMsg("");
    const { error } = await supabaseBrowser().rpc("give_notice");
    setBusy(false);
    if (error) return setMsg("Notice window is shut.");
    router.refresh();
  }

  async function solo(file: File) {
    setBusy(true); setMsg("");
    if (file.size > 10 * 1024 * 1024) { setBusy(false); return setMsg("Photo is too large. Max 10 MB."); }
    const db = supabaseBrowser();
    const path = `${playerId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const up = await db.storage.from("evidence").upload(path, file, { contentType: file.type });
    if (up.error) { setBusy(false); return setMsg("Upload did not go through. Go again."); }
    const { error } = await db.rpc("log_solo", { evidence: path });
    setBusy(false);
    if (error) return setMsg(error.message.includes("already") ? "Already logged today." : "Solo counts on Wednesdays only.");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3">
      <button type="button" disabled={busy || !soloOpen} onClick={() => fileRef.current?.click()}
        className="btn border-offwhite bg-offwhite text-ink disabled:opacity-60">{busy ? "Working…" : "Upload solo session"}</button>
      <p className="text-xs opacity-80">{soloNote}</p>
      <button type="button" disabled={busy || !noticeOpen} onClick={notice}
        className="btn border-offwhite text-offwhite disabled:opacity-60">I&apos;m out this week</button>
      <p className="text-xs opacity-80">{noticeNote}</p>
      <input ref={fileRef} type="file" accept="image/*" className="sr-only" tabIndex={-1}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) solo(f); e.target.value = ""; }} />
      {msg && <p role="alert" className="border border-offwhite p-3 text-sm">{msg}</p>}
    </div>
  );
}
