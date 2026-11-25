"use client";
import { useActionState } from "react";
import { joinWaitlist, type JoinState } from "./actions";

const field = "w-full min-h-11 border border-ink bg-offwhite px-3 py-2 text-base";
const label = "block uppercase text-xs tracking-widest mb-1";

export function JoinForm() {
  const [state, action, pending] = useActionState<JoinState, FormData>(joinWaitlist, { ok: false, message: "" });
  if (state.ok) return <p className="mt-6 text-lg" role="status">{state.message}</p>;
  return (
    <form action={action} className="mt-6 space-y-5">
      <div><label className={label} htmlFor="name">Name</label><input id="name" name="name" required autoComplete="name" className={field} /></div>
      <div><label className={label} htmlFor="job">Job</label><input id="job" name="job" className={field} /></div>
      <div><label className={label} htmlFor="reason">Why you want in</label><textarea id="reason" name="reason" rows={3} className={field} /></div>
      <div><label className={label} htmlFor="referred_by">Who referred you</label><input id="referred_by" name="referred_by" required className={field} /></div>
      {state.message && <p role="alert" className="border border-ink p-3">{state.message}</p>}
      <button disabled={pending} className="min-h-11 px-6 bg-ink text-offwhite uppercase text-sm font-bold tracking-wide disabled:opacity-40">
        {pending ? "Sending" : "Send it"}
      </button>
    </form>
  );
}
