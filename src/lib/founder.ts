import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

/** Every admin page and action starts here. RLS enforces the same rule in the database. */
export async function requireFounder() {
  const db = await supabaseServer();
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect("/sign-in");
  const { data: me } = await db.from("player").select("id, role").eq("auth_user_id", user.id).maybeSingle();
  if (me?.role !== "founder") redirect("/");
  return { db, meId: me.id as string };
}
