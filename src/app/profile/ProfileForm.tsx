"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
/* eslint-disable @next/next/no-img-element */
import { supabaseBrowser } from "@/lib/supabase/client";
import { squarePhoto } from "@/lib/photo";

const friendly = (m: string) =>
  m.includes("player_nickname_unique") || m.includes("duplicate") ? "That nickname is taken. Pick another."
  : m.includes("nickname length") ? "Nickname: 2 to 24 characters."
  : m.includes("nickname needed") ? "Pick a nickname before you go public."
  : "Could not save. Go again.";

export function ProfileForm({ playerId, nickname, photo, consent }: { playerId: string; nickname: string; photo: string | null; consent: boolean }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [nick, setNick] = useState(nickname);
  const [ok, setOk] = useState(consent);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(photo);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [saved, setSaved] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg(""); setSaved(false);
    const db = supabaseBrowser();
    let path: string | null = null;
    if (file) {
      try {
        const blob = await squarePhoto(file);
        path = `${playerId}/avatar-${Date.now()}.jpg`;
        const up = await db.storage.from("avatars").upload(path, blob, { contentType: "image/jpeg" });
        if (up.error) throw up.error;
      } catch { setBusy(false); return setMsg("Photo upload failed. Go again."); }
    }
    const { error } = await db.rpc("save_profile", { p_nickname: nick, p_photo: path, p_consent: ok });
    setBusy(false);
    if (error) return setMsg(friendly(error.message));
    setFile(null); setSaved(true); router.refresh();
  }

  return (
    <form onSubmit={save} className="mt-6 space-y-6">
      <div>
        <p className="uppercase text-xs tracking-widest mb-2">Photo</p>
        <button type="button" onClick={() => fileRef.current?.click()} className="block w-full max-w-xs aspect-[4/5] border border-ink overflow-hidden" aria-label="Choose photo">
          {preview ? <img src={preview} alt="Your photo" className="w-full h-full object-cover" /> :
            <span className="flex h-full items-center justify-center uppercase text-sm font-bold tracking-wide">Add photo</span>}
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="sr-only" tabIndex={-1}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) { setFile(f); setPreview(URL.createObjectURL(f)); } }} />
      </div>

      <div>
        <label htmlFor="nick" className="block uppercase text-xs tracking-widest mb-1">Nickname</label>
        <input id="nick" value={nick} onChange={(e) => setNick(e.target.value)} maxLength={24} autoComplete="nickname"
          className="w-full min-h-11 border border-ink bg-offwhite px-3 py-2 text-base" />
      </div>

      <label className="flex items-start gap-3 min-h-11 cursor-pointer">
        <input type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} className="mt-1 h-6 w-6 shrink-0 accent-black" />
        <span>Put my nickname, photo and level on the public site.</span>
      </label>

      {msg && <p role="alert" className="border border-ink p-3 text-sm">{msg}</p>}
      {saved && <p role="status" className="border border-ink p-3 text-sm">{ok ? "Saved. You're on the public site." : "Saved. You're private."}</p>}
      <button disabled={busy} className="min-h-12 px-8 bg-ink text-offwhite uppercase text-sm font-bold tracking-wide disabled:opacity-40">{busy ? "Saving" : "Save"}</button>
    </form>
  );
}
