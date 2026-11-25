"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";

export async function markUnlockSeen(stepId: string) {
  const db = await supabaseServer();
  const { data: pid } = await db.rpc("my_player_id");
  if (pid) await db.from("unlock_seen").upsert({ player_id: pid, ladder_step_id: stepId });
  revalidatePath("/status");
  redirect("/status");
}

export async function signOut() {
  const db = await supabaseServer();
  await db.auth.signOut();
  redirect("/");
}
