"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  ["/", "Home"],
  ["/status", "Me"],
  ["/inventory", "Inventory"],
  ["/profile", "Profile"],
] as const;

/** Always-visible thumb-height bar. Shown to signed-in players on every page except focus screens. */
export function MemberNav() {
  const path = usePathname();
  if (path.startsWith("/admin") || path.startsWith("/unlock") || path.startsWith("/sign-in") || path.startsWith("/auth")) return null;
  return (
    <>
      <div className="h-16" aria-hidden />
      <nav aria-label="Member" className="fixed inset-x-0 bottom-0 z-20 bg-offwhite border-t border-ink pb-[env(safe-area-inset-bottom)]">
        <ul className="grid grid-cols-4 max-w-xl mx-auto">
          {ITEMS.map(([href, label]) => {
            const on = href === "/" ? path === "/" : path.startsWith(href);
            return (
              <li key={href}>
                <Link href={href} aria-current={on ? "page" : undefined}
                  className={`flex min-h-14 items-center justify-center px-1 text-[11px] sm:text-xs font-bold uppercase tracking-wide ${on ? "bg-ink text-offwhite" : ""}`}>
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
