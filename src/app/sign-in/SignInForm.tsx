"use client";
import { useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

export function SignInForm() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState(() =>
    // Supabase reports a bad or used link in the URL hash.
    typeof location !== "undefined" && location.hash.includes("error_code=")
      ? "That link is dead. Send a fresh one and open only the newest email."
      : "",
  );
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false); // stops a second tap before the screen updates


  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (lock.current) return;
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return setMsg("Sign-in opens soon.");
    lock.current = true; setBusy(true); setMsg("");
    const { error } = await supabaseBrowser().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback`, shouldCreateUser: true },
    });
    setBusy(false);
    if (error) {
      lock.current = false;
      const limited = error.status === 429 || /rate limit|seconds/i.test(error.message);
      return setMsg(limited ? "Slow down. Too many emails. Wait an hour, then try once." : `Link did not send. (${error.message})`);
    }
    setSent(true);
  }

  return (
    <>
        {sent ? (
          <p className="mt-6 text-lg" role="status">Link sent. Check your email.</p>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block uppercase text-xs tracking-widest" htmlFor="email">Email</label>
            <input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full min-h-11 border border-ink bg-offwhite px-3 py-2 text-base" />
            {msg && <p role="alert" className="border border-ink p-3">{msg}</p>}
            <button disabled={busy} aria-busy={busy} className="min-h-12 px-6 bg-ink text-offwhite uppercase text-sm font-bold tracking-wide disabled:opacity-50">{busy ? "Sending…" : "Send link"}</button>
          </form>
        )}
    </>
  );
}
