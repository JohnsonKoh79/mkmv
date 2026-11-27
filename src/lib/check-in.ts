import { supabaseBrowser } from "@/lib/supabase/client";

/** Sends a scanned code and turns the answer into one short line. */
export async function sendCheckIn(code: string): Promise<{ ok: boolean; message: string }> {
  const { data, error } = await supabaseBrowser().rpc("check_in", { p_code: code });
  if (!error) return { ok: true, message: data === "already" ? "Already checked in." : "You're checked in." };
  const m = error.message;
  return {
    ok: false,
    message: m.includes("closed") ? "Check-in is closed. Ask a founder."
      : m.includes("outside window") ? "Not open yet. Wednesdays from 4:30am."
      : m.includes("not today") ? "That code is for another day."
      : m.includes("not in batch") || m.includes("no player") ? "You don't have a seat in this batch."
      : "Check-in did not go through. Scan again.",
  };
}

/** The code inside a scanned check-in link, or null for any other QR. */
export function codeFrom(text: string): string | null {
  try {
    const u = new URL(text);
    const code = u.searchParams.get("code");
    return u.pathname === "/checkin" && code && /^[a-f0-9]{32}$/.test(code) ? code : null;
  } catch { return null; }
}
