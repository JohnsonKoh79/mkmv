import { connection } from "next/server";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { AdminShell, btn, btnDark } from "@/components/AdminShell";
import { SubmitButton } from "@/components/SubmitButton";
import { requireFounder } from "@/lib/founder";
import { klToday } from "@/lib/me";
import { fmtDate } from "@/lib/format";
import { closeCheckin, openCheckin } from "../../actions";
import { AutoRefresh } from "./AutoRefresh";

async function Content({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { db } = await requireFounder();
  const { id } = await params;
  const { data: w } = await db.from("session_date").select("id, date, season_id").eq("id", id).maybeSingle();
  if (!w) notFound();
  const [{ data: c }, { data: att }, { data: times }] = await Promise.all([
    db.from("checkin").select("code, is_open").eq("session_date_id", w.id).maybeSingle(),
    db.from("attendance").select("type, player:player_id(nickname, real_name)").eq("session_date_id", w.id).in("type", ["group", "solo"]),
    db.from("setting").select("value").eq("key", "window_open").maybeSingle(),
  ]);
  const today = klToday();
  const open = Boolean(c?.is_open) && w.date === today;
  let qr = "";
  if (open && c) {
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host") ?? "www.mkmv.club";
    const proto = host.startsWith("localhost") ? "http" : "https";
    qr = await QRCode.toString(`${proto}://${host}/checkin?code=${c.code}`, { type: "svg", margin: 2, color: { dark: "#10100F", light: "#EAE4DE" } });
  }
  const names = (att ?? []).map((a) => {
    const p = a.player as unknown as { nickname: string | null; real_name: string | null };
    return `${p.nickname ?? p.real_name ?? "Player"}${a.type === "solo" ? " (solo)" : ""}`;
  });

  return (
    <>
      <Link href="/admin/checkin" className="flex min-h-11 items-center text-xs font-bold uppercase tracking-widest underline">‹ All weeks</Link>
      <p className="font-display text-3xl"><span className="slant">{fmtDate(w.date)}</span></p>
      {w.date !== today ? (
        <p className="mt-3">{w.date > today ? `The code can be opened on ${fmtDate(w.date)}.` : "This week is over."}</p>
      ) : open ? (
        <>
          <div className="mx-auto mt-4 w-full max-w-sm border border-ink [&>svg]:h-auto [&>svg]:w-full" role="img" aria-label="Check-in QR code" dangerouslySetInnerHTML={{ __html: qr }} />
          <p className="mt-3 text-center font-bold uppercase tracking-wide">Scan to check in. Works from {times?.value ?? "04:30"}.</p>
          <form action={closeCheckin.bind(null, w.id)} className="mt-4"><SubmitButton className={`${btnDark} w-full !min-h-14`} pendingLabel="Closing…">Close check-in</SubmitButton></form>
          <AutoRefresh />
        </>
      ) : (
        <form action={openCheckin.bind(null, w.id)} className="mt-4">
          <SubmitButton className={`${btnDark} w-full !min-h-14`} pendingLabel="Opening…">Open check-in</SubmitButton>
          <p className="mt-2 text-sm">Shows a new QR code. Close it once everyone is in.</p>
        </form>
      )}
      <p className="mt-6 border-b border-ink pb-2 text-xs font-bold uppercase tracking-widest">Checked in ({names.length})</p>
      <ul>{names.map((n) => <li key={n} className="border-b border-ink/30 py-2 font-bold">{n}</li>)}</ul>
      <Link href="/admin/roll-call" className={`${btn} mt-4 inline-flex items-center`}>Roll call</Link>
    </>
  );
}
export default function CheckinWeek({ params }: { params: Promise<{ id: string }> }) {
  return <AdminShell title="Check-in"><Content params={params} /></AdminShell>;
}
