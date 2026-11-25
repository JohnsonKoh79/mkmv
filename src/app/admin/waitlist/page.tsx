import { SubmitButton } from "@/components/SubmitButton";
import { connection } from "next/server";
import { AdminShell, btn } from "@/components/AdminShell";
import { requireFounder } from "@/lib/founder";
import { dismissWaitlist } from "../actions";

async function Content() {
  await connection();
  const { db } = await requireFounder();
  const { data } = await db.from("waitlist").select("id, name, job, reason, referred_by, created_at").order("created_at", { ascending: false });
  if (!data?.length) return <p>Nobody at the door.</p>;
  return (
    <ul className="space-y-2">
      {data.map((w) => (
        <li key={w.id} className="border border-ink p-3 flex justify-between gap-3">
          <span className="text-sm"><b>{w.name}</b>{w.job ? ` · ${w.job}` : ""}<br />Referred by {w.referred_by}{w.reason ? <><br />{w.reason}</> : null}</span>
          <form action={dismissWaitlist.bind(null, w.id)}><SubmitButton className={btn}>Remove</SubmitButton></form>
        </li>
      ))}
    </ul>
  );
}
export default function Waitlist() { return <AdminShell title="Waiting list"><Content /></AdminShell>; }
