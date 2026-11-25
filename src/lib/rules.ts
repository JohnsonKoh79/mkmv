// Pure rules. Everything here is computed from stored facts; nothing is typed in.
export type AttendanceType = "group" | "solo" | "sauna_only" | "absent";
export type Ink = "black" | "oxblood";

export interface Season {
  sessionsRequired: number;
  dates: string[]; // ISO yyyy-mm-dd, Wednesdays, Asia/Kuala_Lumpur
}
export interface LadderStep {
  level: number;
  product: string;
  ink: Ink;
  release: "immediate" | "on_finish";
  isFree: boolean;
}
export interface AttendanceRow {
  date: string;
  type: AttendanceType;
}

export const countsTowardLevel = (t: AttendanceType) => t === "group" || t === "solo";

export function level(rows: AttendanceRow[], season: Season): number {
  const valid = new Set(season.dates);
  const seen = new Set<string>(); // one session per Wednesday
  let n = 0;
  for (const r of rows) {
    if (!valid.has(r.date) || seen.has(r.date)) continue;
    seen.add(r.date);
    if (countsTowardLevel(r.type)) n++;
  }
  return n;
}

/** Wednesdays still available: not yet recorded and today or later (KL date). */
export function wednesdaysRemaining(rows: AttendanceRow[], season: Season, today: string): number {
  const recorded = new Set(rows.map((r) => r.date));
  return season.dates.filter((d) => d >= today && !recorded.has(d)).length;
}

export function canStillFinish(rows: AttendanceRow[], season: Season, today: string): boolean {
  return level(rows, season) + wednesdaysRemaining(rows, season, today) >= season.sessionsRequired;
}

export const isFinisher = (rows: AttendanceRow[], season: Season) =>
  level(rows, season) >= season.sessionsRequired;

export type StepState = "locked" | "unlocked" | "payable" | "free" | "held";

/** Black unlocks are payable now; oxblood is held until finishing. */
export function stepState(step: LadderStep, lvl: number, finisher: boolean): StepState {
  if (lvl < step.level) return "locked";
  if (step.isFree) return finisher ? "free" : "locked";
  if (step.release === "on_finish") return finisher ? "payable" : "held";
  return "payable";
}

/** Notice closes Tuesday 21:00 Malaysia time, the evening before the Wednesday. */
export function noticeDeadline(wednesday: string): Date {
  const d = new Date(`${wednesday}T00:00:00+08:00`);
  return new Date(d.getTime() - 3 * 60 * 60 * 1000); // Tue 21:00 +08:00
}
export const noticeOpen = (wednesday: string, now: Date) => now < noticeDeadline(wednesday);

export function weekNumber(season: Season, today: string): number {
  const passed = season.dates.filter((d) => d <= today).length;
  return Math.min(Math.max(passed, 1), season.dates.length);
}

export function silentMisses(
  rows: (AttendanceRow & { noticeGiven: boolean })[],
): number {
  return rows.filter((r) => r.type === "absent" && !r.noticeGiven).length;
}
