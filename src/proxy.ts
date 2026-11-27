import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { cookieOptionsFor } from "@/lib/supabase/areas";

/** Keeps the login for this area fresh. Server Components cannot write cookies, so it has to happen here. */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return response;
  const path = request.nextUrl.pathname;
  const area = path === "/admin" || path.startsWith("/admin/") ? "admin" : "member";
  const db = createServerClient(url, key, {
    cookieOptions: cookieOptionsFor(area),
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  await db.auth.getUser();
  return response;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|logo/|kit/|email/).*)"] };
