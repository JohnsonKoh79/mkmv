import Link from "next/link";
import { connection } from "next/server";
import { AdminShell } from "@/components/AdminShell";
import { requireFounder } from "@/lib/founder";

async function Content() {
  await connection();
  await requireFounder();
  const links = [
    ["/roll-call", "Roll call", "Who showed up"],
    ["/admin/orders", "Orders", "Paid. Printed. Handed over."],
    ["/admin/flags", "Flags", "Who went quiet. Who went solo."],
    ["/admin/waitlist", "Waiting list", "Who wants in"],
    ["/admin/setup", "Setup", "Prices, products, players"],
  ];
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {links.map(([href, title, note]) => (
        <li key={href}>
          <Link href={href} className="block border border-ink p-4 min-h-24">
            <span className="font-display text-xl block">{title}</span>
            <span className="text-sm">{note}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
export default function AdminHome() { return <AdminShell title="Admin"><Content /></AdminShell>; }
