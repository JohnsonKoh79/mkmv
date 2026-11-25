"use server";
import { supabaseConfigured, supabaseServer } from "@/lib/supabase/server";

export type JoinState = { ok: boolean; message: string };

const clean = (v: FormDataEntryValue | null, max: number) => String(v ?? "").trim().slice(0, max);

export async function joinWaitlist(_: JoinState, form: FormData): Promise<JoinState> {
  const row = {
    name: clean(form.get("name"), 120),
    job: clean(form.get("job"), 120),
    reason: clean(form.get("reason"), 1000),
    referred_by: clean(form.get("referred_by"), 120),
  };
  if (!row.name || !row.referred_by) return { ok: false, message: "Add your name and who referred you." };
  if (!supabaseConfigured()) return { ok: false, message: "Doors are shut for now. Try again soon." };
  const db = await supabaseServer();
  const { error } = await db.from("waitlist").insert(row);
  if (error) return { ok: false, message: "Something went wrong. Try again." };
  return { ok: true, message: "You're on the list. A founder will find you." };
}
