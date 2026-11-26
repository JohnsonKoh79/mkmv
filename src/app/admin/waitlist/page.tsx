import { connection } from "next/server";
import { AdminShell } from "@/components/AdminShell";
import { requireFounder } from "@/lib/founder";
import { fmtDate } from "@/lib/format";

// Read-only until step 5 brings the Requests screen with its decisions.
async function Content() {
  await connection();
  const { db } = await requireFounder();
  const { data } = await db.from("join_request")
    .select("id, kind, created_at, player:player_id(nickname, real_name, contact), project:project_id(title)")
    .eq("status", "waitlisted").order("created_at");
  if (!data?.length) return <p>Nobody at the door.</p>;
  return (
    <ul className="space-y-2">
      {data.map((r) => {
        const who = r.player as unknown as { nickname: string | null; real_name: string | null; contact: string | null };
        const project = r.project as unknown as { title: string } | null;
        return (
          <li key={r.id} className="border border-ink p-3 text-sm">
            <b>{who.nickname ?? who.real_name ?? who.contact}</b>{who.contact ? ` · ${who.contact}` : ""}<br />
            {r.kind === "waitlist_next_batch" ? `Next batch of ${project?.title ?? "the project"}` : "Next project"} · since {fmtDate(String(r.created_at).slice(0, 10))}
          </li>
        );
      })}
    </ul>
  );
}
export default function Waitlist() { return <AdminShell title="Waiting list"><Content /></AdminShell>; }
