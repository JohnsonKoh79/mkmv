"use server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { safeNext } from "@/lib/after-sign-in";
import { getViewer } from "@/lib/viewer";
import { supabaseServer } from "@/lib/supabase/server";

/** Verifies the one-time token from the email. Needs nothing stored in the browser, so any browser works. */
export async function confirmSignIn(form: FormData) {
  const token_hash = String(form.get("token_hash") ?? "");
  const db = await supabaseServer();
  const { error } = token_hash
    ? await db.auth.verifyOtp({ type: "email", token_hash })
    : { error: new Error("missing token") };
  // A used or expired link tapped on a phone that is already signed in: just carry on.
  if (error) redirect((await db.auth.getUser()).data.user ? "/move" : "/sign-in?error_code=link");
  await db.rpc("link_player");
  const store = await cookies();
  const next = safeNext(store.get("mkmv_next")?.value);
  store.delete("mkmv_next");
  // A player lands on My Move; anyone else lands on Projects.
  redirect(next ?? ((await getViewer()).seats.length ? "/move" : "/"));
}
