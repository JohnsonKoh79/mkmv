import { supabaseConfigured, supabaseServer } from "@/lib/supabase/server";

/** The signed-in player's logged dates, or null when signed out. Only ever their own. */
export async function myLoggedDates(): Promise<Set<string> | null> {
  if (!supabaseConfigured()) return null;
  const db = await supabaseServer();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return null;
  const { data: me } = await db.from("player").select("id").eq("auth_user_id", user.id).maybeSingle();
  if (!me) return new Set();
  const { data } = await db.from("attendance").select("type, session_date:session_date_id(date)").eq("player_id", me.id).in("type", ["group", "solo"]);
  return new Set((data ?? []).map((a) => (a.session_date as unknown as { date: string }).date));
}
