"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireFounder } from "@/lib/founder";

const txt = (f: FormData, k: string, max = 500) => String(f.get(k) ?? "").trim().slice(0, max);
const NEXT: Record<string, string> = { preordered: "paid", paid: "sent_to_printer", sent_to_printer: "handed_over" };

export async function advanceOrder(id: string, from: string) {
  const { db } = await requireFounder();
  const to = NEXT[from];
  if (to) await db.from("order").update({ status: to }).eq("id", id).eq("status", from);
  revalidatePath("/admin/orders");
}

export async function savePayment(form: FormData) {
  const { db } = await requireFounder();
  await db.from("setting").upsert({ key: "payment_instructions", value: txt(form, "value", 1000) });
  revalidatePath("/admin/setup");
}

export async function saveProduct(id: string, form: FormData) {
  const { db } = await requireFounder();
  const sizes = txt(form, "sizes", 100).split(",").map((s) => s.trim()).filter(Boolean);
  const name = txt(form, "name", 60);
  if (name && sizes.length) await db.from("product").update({ name, sizes }).eq("id", id);
  revalidatePath("/admin/setup");
}

export async function savePrice(id: string, form: FormData) {
  const { db } = await requireFounder();
  const raw = txt(form, "price", 12);
  const price = raw === "" ? null : Number(raw);
  if (price === null || (Number.isFinite(price) && price >= 0)) await db.from("ladder_step").update({ price }).eq("id", id);
  revalidatePath("/admin/setup");
}

export async function addPlayer(form: FormData): Promise<void> {
  const { db } = await requireFounder();
  const real_name = txt(form, "real_name", 120);
  const contact = txt(form, "contact", 200).toLowerCase();
  const nickname = txt(form, "nickname", 40) || null;
  const referrer = txt(form, "referrer", 60) || null;
  if (!real_name || !contact) return;

  const { data: group } = await db.from("group").select("id, seat_limit").limit(1).maybeSingle();
  if (!group) return;
  const { count } = await db.from("enrolment").select("*", { count: "exact", head: true }).eq("group_id", group.id);
  if ((count ?? 0) >= group.seat_limit) return; // group is full

  // Someone who already signed up has an account with this email: give that account the seat.
  const { data: existing } = await db.from("player").select("id, real_name, nickname")
    .ilike("contact", contact.replace(/[\\%_]/g, "\\$&")).maybeSingle();
  let playerId = existing?.id as string | undefined;
  if (existing) {
    await db.from("player").update({ real_name: existing.real_name ?? real_name, nickname: existing.nickname ?? nickname }).eq("id", existing.id);
  } else {
    const { data: p } = await db.from("player").insert({ real_name, contact, nickname }).select("id").single();
    playerId = p?.id;
  }
  if (playerId) await db.from("enrolment").upsert({ player_id: playerId, group_id: group.id, referrer_id: referrer }, { onConflict: "player_id,group_id", ignoreDuplicates: true });
  revalidatePath("/admin/setup");
}

export async function adminSignOut() {
  const { db } = await requireFounder();
  await db.auth.signOut({ scope: "local" });
  redirect("/admin/sign-in");
}

export async function approveRequest(id: string, form: FormData) {
  const { db } = await requireFounder();
  const { error } = await db.rpc("approve_request", { p_request: id, p_referrer: txt(form, "referrer", 60) || null });
  if (error) redirect(`/admin/requests?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/admin/requests");
  redirect("/admin/requests");
}

export async function decideRequest(id: string, decision: "waitlist_next_batch" | "waitlist_next_project" | "removed") {
  const { db } = await requireFounder();
  const { error } = await db.rpc("decide_request", { p_request: id, p_decision: decision });
  if (error) redirect(`/admin/requests?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/admin/requests");
}

export async function openCheckin(id: string) {
  const { db } = await requireFounder();
  await db.rpc("open_checkin", { p_date: id });
  revalidatePath(`/admin/checkin/${id}`);
}

export async function closeCheckin(id: string) {
  const { db } = await requireFounder();
  await db.rpc("close_checkin", { p_date: id });
  revalidatePath(`/admin/checkin/${id}`);
}

export async function saveWindow(form: FormData) {
  const { db } = await requireFounder();
  const open = txt(form, "window_open", 5), close = txt(form, "window_close", 5);
  const ok = (v: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(v);
  if (ok(open) && ok(close) && open < close) {
    await db.from("setting").upsert([{ key: "window_open", value: open }, { key: "window_close", value: close }]);
  }
  revalidatePath("/admin/setup");
}
