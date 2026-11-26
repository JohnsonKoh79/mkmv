"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  ["/admin", "Today"],
  ["/admin/roll-call", "Roll call"],
  ["/admin/orders", "Orders"],
  ["/admin/flags", "Flags"],
  ["/admin/requests", "Requests"],
  ["/admin/setup", "Setup"],
] as const;

export function AdminMenu() {
  const path = usePathname();
  return (
    <nav aria-label="Admin" className="border-t border-offwhite/30">
      <ul className="mx-auto grid max-w-3xl grid-cols-3 sm:grid-cols-6">
        {ITEMS.map(([href, label]) => {
          const on = path === href;
          return (
            <li key={href}>
              <Link href={href} aria-current={on ? "page" : undefined}
                className={`flex min-h-11 items-center justify-center whitespace-nowrap uppercase text-xs font-bold tracking-wide ${on ? "bg-offwhite text-ink" : ""}`}>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
