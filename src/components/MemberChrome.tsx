import { MemberNav } from "@/components/MemberNav";
import { supabaseConfigured, supabaseServer } from "@/lib/supabase/server";

/** The bottom bar follows a signed-in player on every page. */
export async function MemberChrome() {
  if (!supabaseConfigured()) return null;
  const db = await supabaseServer();
  const { data: { user } } = await db.auth.getUser();
  return user ? <MemberNav /> : null;
}
