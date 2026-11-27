import { SubmitButton } from "@/components/SubmitButton";
import { connection } from "next/server";
import { AdminShell, H, field, btnDark } from "@/components/AdminShell";
import { requireFounder } from "@/lib/founder";
import { addPlayer, savePayment, savePrice, saveProduct, saveWindow } from "../actions";

const label = "block uppercase text-xs tracking-widest mb-1";

async function Content() {
  await connection();
  const { db } = await requireFounder();
  const [{ data: pay }, { data: products }, { data: steps }, { data: enrol }] = await Promise.all([
    db.from("setting").select("value").eq("key", "payment_instructions").maybeSingle(),
    db.from("product").select("id, name, sizes").order("name"),
    db.from("ladder_step").select("id, level_required, ink, price, product:product_id(name)").order("level_required"),
    db.from("enrolment").select("referrer_id, player:player_id(id, nickname, real_name, contact)").order("joined_at"),
  ]);
  const people = (enrol ?? []).map((e) => ({ ...(e.player as unknown as { id: string; nickname: string | null; real_name: string; contact: string | null }), referrer: e.referrer_id as string | null }));
  const nameOf = new Map(people.map((p) => [p.id, p.nickname ?? p.real_name]));

  const { data: times } = await db.from("setting").select("key, value").in("key", ["window_open", "window_close"]);
  const time = (k: string, d: string) => times?.find((t) => t.key === k)?.value ?? d;

  return (
    <>
      <H>Wednesday window (Malaysia time)</H>
      <form action={saveWindow} className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
        <div><label className={label} htmlFor="window_open">Opens</label><input id="window_open" name="window_open" type="time" required defaultValue={time("window_open", "04:30")} className={field} /></div>
        <div><label className={label} htmlFor="window_close">Closes</label><input id="window_close" name="window_close" type="time" required defaultValue={time("window_close", "23:59")} className={field} /></div>
        <SubmitButton className={btnDark} pendingLabel="Saving…">Save</SubmitButton>
      </form>
      <p className="mt-2 text-sm">Applies to scan check-in and solo upload.</p>

      <H>Payment instructions</H>
      <form action={savePayment} className="space-y-3">
        <textarea name="value" rows={4} defaultValue={pay?.value ?? ""} className={field} aria-label="Payment instructions" />
        <SubmitButton className={btnDark} pendingLabel="Saving…">Save</SubmitButton>
      </form>

      <H>Products and sizes</H>
      <ul className="space-y-3">
        {(products ?? []).map((p) => (
          <li key={p.id}>
            <form action={saveProduct.bind(null, p.id)} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
              <div><label className={label}>Name</label><input name="name" defaultValue={p.name} className={field} /></div>
              <div><label className={label}>Sizes, comma separated</label><input name="sizes" defaultValue={(p.sizes as string[]).join(", ")} className={field} /></div>
              <SubmitButton className={btnDark} pendingLabel="Saving…">Save</SubmitButton>
            </form>
          </li>
        ))}
      </ul>

      <H>Prices (RM). Blank means not on sale yet.</H>
      <ul className="space-y-3">
        {(steps ?? []).map((s) => (
          <li key={s.id}>
            <form action={savePrice.bind(null, s.id)} className="grid grid-cols-[1fr_8rem_auto] gap-2 items-end">
              <span className="text-sm pb-3">LV {s.level_required} · {(s.product as unknown as { name: string }).name} · {s.ink}</span>
              <input name="price" type="number" step="0.01" min="0" inputMode="decimal" defaultValue={s.price ?? ""} aria-label="Price" className={field} />
              <SubmitButton className={btnDark} pendingLabel="Saving…">Save</SubmitButton>
            </form>
          </li>
        ))}
      </ul>

      <H>Add a player</H>
      <form action={addPlayer} className="space-y-3">
        <div><label className={label} htmlFor="real_name">Real name</label><input id="real_name" name="real_name" required className={field} /></div>
        <div><label className={label} htmlFor="contact">Email (they sign in with this)</label><input id="contact" name="contact" type="email" required className={field} /></div>
        <div><label className={label} htmlFor="nickname">Nickname</label><input id="nickname" name="nickname" className={field} /></div>
        <div><label className={label} htmlFor="referrer">Referrer</label>
          <select id="referrer" name="referrer" className={field}><option value="">None</option>
            {people.map((p) => <option key={p.id} value={p.id}>{p.nickname ?? p.real_name}</option>)}</select></div>
        <SubmitButton className={btnDark} pendingLabel="Adding…">Add and enrol</SubmitButton>
      </form>

      <H>Players ({people.length} of 12)</H>
      <ul className="text-sm space-y-1">
        {people.map((p) => (
          <li key={p.id} className="border-b border-ink/30 py-2">{p.nickname ?? "—"} · {p.real_name} · {p.contact}{p.referrer ? ` · referred by ${nameOf.get(p.referrer) ?? "?"}` : ""}</li>
        ))}
      </ul>
    </>
  );
}
export default function Setup() { return <AdminShell title="Setup"><Content /></AdminShell>; }
