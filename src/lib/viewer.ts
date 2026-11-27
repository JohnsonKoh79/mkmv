import { supabaseConfigured, supabaseServer } from "@/lib/supabase/server";

export interface Viewer {
  signedIn: boolean; playerId: string | null; nickname: string | null; cut: "m" | "w"; fixedCut: boolean; isFounder: boolean;
  seats: string[]; // batch (season) ids the person has a seat in
  requests: { id: string; projectId: string | null; status: string; kind: string }[]; // their own open or approved requests
}

const OUT: Viewer = { signedIn: false, playerId: null, nickname: null, cut: "m", fixedCut: false, isFounder: false, seats: [], requests: [] };

/** Who is looking. Only ever reads the viewer's own rows. */
export async function getViewer(): Promise<Viewer> {
  if (!supabaseConfigured()) return OUT;
  const db = await supabaseServer();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return OUT;
  const find = () => db.from("player").select("id, nickname, cut, gender, role").eq("auth_user_id", user.id).maybeSingle();
  let { data: me } = await find();
  if (!me) { await db.rpc("link_player"); ({ data: me } = await find()); }
  if (!me) return { ...OUT, signedIn: true };
  const [{ data: seats }, { data: requests }] = await Promise.all([
    db.from("enrolment").select("group:group_id(season_id)").eq("player_id", me.id),
    db.from("join_request").select("id, project_id, status, kind").eq("player_id", me.id).in("status", ["requested", "waitlisted", "approved"]),
  ]);
  return {
    signedIn: true, playerId: me.id, nickname: me.nickname, cut: me.cut, fixedCut: Boolean(me.gender), isFounder: me.role === "founder",
    seats: (seats ?? []).map((s) => (s.group as unknown as { season_id: string }).season_id),
    requests: (requests ?? []).map((r) => ({ id: r.id, projectId: r.project_id, status: r.status, kind: r.kind })),
  };
}
