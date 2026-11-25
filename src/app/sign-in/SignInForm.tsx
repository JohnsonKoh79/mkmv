"use client";
import { useEffect, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

const WAIT = 60; // seconds before another link can be requested

export function SignInForm({ linkError = false }: { linkError?: boolean }) {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState(() =>
    // Supabase reports a bad or used link in the URL hash.
    linkError || (typeof location !== "undefined" && location.hash.includes("error_code="))
      ? "That link is dead. Send a fresh one and open only the newest email."
      : "",
  );
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(0);
  const lock = useRef(false); // stops a second tap before the screen updates

  useEffect(() => {
    if (!wait) return;
    const t = setTimeout(() => setWait((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  async function send() {
    if (lock.current) return;
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return setMsg("Sign-in opens soon.");
    lock.current = true; setBusy(true); setMsg("");
    const { error } = await supabaseBrowser().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback`, shouldCreateUser: true },
    });
    lock.current = false; setBusy(false);
    if (error) {
      const limited = error.status === 429 || /rate limit|seconds/i.test(error.message);
      return setMsg(limited ? "Slow down. Wait a minute, then try once." : `Link did not send. (${error.message})`);
    }
    setSent(true); setWait(WAIT);
  }

  if (sent) {
    return (
      <div className="mt-6" role="status">
        <div className="wipe bg-ink text-offwhite p-6">
          <p className="uppercase text-xs font-bold tracking-widest">Link sent</p>
          <p className="font-display mt-3 text-4xl leading-none"><span className="slant">Check your email.</span></p>
          <p className="mt-6 border-t border-offwhite pt-4 text-sm break-all">{email}</p>
        </div>
        <ol className="border-x border-b border-ink">
          {["Open the newest email from MKMV.", "Tap Let me in.", "Not there? Look in spam."].map((step, i) => (
            <li key={step} className="flex items-center gap-4 border-b border-ink/40 px-4 py-3 last:border-b-0">
              <span className="font-display text-2xl tabular-nums" aria-hidden>{i + 1}</span>
              <span className="font-bold">{step}</span>
            </li>
          ))}
        </ol>
        {msg && <p role="alert" className="mt-3 border border-ink p-3">{msg}</p>}
        <button type="button" onClick={send} disabled={busy || wait > 0}
          className="mt-4 w-full min-h-12 border border-ink uppercase text-sm font-bold tracking-widest tabular-nums disabled:opacity-60">
          {busy ? "Sending…" : wait > 0 ? `Send again in ${wait}s` : "Send again"}
        </button>
        <button type="button" onClick={() => { setSent(false); setMsg(""); }}
          className="mt-1 w-full min-h-12 underline uppercase text-xs font-bold tracking-widest">
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); send(); }} className="mt-6 space-y-4">
      <label className="block uppercase text-xs tracking-widest" htmlFor="email">Email</label>
      <input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)}
        className="w-full min-h-14 border border-ink bg-offwhite px-4 text-lg" />
      {msg && <p role="alert" className="border border-ink p-3">{msg}</p>}
      <button disabled={busy} aria-busy={busy} className="w-full min-h-14 bg-ink text-offwhite uppercase text-sm font-bold tracking-widest disabled:opacity-50">
        {busy ? "Sending…" : "Send link"}
      </button>
      <p className="text-sm">No password. We email you a link.</p>
    </form>
  );
}
