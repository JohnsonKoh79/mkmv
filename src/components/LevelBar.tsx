export function LevelBar({ level, total }: { level: number; total: number }) {
  return (
    <div>
      <p className="font-display text-5xl tabular-nums"><span className="slant">LV {level}</span></p>
      <ol className="mt-3 grid gap-1" style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }} aria-label={`Level ${level} of ${total}`}>
        {Array.from({ length: total }, (_, i) => (
          <li key={i} className={`h-3 border border-ink ${i < level ? "bg-ink" : ""}`} />
        ))}
      </ol>
    </div>
  );
}
