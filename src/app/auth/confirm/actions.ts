"use server";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

/** Verifies the one-time token from the email. Needs nothing stored in the browser, so any browser works. */
export async function confirmSignIn(form: FormData) {
  const token_hash = String(form.get("token_hash") ?? "");
  const db = await supabaseServer();
  const { error } = token_hash
    ? await db.auth.verifyOtp({ type: "email", token_hash })
    : { error: new Error("missing token") };
  if (error) redirect("/sign-in?error_code=link");
  await db.rpc("link_player");
  redirect("/status");
}
