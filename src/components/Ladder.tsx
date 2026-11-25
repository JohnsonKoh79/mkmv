import type { LadderStep } from "@/lib/rules";

/** Six pieces. Locked = dashed outline. Oxblood fill appears only on an unlocked oxblood piece, on off-white. */
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
  return (
    <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {steps.map((s) => {
        const unlocked = level !== undefined && level >= s.level;
        const fill = unlocked ? (s.ink === "oxblood" ? "bg-oxblood text-offwhite" : "bg-ink text-offwhite") : "bg-offwhite text-ink";
        return (
          <li key={`${s.level}-${s.product}-${s.ink}`} className={`border border-ink p-3 min-h-28 flex flex-col justify-between ${fill} ${unlocked ? "" : "border-dashed"}`}>
            <span className="uppercase text-xs tracking-widest">LV {s.level}</span>
            <span>
              <span className="block font-display text-xl">{s.product}</span>
              <span className="block uppercase text-xs tracking-widest mt-1">
                {s.ink}{level === undefined ? "" : unlocked ? " · Unlocked" : " · Locked"}
              </span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
