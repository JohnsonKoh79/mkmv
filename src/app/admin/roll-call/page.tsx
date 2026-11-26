import { connection } from "next/server";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/AdminShell";
import { RollCall, type RollPlayer } from "./RollCall";
import { fmtDate } from "@/lib/format";
import { klToday } from "@/lib/me";
import { supabaseServer } from "@/lib/supabase/server";

async function Content() {
  await connection(); // per-request: depends on who is signed in and the current time
  const db = await supabaseServer();
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect("/admin/sign-in");
  const { data: me } = await db.from("player").select("role").eq("auth_user_id", user.id).maybeSingle();
  if (me?.role !== "founder") redirect("/");

  const { data: group } = await db.from("group").select("id, season:season_id(id, project:project_id(name))").limit(1).maybeSingle();
  if (!group) return <p className="mt-6">No group set up yet.</p>;
  const season = group.season as unknown as { id: string; project: { name: string } };

  const { data: dates } = await db.from("session_date").select("id, date").eq("season_id", season.id).order("date");
  const today = klToday();
  const list = dates ?? [];
  const pick = list.find((d) => d.date === today) ?? [...list].reverse().find((d) => d.date < today) ?? list[0];
  if (!pick) return <p className="mt-6">No session dates yet.</p>;

  const [{ data: enrol }, { data: att }] = await Promise.all([
    db.from("enrolment").select("joined_at, player:player_id(id, nickname, real_name)").eq("group_id", group.id).order("joined_at"),
    db.from("attendance").select("player_id, type").eq("session_date_id", pick.id),
  ]);
  const existing = new Map((att ?? []).map((a) => [a.player_id, a.type]));
  const players: RollPlayer[] = (enrol ?? []).map((e) => {
    const p = e.player as unknown as { id: string; nickname: string | null; real_name: string };
    const t = existing.get(p.id);
    return { id: p.id, name: p.nickname ?? p.real_name, initial: t === "group" || t === "sauna_only" || t === "absent" ? t : undefined };
  });

  return (
    <>
      <h1 className="font-display text-3xl mt-1"><span className="slant">{season.project.name}</span></h1>
      <p className="mt-1 text-sm uppercase tracking-wide">{fmtDate(pick.date)}</p>
      <RollCall sessionDateId={pick.id} players={players} />
    </>
  );
}

export default function RollCallPage() {
  return <AdminShell title="Roll call"><Content /></AdminShell>;
}
