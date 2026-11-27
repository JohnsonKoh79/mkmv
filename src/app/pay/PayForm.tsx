"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { rm } from "@/lib/orders";

export function PayForm({ playerId, orderIds, total }: { playerId: string; orderIds: string[]; total: number }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const lock = useRef(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (lock.current || !file) return;
    if (file.size > 10 * 1024 * 1024) return setMsg("Photo is too large. Max 10 MB.");
    lock.current = true; setBusy(true); setMsg("");
    const db = supabaseBrowser();
    const path = `${playerId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const up = await db.storage.from("proofs").upload(path, file, { contentType: file.type });
    const { error } = up.error ? { error: up.error } : await db.rpc("submit_payment_proof", { p_orders: orderIds, p_path: path });
    lock.current = false; setBusy(false);
    if (error) return setMsg("That did not upload. Go again.");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="mt-6 flex flex-col gap-3">
      <label htmlFor="proof" className="lbl">Upload your payment screenshot</label>
      <input id="proof" type="file" accept="image/*" required onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        className="min-h-14 w-full border border-ink p-3 text-sm file:mr-3 file:min-h-9 file:border file:border-ink file:bg-offwhite file:px-3 file:font-bold file:uppercase" />
      {msg && <p role="alert" className="border border-ink p-3">{msg}</p>}
      <button disabled={busy || !file} className="btn border-ink bg-ink text-offwhite disabled:opacity-50">{busy ? "Uploading…" : `I've paid ${rm(total)}`}</button>
    </form>
  );
}
