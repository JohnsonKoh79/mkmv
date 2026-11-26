import { fmtDate } from "@/lib/format";
import type { Batch } from "@/lib/public";

export type BatchState = "undated" | "open" | "closed" | "finished";

export function batchState(b: Batch, today: string, now: Date): BatchState {
  if (!b.startDate) return "undated";
  if (b.endDate && today > b.endDate) return "finished";
  return b.closesAt && now < new Date(b.closesAt) && b.seatsTaken < b.seatLimit ? "open" : "closed";
}

export function weekLine(b: Batch, today: string): string {
  if (!b.dates.length) return "Next";
  if (today < b.dates[0]) return `Starts ${fmtDate(b.dates[0])}`;
  return `Week ${Math.min(b.dates.filter((d) => d <= today).length, b.dates.length)} of ${b.dates.length}`;
}

/** "Tue 15 Dec, 21:00" in Malaysia time. */
export function closesLabel(iso: string): string {
  const d = new Date(iso);
  const day = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Kuala_Lumpur" }).format(d).replace(",", "");
  const time = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Kuala_Lumpur" }).format(d);
  return `${day}, ${time}`;
}
