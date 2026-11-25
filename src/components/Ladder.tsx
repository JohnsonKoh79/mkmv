import Image from "next/image";
import type { LadderStep } from "@/lib/rules";

/** Kit artwork in public/kit. Singlet and shorts default to the men's cut; the women's cut is the same name ending in -w. */
const KIT: Record<string, string> = { socks: "socks", singlet: "singlet", shorts: "shorts", pants: "shorts" };
const CUT: Record<string, string> = { socks: "", singlet: "-m", shorts: "-m" };
function kitImage(product: string, ink: string): string | null {
  const piece = KIT[product.trim().toLowerCase()];
  if (!piece) return null;
  return `/kit/${piece}-${ink === "oxblood" ? "reserved" : "core"}${CUT[piece]}.png`;
}

/** Six pieces. Locked = solid silhouette. Held = dimmed. Every piece sits on off-white, so oxblood never meets black. */
export function Ladder({ steps, level, compact = false }: { steps: LadderStep[]; level?: number; compact?: boolean }) {
  if (compact) {
    // One short row per piece: easy to scan on a phone.
    return (
      <ul className="border-t border-ink">
        {steps.map((s) => {
          const unlocked = level !== undefined && level >= s.level;
          return (
            <li key={`${s.level}-${s.product}-${s.ink}`} className="flex items-center gap-3 min-h-12 border-b border-ink/40">
              <span className={`h-4 w-4 shrink-0 border border-ink ${unlocked ? (s.ink === "oxblood" ? "bg-oxblood border-oxblood" : "bg-ink") : "border-dashed"}`} aria-hidden />
              <span className="flex-1 py-2">
                <span className="block font-bold uppercase text-sm">{s.product} <span className="font-normal tracking-wide">· {s.ink}</span></span>
                {unlocked && s.ink === "oxblood" && !s.isFree && <span className="block text-xs">Available when you finish</span>}
              </span>
              <span className="uppercase text-xs tracking-widest tabular-nums">{unlocked ? "Unlocked" : `LV ${s.level}`}</span>
            </li>
          );
        })}
      </ul>
    );
  }
  const top = Math.max(...steps.map((s) => s.level));
  const finisher = level !== undefined && level >= top;
  return (
    <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {steps.map((s) => {
        const reached = level !== undefined && level >= s.level;
        // No level = the public catalogue: show every piece in full.
        const state =
          level === undefined ? "show" : !reached ? "locked" : s.release === "on_finish" && !finisher ? "held" : "unlocked";
        const src = kitImage(s.product, s.ink);
        const reserved = s.ink === "oxblood";
        const toGo = level === undefined ? 0 : s.level - level;
        const note =
          state === "locked"
            ? `${toGo} ${toGo === 1 ? "session" : "sessions"} to go`
            : state === "held"
              ? "Yours when you finish"
              : state === "unlocked"
                ? "Unlocked"
                : reserved
                  ? "Finishers only"
                  : "";
        return (
          <li
            key={`${s.level}-${s.product}-${s.ink}`}
            className={`relative flex flex-col bg-offwhite border ${state === "locked" ? "border-dashed border-ink" : reserved ? "border-oxblood" : "border-ink"}`}
          >
            <span className={`absolute left-2 top-2 z-10 uppercase text-xs tracking-widest ${reserved && state !== "locked" ? "text-oxblood" : "text-ink"}`}>
              {state === "locked" ? `Locked · LV ${s.level}` : `LV ${s.level}`}
            </span>
            <div className="aspect-square p-3 pt-7">
              {src ? (
                <Image
                  src={src}
                  alt={state === "locked" ? `Locked piece, level ${s.level}` : `${s.product}, ${reserved ? "reserved" : "core"}`}
                  width={627}
                  height={627}
                  sizes="(min-width: 640px) 33vw, 50vw"
                  className={`h-full w-full object-contain ${state === "locked" ? "brightness-0 opacity-90" : state === "held" ? "opacity-40" : ""}`}
                />
              ) : (
                <span className="flex h-full items-center justify-center font-display text-xl">{state === "locked" ? "?" : s.product}</span>
              )}
            </div>
            <span className={`block border-t px-3 py-2 ${state === "locked" ? "border-dashed border-ink" : reserved ? "border-oxblood text-oxblood" : "border-ink"}`}>
              <span className="block font-display text-base">{s.product}</span>
              <span className="block uppercase text-xs tracking-widest mt-1 min-h-4">{note}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
