"use client";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

type Mark = "group" | "sauna_only" | "absent";
export interface RollPlayer { id: string; name: string; initial?: Mark }
const OPTIONS: { key: Mark; label: string }[] = [
  { key: "group", label: "Present" },
  { key: "sauna_only", label: "Sauna" },
  { key: "absent", label: "Absent" },
];

export function RollCall({ sessionDateId, players }: { sessionDateId: string; players: RollPlayer[] }) {
  const [marks, setMarks] = useState<Record<string, Mark>>(
    Object.fromEntries(players.filter((p) => p.initial).map((p) => [p.id, p.initial as Mark])),
  );
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function save() {
    setBusy(true); setErr("");
    const { error } = await supabaseBrowser("admin").rpc("save_roll_call", { sd: sessionDateId, marks });
    setBusy(false);
    if (error) return setErr("Could not save. Try again.");
    setSaved(true);
  }
  const allPresent = () => { setSaved(false); setMarks((cur) => ({ ...Object.fromEntries(players.map((p) => [p.id, "group" as Mark])), ...cur })); };
  const done = Object.keys(marks).length;

  const set = (id: string, m: Mark) => {
    setSaved(false);
    setMarks((cur) => ({ ...cur, [id]: m }));
  };

  return (
    <div className="mt-4">
      <button type="button" onClick={allPresent} className="min-h-11 px-4 mb-3 border border-ink uppercase text-xs font-bold tracking-wide">Mark unmarked as present</button>
      <ul className="border-t border-ink">
        {players.map((p) => (
          <li key={p.id} className="flex items-center gap-2 py-2 border-b border-ink/40">
            <span className="w-20 shrink-0 truncate font-bold uppercase text-sm">{p.name}</span>
            <div className="flex flex-1 gap-1" role="group" aria-label={`Mark ${p.name}`}>
              {OPTIONS.map((o) => {
                const on = marks[p.id] === o.key;
                return (
                  <button
                    key={o.key}
                    type="button"
                    aria-pressed={on}
                    onClick={() => set(p.id, o.key)}
                    className={`flex-1 min-h-11 border border-ink text-xs uppercase font-bold tracking-wide ${
                      on ? "bg-ink text-offwhite" : "bg-offwhite text-ink"
                    }`}
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>
          </li>
        ))}
      </ul>
      {err && <p role="alert" className="border border-ink p-3 text-sm">{err}</p>}
      <div className="sticky bottom-0 bg-offwhite border-t border-ink mt-4 py-3 flex items-center justify-between gap-3">
        <span className="uppercase text-sm tracking-wide tabular-nums">{done} of {players.length} marked</span>
        <button
          type="button"
          disabled={done < players.length || busy}
          onClick={save}
          className="min-h-11 px-6 bg-ink text-offwhite uppercase text-sm font-bold tracking-wide disabled:opacity-40"
        >
          {saved ? "Saved" : "Save"}
        </button>
      </div>
    </div>
  );
}
