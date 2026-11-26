import { connection } from "next/server";
import { AdminShell, H, btn, btnDark, field } from "@/components/AdminShell";
import { SubmitButton } from "@/components/SubmitButton";
import { requireFounder } from "@/lib/founder";
import { fmtDate } from "@/lib/format";
import { klToday } from "@/lib/me";
import { approveRequest, decideRequest } from "../actions";

const ERRORS: Record<string, string> = {
  full: "That batch is full.", closed: "Joining has closed for that batch.",
  "no details yet": "They only joined a waitlist. They need to send a full request first.",
};
const age = (dob: string, today: string) => Number(today.slice(0, 4)) - Number(dob.slice(0, 4)) - (today.slice(5) < dob.slice(5) ? 1 : 0);

async function Content({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await connection();
  const { db } = await requireFounder();
  const { error } = await searchParams;
  const today = klToday();
  const [{ data }, { data: members }] = await Promise.all([
    db.from("join_request")
      .select("id, kind, status, created_at, player:player_id(nickname, real_name, contact), project:project_id(title), details:request_private(*)")
      .in("status", ["requested", "waitlisted"]).order("created_at"),
    db.from("enrolment").select("player:player_id(id, nickname, real_name)").order("joined_at"),
  ]);
  const people = (members ?? []).map((m) => m.player as unknown as { id: string; nickname: string | null; real_name: string | null });
  const rows = (data ?? []).map((r) => ({
    id: r.id as string, status: r.status as string, kind: r.kind as string, since: String(r.created_at).slice(0, 10),
    who: r.player as unknown as { nickname: string | null; real_name: string | null; contact: string | null },
    project: (r.project as unknown as { title: string } | null)?.title ?? "Next project",
    d: (Array.isArray(r.details) ? r.details[0] : r.details) as Record<string, string | null> | null | undefined,
  }));

  const card = (r: (typeof rows)[number]) => (
    <li key={r.id} className="border border-ink p-3 text-sm">
      <p className="font-bold">{r.d?.full_name ?? r.who.real_name ?? r.who.nickname ?? r.who.contact}</p>
      <p>{r.who.contact} · {r.project} · since {fmtDate(r.since)}</p>
      {r.d && (
        <dl className="mt-2 grid grid-cols-[8rem_1fr] gap-x-2 gap-y-1">
          <dt>Phone</dt><dd>{r.d.phone}</dd>
          <dt>Age</dt><dd>{age(String(r.d.date_of_birth), today)} (born {fmtDate(String(r.d.date_of_birth))})</dd>
          <dt>Health</dt><dd className="whitespace-pre-line">{r.d.health_notes ?? "Nothing noted"}</dd>
          <dt>Emergency</dt><dd>{r.d.emergency_name} · {r.d.emergency_phone}</dd>
          <dt>Why</dt><dd className="whitespace-pre-line">{r.d.reason ?? "Not said"}</dd>
          <dt>Referrer</dt><dd>{r.d.referrer_name} · {r.d.referrer_phone}</dd>
        </dl>
      )}
      <div className="mt-3 flex flex-wrap items-end gap-2">
        {r.d && (
          <form action={approveRequest.bind(null, r.id)} className="flex w-full flex-wrap items-end gap-2">
            <label className="flex-1 text-xs font-bold uppercase tracking-wide">Link referrer
              <select name="referrer" className={field}><option value="">Match by phone</option>
                {people.map((p) => <option key={p.id} value={p.id}>{p.nickname ?? p.real_name}</option>)}</select>
            </label>
            <SubmitButton className={btnDark} pendingLabel="Approving…">Approve</SubmitButton>
          </form>
        )}
        <form action={decideRequest.bind(null, r.id, "waitlist_next_batch")}><SubmitButton className={btn}>Waitlist: next batch</SubmitButton></form>
        <form action={decideRequest.bind(null, r.id, "waitlist_next_project")}><SubmitButton className={btn}>Waitlist: next project</SubmitButton></form>
        <form action={decideRequest.bind(null, r.id, "removed")}><SubmitButton className={btn}>Remove spam</SubmitButton></form>
      </div>
    </li>
  );

  const pending = rows.filter((r) => r.status === "requested");
  const nextBatch = rows.filter((r) => r.status === "waitlisted" && r.kind === "waitlist_next_batch");
  const nextProject = rows.filter((r) => r.status === "waitlisted" && r.kind !== "waitlist_next_batch");
  return (
    <>
      {error && <p role="alert" className="border border-ink p-3">{ERRORS[error] ?? "That did not save. Go again."}</p>}
      <H>Pending ({pending.length})</H>
      {pending.length ? <ul className="space-y-2">{pending.map(card)}</ul> : <p>Nobody at the door.</p>}
      <H>Waitlist: next batch ({nextBatch.length})</H>
      <ul className="space-y-2">{nextBatch.map(card)}</ul>
      <H>Waitlist: next project ({nextProject.length})</H>
      <ul className="space-y-2">{nextProject.map(card)}</ul>
    </>
  );
}

export default function Requests({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  return <AdminShell title="Requests"><Content searchParams={searchParams} /></AdminShell>;
}
