"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

const btn = "w-full min-h-16 border border-ink px-4 py-3 text-left flex flex-col justify-center gap-0.5 disabled:opacity-60";

export function StatusActions({
  playerId, noticeLabel, noticeOpen, soloOpen, soloNote,
}: { playerId: string; noticeLabel: string; noticeOpen: boolean; soloOpen: boolean; soloNote: string }) {
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
    if (up.error) { setBusy(false); return setMsg("Upload failed. Go again."); }
    const { error } = await db.rpc("log_solo", { evidence: path });
    setBusy(false);
    if (error) return setMsg(error.message.includes("already") ? "Already logged today." : "Solo counts on Wednesdays only.");
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <button type="button" disabled={busy || !noticeOpen} onClick={notice} className={btn}>
        <span className="uppercase text-sm font-bold tracking-wide">I&apos;m out this week</span><span className="text-sm">{noticeLabel}</span>
      </button>
      <button type="button" disabled={busy || !soloOpen} onClick={() => fileRef.current?.click()} className={btn}>
        <span className="uppercase text-sm font-bold tracking-wide">Upload solo session</span><span className="text-sm">{soloNote}</span>
      </button>
      <input ref={fileRef} type="file" accept="image/*" className="sr-only" tabIndex={-1}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) solo(f); e.target.value = ""; }} />
      {msg && <p role="alert" className="border border-ink p-3 text-sm">{msg}</p>}
    </div>
  );
}
