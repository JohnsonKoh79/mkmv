"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  ["/admin", "Today"],
  ["/admin/checkin", "Check-in"],
  ["/admin/roll-call", "Roll call"],
  ["/admin/orders", "Orders"],
  ["/admin/flags", "Flags"],
  ["/admin/requests", "Requests"],
  ["/admin/setup", "Setup"],
] as const;

export function AdminMenu({ pending = 0 }: { pending?: number }) {
  const path = usePathname();
  return (
    <nav aria-label="Admin" className="border-t border-offwhite/30">
      <ul className="mx-auto grid max-w-3xl grid-cols-4 sm:grid-cols-7">
        {ITEMS.map(([href, label]) => {
          const on = href === "/admin" ? path === href : path.startsWith(href);
          return (
            <li key={href}>
              <Link href={href} aria-current={on ? "page" : undefined}
                className={`flex min-h-11 items-center justify-center whitespace-nowrap uppercase text-xs font-bold tracking-wide ${on ? "bg-offwhite text-ink" : ""}`}>
                {label}
                {href === "/admin/requests" && pending > 0 && (
                  // Red is used only for this admin alert, never on the member site.
                  <span className="ml-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#C8102E] px-1 text-[11px] leading-none tracking-normal text-white tabular-nums">
                    {pending}<span className="sr-only"> pending</span>
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
