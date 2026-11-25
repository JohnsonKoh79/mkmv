// Everything the signed-out site shows. Reads only public views and public tables:
// nickname, photo, level. Never real names, contact, misses, notices, flags or orders.
import { createClient } from "@supabase/supabase-js";
import { klToday } from "@/lib/me";
import { fmtDate } from "@/lib/format";
import { avatarUrl } from "@/lib/photo";
import type { LadderStep } from "@/lib/rules";

export interface PublicPlayer { id: string; nickname: string; photo: string | null; level: number }
export interface PublicProject {
  id: string; name: string; descriptor: string; status: "upcoming" | "ongoing" | "finished";
  seasonId: string | null; sessionsRequired: number; dates: string[]; startDate: string | null;
  ladder: LadderStep[]; players: PublicPlayer[]; // players are in join order. Never sorted by level.
}

const client = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });

export function weekLabel(p: PublicProject, today = klToday()): string {
  if (!p.dates.length) return "";
  if (today < p.dates[0]) return `Starts ${fmtDate(p.dates[0])}`;
  const n = Math.min(p.dates.filter((d) => d <= today).length, p.dates.length);
  return `Week ${n} of ${p.dates.length}`;
}

export async function getPublic(): Promise<PublicProject[]> {
  const db = client();
  const [projects, seasons, dates, steps, roster, people, levels] = await Promise.all([
    db.from("project").select("id, name, descriptor, status"),
    db.from("season").select("id, project_id, start_date, sessions_required").order("start_date", { ascending: false }),
    db.from("session_date").select("season_id, date").order("date"),
    db.from("ladder_step").select("season_id, level_required, ink, release, is_free, product:product_id(name)").order("level_required"),
    db.from("public_roster").select("player_id, season_id, joined_at").order("joined_at").order("player_id"),
    db.from("public_player").select("id, nickname, photo_url"),
    db.from("public_level").select("player_id, season_id, level"),
  ]);
  const person = new Map((people.data ?? []).map((p) => [p.id as string, p]));
  const lvl = new Map((levels.data ?? []).map((l) => [`${l.player_id}:${l.season_id}`, Number(l.level)]));

  return (projects.data ?? []).map((p) => {
    const season = (seasons.data ?? []).find((s) => s.project_id === p.id) ?? null;
    const sid = season?.id as string | undefined;
    return {
      id: p.id, name: p.name, descriptor: p.descriptor, status: p.status,
      seasonId: sid ?? null,
      sessionsRequired: season?.sessions_required ?? 12,
      startDate: season?.start_date ?? null,
      dates: (dates.data ?? []).filter((d) => d.season_id === sid).map((d) => d.date as string),
      ladder: (steps.data ?? []).filter((s) => s.season_id === sid).map((s) => ({
        level: s.level_required, product: (s.product as unknown as { name: string }).name,
        ink: s.ink, release: s.release, isFree: s.is_free,
      })),
      players: (roster.data ?? []).filter((r) => r.season_id === sid && person.has(r.player_id)).map((r) => {
        const pl = person.get(r.player_id)!;
        return { id: pl.id, nickname: pl.nickname, photo: avatarUrl(pl.photo_url), level: lvl.get(`${r.player_id}:${sid}`) ?? 0 };
      }),
    } as PublicProject;
  });
}
