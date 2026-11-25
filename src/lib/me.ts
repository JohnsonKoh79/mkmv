import { supabaseServer } from "@/lib/supabase/server";
import { level } from "@/lib/rules";
import type { AttendanceRow, AttendanceType, Ink, LadderStep, Season } from "@/lib/rules";

export const klToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kuala_Lumpur" }).format(new Date());

export interface MyContext {
  playerId: string;
  isFounder: boolean;
  nickname: string | null;
  projectName: string;
  descriptor: string;
  season: Season;
  noticeDeadlines: Record<string, string>;
  rows: (AttendanceRow & { noticeGiven: boolean })[];
  ladder: (LadderStep & { id: string })[];
  unseen: string[]; // ladder step ids
}

export type MeResult =
  | { kind: "signed-out" }
  | { kind: "no-player" }
  | { kind: "not-enrolled" }
  | { kind: "ok"; ctx: MyContext };

export async function getMe(): Promise<MeResult> {
  const db = await supabaseServer();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return { kind: "signed-out" };

  const findPlayer = () => db.from("player").select("id, nickname, role").eq("auth_user_id", user.id).maybeSingle();
  let { data: player } = await findPlayer();
  if (!player) {
    await db.rpc("link_player");
    ({ data: player } = await findPlayer());
  }
  if (!player) return { kind: "no-player" };

  const { data: enrol } = await db.from("enrolment").select("group:group_id(season_id)").eq("player_id", player.id).limit(1).maybeSingle();
  const seasonId = (enrol?.group as unknown as { season_id: string } | null)?.season_id;
  if (!seasonId) return { kind: "not-enrolled" };

  const [{ data: season }, { data: dates }, { data: att }, { data: steps }, { data: seen }] = await Promise.all([
    db.from("season").select("sessions_required, project:project_id(name, descriptor)").eq("id", seasonId).single(),
    db.from("session_date").select("date, notice_deadline").eq("season_id", seasonId).order("date"),
    db.from("attendance").select("type, notice_given, session_date:session_date_id(date)").eq("player_id", player.id),
    db.from("ladder_step").select("id, level_required, ink, release, is_free, product:product_id(name)").eq("season_id", seasonId).order("level_required"),
    db.from("unlock_seen").select("ladder_step_id").eq("player_id", player.id),
  ]);
  if (!season || !dates || !steps) return { kind: "not-enrolled" };

  const project = season.project as unknown as { name: string; descriptor: string };
  const rows = (att ?? []).map((a) => ({
    date: (a.session_date as unknown as { date: string }).date,
    type: a.type as AttendanceType,
    noticeGiven: a.notice_given,
  }));
  const ladder = steps.map((s) => ({
    id: s.id as string,
    level: s.level_required as number,
    product: (s.product as unknown as { name: string }).name,
    ink: s.ink as Ink,
    release: s.release as LadderStep["release"],
    isFree: s.is_free as boolean,
  }));
  const seenIds = new Set((seen ?? []).map((s) => s.ladder_step_id));

  const ctx: MyContext = {
    playerId: player.id,
    isFounder: player.role === "founder",
    nickname: player.nickname,
    projectName: project.name,
    descriptor: project.descriptor,
    season: { sessionsRequired: season.sessions_required, dates: dates.map((d) => d.date) },
    noticeDeadlines: Object.fromEntries(dates.map((d) => [d.date, d.notice_deadline])),
    rows,
    ladder,
    unseen: [],
  };
  const lvl = level(rows, ctx.season);
  ctx.unseen = ladder.filter((s) => lvl >= s.level && !seenIds.has(s.id)).map((s) => s.id);
  return { kind: "ok", ctx };
}
