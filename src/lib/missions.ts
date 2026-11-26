// Pure mission states for My Move. No imports, so it can be checked on its own.
export type MissionState = "ordered" | "complete" | "held" | "progress" | "locked";
export interface MissionStep { id: string; level: number; release: "immediate" | "on_finish"; isFree: boolean }

/** Held = reached, but reserved pieces can only be bought by finishers. The first unreached mission is "in progress". */
export function missionState(step: MissionStep, all: MissionStep[], level: number, finisher: boolean, ordered: boolean): MissionState {
  if (ordered) return "ordered";
  if (level >= step.level) return (step.release === "on_finish" || step.isFree) && !finisher ? "held" : "complete";
  const next = [...all].sort((a, b) => a.level - b.level).find((s) => level < s.level);
  return next?.id === step.id && level > 0 ? "progress" : "locked";
}
