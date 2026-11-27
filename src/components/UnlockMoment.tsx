import Image from "next/image";
/**
 * The full-screen unlock. The garment is revealed from its silhouette with words laid over it.
 * Every kit image sits on off-white, and oxblood never meets black.
 */
export function UnlockMoment({ level, product, reserved, image, note, children }: {
  level: number; product: string; reserved: boolean; image: string; note: string; children: React.ReactNode;
}) {
  const screen = reserved ? "bg-offwhite text-oxblood" : "bg-ink text-offwhite";
  const band = reserved ? "bg-oxblood text-offwhite" : "bg-ink text-offwhite";
  const word = "font-display block whitespace-nowrap text-center text-[min(12.5vw,64px)] leading-[0.95]";
  return (
    <main className={`flex min-h-dvh flex-col justify-between gap-4 p-4 ${screen}`}>
      <div className="mx-auto flex w-full max-w-md items-baseline justify-between">
        <p className="lbl">System · LV {level}</p>
        <p className="lbl">{reserved ? "Reserved" : "Core black"}</p>
      </div>

      <div className="mx-auto w-full max-w-md">
        <div className={`wipe relative aspect-[4/5] w-full overflow-hidden border bg-offwhite ${reserved ? "border-oxblood text-oxblood [--stroke:var(--oxblood)]" : "border-offwhite text-ink"}`}>
          <div aria-hidden className="absolute inset-0 flex flex-col justify-between py-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <span key={i} className={`${word} ${i === 0 ? "" : "outline-word"}`}><span className="slant">Unlocked</span></span>
            ))}
          </div>
          <Image src={image} alt={`${product}, unlocked`} width={627} height={627} priority sizes="(min-width: 448px) 448px, 100vw"
            className="reveal absolute inset-x-0 top-1/2 mx-auto w-[88%] -translate-y-1/2" />
          <div className={`wipe absolute -left-4 -right-4 bottom-[12%] -rotate-[5deg] py-2 text-center ${band}`} style={{ animationDelay: "200ms" }}>
            <p className="font-display text-[min(11vw,52px)] leading-none">{product}</p>
            <p className="lbl mt-1">You showed up</p>
          </div>
          <p className="font-display absolute left-3 top-1/2 -translate-y-1/2 text-[min(7vw,32px)] [writing-mode:vertical-rl] rotate-180">LV {level}</p>
        </div>
        <h1 className="sr-only">Unlocked: {product}</h1>
        <p className="mt-4 text-center text-lg font-bold uppercase tracking-wide">{note}</p>
      </div>

      <div className="mx-auto w-full max-w-md">{children}</div>
    </main>
  );
}
