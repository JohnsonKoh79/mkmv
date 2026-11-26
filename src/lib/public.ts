// Everything the signed-out site shows. Reads only public views and public tables.
// Never real names, contact, misses, notices, flags, orders or request details.
import { createClient } from "@supabase/supabase-js";
import { avatarUrl } from "@/lib/photo";
import type { LadderStep } from "@/lib/rules";

export interface PublicPlayer { id: string; nickname: string; photo: string | null; level: number }
export interface Step extends LadderStep { id: string; missionLabel: string; missionTitle: string; hasCut: boolean; price: number | null }
export interface Batch {
  id: string; number: number; startDate: string | null; endDate: string | null; closesAt: string | null;
  seatLimit: number; seatsTaken: number; sessionsRequired: number; dates: string[];
  players: PublicPlayer[]; // join order. Never sorted by level.
  showed: Record<string, number>; finishers: number; ladder: Step[];
}
export interface Project {
  id: string; slug: string; label: string; title: string; descriptor: string;
  status: "upcoming" | "ongoing" | "finished"; batches: Batch[]; ladder: Step[];
}

const client = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });

export async function getPublic(): Promise<Project[]> {
  const db = client();
  const [projects, batches, seasons, dates, steps, roster, people, levels, weeks, finishers] = await Promise.all([
    db.from("project").select("id, slug, label, title, descriptor, status"),
    db.from("public_batch").select("*").order("batch_number"),
    db.from("season").select("id, sessions_required"),
    db.from("session_date").select("season_id, date").order("date"),
    db.from("ladder_step").select("id, season_id, level_required, ink, release, is_free, price, mission_label, mission_title, product:product_id(name, has_cut)").order("level_required"),
    db.from("public_roster").select("player_id, season_id, joined_at").order("joined_at").order("player_id"),
    db.from("public_player").select("id, nickname, photo_url"),
    db.from("public_level").select("player_id, season_id, level"),
    db.from("public_week").select("season_id, date, showed"),
    db.from("public_season_finishers").select("season_id, finishers"),
  ]);
  const person = new Map((people.data ?? []).map((p) => [p.id as string, p]));
  const lvl = new Map((levels.data ?? []).map((l) => [`${l.player_id}:${l.season_id}`, Number(l.level)]));

  const ladderOf = (sid: string): Step[] =>
    (steps.data ?? []).filter((s) => s.season_id === sid).map((s) => {
      const product = s.product as unknown as { name: string; has_cut: boolean };
      return {
        id: s.id, level: s.level_required, product: product.name, hasCut: product.has_cut, ink: s.ink, release: s.release,
        isFree: s.is_free, price: s.price == null ? null : Number(s.price),
        missionLabel: s.mission_label ?? "Mission", missionTitle: s.mission_title ?? `Show up ${s.level_required} times`,
      };
    });

  return (projects.data ?? []).map((p) => {
    const mine: Batch[] = (batches.data ?? []).filter((b) => b.project_id === p.id).map((b) => {
      const sid = b.season_id as string;
      return {
        id: sid, number: b.batch_number, startDate: b.start_date, endDate: b.end_date, closesAt: b.join_closes_at,
        seatLimit: b.seat_limit ?? 12, seatsTaken: b.seats_taken ?? 0,
        sessionsRequired: (seasons.data ?? []).find((s) => s.id === sid)?.sessions_required ?? 12,
        dates: (dates.data ?? []).filter((d) => d.season_id === sid).map((d) => d.date as string),
        players: (roster.data ?? []).filter((r) => r.season_id === sid && person.has(r.player_id)).map((r) => {
          const pl = person.get(r.player_id)!;
          return { id: pl.id, nickname: pl.nickname, photo: avatarUrl(pl.photo_url), level: lvl.get(`${r.player_id}:${sid}`) ?? 0 };
        }),
        showed: Object.fromEntries((weeks.data ?? []).filter((w) => w.season_id === sid).map((w) => [w.date as string, Number(w.showed)])),
        finishers: Number((finishers.data ?? []).find((f) => f.season_id === sid)?.finishers ?? 0),
        ladder: ladderOf(sid),
      };
    });
    return { ...p, batches: mine, ladder: mine.find((b) => b.ladder.length)?.ladder ?? [] } as Project;
  });
}
