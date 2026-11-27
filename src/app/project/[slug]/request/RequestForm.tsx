"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

const input = "box-border w-full min-h-12 border border-ink bg-offwhite px-3 text-base";

const friendly = (m: string) =>
  m.includes("under 18") ? "You must be 18 or over."
  : m.includes("missing details") ? "Fill in every required field."
  : m.includes("ticks required") ? "Tick both boxes."
  : m.includes("closed") ? "Requests are closed for this batch, or it is full."
  : m.includes("already requested") ? "Your request is already in."
  : m.includes("already in") ? "You already have a seat."
  : "That did not send. Go again.";

function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3.5">
      <div className="flex items-baseline justify-between gap-3"><h2 className="h2">{title}</h2>{note && <p className="lbl">{note}</p>}</div>
      {children}
    </section>
  );
}
function Field({ id, label, ...props }: { id: string; label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="lbl">{label}</label>
      <input id={id} name={id} className={input} {...props} />
    </div>
  );
}
// OPEN with the owner: wording not yet supplied.
const Placeholder = ({ what }: { what: string }) => <p className="border border-dashed border-ink p-3 text-[13px]">[{what}: wording to come]</p>;

export function RequestForm({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (lock.current) return;
    lock.current = true; setBusy(true); setMsg("");
    const f = new FormData(e.currentTarget);
    const v = (k: string) => String(f.get(k) ?? "").trim();
    const { error } = await supabaseBrowser().rpc("submit_request", {
      p_project: projectId, p_full_name: v("full_name"), p_phone: v("phone"), p_dob: v("dob") || null, p_health: v("health"),
      p_emergency_name: v("emergency_name"), p_emergency_phone: v("emergency_phone"), p_reason: v("reason"),
      p_referrer_name: v("referrer_name"), p_referrer_phone: v("referrer_phone"),
      p_commit: f.get("commit") === "on", p_consent: f.get("consent") === "on", p_gender: v("gender") || null,
    });
    if (error) { lock.current = false; setBusy(false); return setMsg(friendly(error.message)); }
    router.push("/me");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-7">
      <Section title="About you" note="Founders only">
        <Field id="full_name" label="Full name" required autoComplete="name" maxLength={120} />
        <Field id="phone" label="Phone number" type="tel" required autoComplete="tel" />
        <Field id="dob" label="Date of birth" type="date" required autoComplete="bday" />
        <fieldset>
          <legend className="lbl mb-1.5">Gender</legend>
          <div className="grid grid-cols-2 gap-2">
            {([["m", "Male"], ["f", "Female"]] as const).map(([value, text]) => (
              <label key={value} className="flex min-h-12 cursor-pointer items-center justify-center border border-ink text-sm font-bold uppercase tracking-widest has-[:checked]:bg-ink has-[:checked]:text-offwhite">
                <input type="radio" name="gender" value={value} required className="sr-only" />{text}
              </label>
            ))}
          </div>
          <p className="mt-1.5 text-[13px]">Sets the cut of your singlet and shorts.</p>
        </fieldset>
        <p className="text-[13px]">You must be 18 or over. Only the founders see these. Everyone else sees your nickname.</p>
      </Section>
      <Section title="Why you want in">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="reason" className="lbl">In your own words</label>
          <textarea id="reason" name="reason" rows={4} maxLength={2000} className={`${input} py-3`} />
        </div>
      </Section>
      <Section title="Your health" note="Founders only">
        <p className="text-[13px]">We run at 5am, then use a sauna and a cold plunge. Tell us anything we should know.</p>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="health" className="lbl">Health conditions or injuries</label>
          <textarea id="health" name="health" rows={3} maxLength={2000} placeholder="None, or tell us" className={`${input} py-3`} />
        </div>
        <Field id="emergency_name" label="Emergency contact name" required />
        <Field id="emergency_phone" label="Emergency contact phone" type="tel" required />
      </Section>
      <Section title="Who referred you" note="Required">
        <Field id="referrer_name" label="Member's name" required />
        <Field id="referrer_phone" label="Member's phone number" type="tel" required />
      </Section>
      <div className="flex flex-col gap-3">
        <Placeholder what="Participation acknowledgement" />
        <label className="flex min-h-11 items-start gap-3">
          <input type="checkbox" name="commit" required className="mt-0.5 h-6 w-6 shrink-0 accent-black" />
          <span>I can make 12 of these Wednesdays at 5am.</span>
        </label>
        <Placeholder what="Privacy notice" />
        <label className="flex min-h-11 items-start gap-3">
          <input type="checkbox" name="consent" required className="mt-0.5 h-6 w-6 shrink-0 accent-black" />
          <span>MKMV may keep my details to run this project.</span>
        </label>
        {msg && <p role="alert" className="border border-ink p-3">{msg}</p>}
        <button disabled={busy} aria-busy={busy} className="btn border-ink bg-ink text-offwhite disabled:opacity-50">{busy ? "Sending…" : "Send request"}</button>
        <p className="text-[13px]">A founder reads every request. You will see the answer under Me.</p>
      </div>
    </form>
  );
}
