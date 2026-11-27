import { createBrowserClient } from "@supabase/ssr";
import { cookieOptionsFor, type Area } from "./areas";

const make = (area: Area) =>
  // isSingleton must be off, or the first client created would be reused for both areas.
  createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookieOptions: cookieOptionsFor(area),
    isSingleton: false,
  });

const cache: Partial<Record<Area, ReturnType<typeof make>>> = {};

export const supabaseBrowser = (area: Area = "member") => (cache[area] ??= make(area));
