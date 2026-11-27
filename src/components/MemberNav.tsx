"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const ITEMS = [
  ["/", "Projects"],
  ["/move", "My Move"],
  ["/me", "Me"],
] as const;

/** Signed-in tabs. Not shown in admin or on focus screens. */
export function MemberNav() {
  const path = usePathname();
  const [typing, setTyping] = useState(false);

  // iOS leaves a fixed bar floating mid-screen after the keyboard closes. Hide it while typing,
  // then nudge the page so it settles back at the bottom.
  useEffect(() => {
    const isText = (t: EventTarget | null) =>
      t instanceof HTMLTextAreaElement || (t instanceof HTMLInputElement && !["checkbox", "radio", "range", "file", "button", "submit"].includes(t.type));
    const focus = (e: FocusEvent) => { if (isText(e.target)) setTyping(true); };
    const blur = (e: FocusEvent) => {
      if (!isText(e.target)) return;
      setTyping(false);
      setTimeout(() => window.scrollTo(window.scrollX, window.scrollY), 120);
    };
    document.addEventListener("focusin", focus);
    document.addEventListener("focusout", blur);
    return () => { document.removeEventListener("focusin", focus); document.removeEventListener("focusout", blur); };
  }, []);
  if (path.startsWith("/admin") || path.startsWith("/unlock") || path.startsWith("/sign-in") || path.startsWith("/auth")) return null;
  return (
    <>
      <div className="h-14" aria-hidden />
      <nav aria-label="Main" hidden={typing} className="fixed inset-x-0 bottom-0 z-20 border-t border-ink bg-offwhite pb-[env(safe-area-inset-bottom)]">
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
    </>
  );
}
