import { fmtDate } from "@/lib/format";

export const Label = ({ children, note }: { children: React.ReactNode; note?: string }) => (
  <div className="flex items-baseline justify-between gap-3 border-b border-ink pb-2">
    <h2 className="h2 !text-xl">{children}</h2>{note && <p className="lbl">{note}</p>}
  </div>
);

/** Earned = solid. Not yet earned = empty and dashed. */
export function Achievements({ items }: { items: { name: string; got: boolean }[] }) {
  return (
    <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
      {items.map((a) => (
        <li key={a.name} className={`flex min-h-20 flex-col justify-between border p-3 ${a.got ? "border-ink bg-ink text-offwhite" : "border-dashed border-ink"}`}>
          <span className="font-display text-base leading-tight">{a.name}</span>
          <span className="lbl !text-[10px]">{a.got ? "Earned" : "Not yet"}</span>
        </li>
      ))}
    </ul>
  );
}

export function RecordList({ lines }: { lines: { key: string; week: number; date: string; type: string; notes: string[] }[] }) {
  if (!lines.length) return <p className="mt-3">The first session starts the record.</p>;
  return (
    <ul>
      {lines.map((l) => (
        <li key={l.key} className="border-b border-ink/40 py-3">
          <p className="font-bold uppercase text-sm tracking-wide">Wk {l.week} · {fmtDate(l.date).replace(/ \d{4}$/, "")} · {l.type === "solo" ? "Solo" : "Group"}</p>
          {l.notes.length > 0 && <p className="text-[13px]">{l.notes.join(" · ")}</p>}
        </li>
      ))}
    </ul>
  );
}
