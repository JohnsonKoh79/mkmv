// Pure rules for achievements and the record. No imports, so they can be checked on their own.
export interface Definition { name: string; scope: "individual" | "group"; rule: string; dates: string[] }
export interface Logged { date: string; type: "group" | "solo" }
export interface BatchFacts { dates: string[]; sessionsRequired: number; showed: Record<string, number>; seatLimit: number; seatsTaken: number; finishers: number }

const oldestFirst = (logged: Logged[]) => [...logged].sort((a, b) => a.date.localeCompare(b.date));

/** Is an achievement met by these logged sessions (individual) or by the batch (group)? */
export function earned(def: Definition, logged: Logged[], batch: BatchFacts): boolean {
  const dates = new Set(logged.map((l) => l.date));
  switch (def.rule) {
    case "first": return logged.length > 0;
    case "solo": return logged.some((l) => l.type === "solo");
    case "dates": return def.dates.some((d) => dates.has(d));
    // All In: the batch's first 12 Wednesdays, every one logged.
    case "all_in": return batch.dates.length >= batch.sessionsRequired && batch.dates.slice(0, batch.sessionsRequired).every((d) => dates.has(d));
    case "finisher": return logged.length >= batch.sessionsRequired;
    case "full_house": return Object.values(batch.showed).some((n) => n >= batch.seatLimit);
    case "group_100": return Object.values(batch.showed).reduce((a, n) => a + n, 0) >= 100;
    case "all_out": return batch.seatsTaken > 0 && batch.finishers >= batch.seatsTaken;
    default: return false;
  }
}

/** Newest first. Each logged session with what it unlocked. Weeks not attended never appear. */
export function recordLines(logged: Logged[], defs: Definition[], ladder: { level: number; product: string; ink: string }[], batch: BatchFacts) {
  const sorted = oldestFirst(logged);
  const mine = defs.filter((d) => d.scope === "individual");
  let had = new Set<string>();
  return sorted.map((l, i) => {
    const soFar = sorted.slice(0, i + 1);
    const now = new Set(mine.filter((d) => earned(d, soFar, batch)).map((d) => d.name));
    const fresh = [...now].filter((n) => !had.has(n));
    had = now;
    const unlocked = ladder.filter((s) => s.level === i + 1).map((s) => `Unlocked ${s.ink === "oxblood" ? "Reserved " : ""}${s.product}`);
    return { date: l.date, week: batch.dates.indexOf(l.date) + 1, type: l.type, notes: [...unlocked, ...fresh] };
  }).reverse();
}
