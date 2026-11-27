import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * A single-use sign-in token for one member, so the button in their approval email logs them in.
 *
 * Uses the Supabase SECRET key, which ignores row-level security. It is used for this and nothing else:
 * call only after a founder check and a successful approval, and send the result only to the returned
 * address (the one on the login itself, not the editable contact field).
 * Returns null when the key is missing or anything fails; the email then carries a plain link.
 */
export async function oneTapToken(authUserId: string): Promise<{ email: string; tokenHash: string } | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) return null;
  try {
    const { auth } = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const found = await auth.admin.getUserById(authUserId);
    const email = found.data.user?.email;
    if (!email) return null;
    const { data, error } = await auth.admin.generateLink({ type: "magiclink", email });
    if (error) {
      console.error("one-tap link not made:", error.message);
      return null;
    }
    return { email, tokenHash: data.properties.hashed_token };
  } catch (e) {
    console.error("one-tap link not made:", e);
    return null;
  }
}
