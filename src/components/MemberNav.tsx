"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  ["/", "Projects"],
  ["/move", "My Move"],
  ["/me", "Me"],
] as const;

/**
 * Signed-in tabs. Not shown in admin or on focus screens.
 * Deliberately NOT position:fixed: iOS leaves fixed bars floating mid-screen after the keyboard closes.
 * It is the last row of a screen-height column (see layout.tsx).
 */
export function MemberNav() {
  const path = usePathname();
  if (path.startsWith("/admin") || path.startsWith("/unlock") || path.startsWith("/sign-in") || path.startsWith("/auth")) return null;
  return (
    <nav aria-label="Main" className="flex-none border-t border-ink bg-offwhite pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto flex max-w-xl">
        {ITEMS.map(([href, label]) => {
          const on = href === "/" ? path === "/" || path.startsWith("/project") || path.startsWith("/player") : path.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link href={href} aria-current={on ? "page" : undefined}
                className={`flex min-h-14 items-center justify-center text-xs font-bold uppercase tracking-[0.14em] ${on ? "bg-ink text-offwhite" : ""}`}>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
