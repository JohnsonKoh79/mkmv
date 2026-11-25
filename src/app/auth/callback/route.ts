import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  if (code) {
    const db = await supabaseServer();
    const { error } = await db.auth.exchangeCodeForSession(code);
    if (!error) {
      await db.rpc("link_player");
      return NextResponse.redirect(`${origin}/status`);
    }
  }
  return NextResponse.redirect(`${origin}/sign-in`);
}
