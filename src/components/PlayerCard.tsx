import Link from "next/link";
/* eslint-disable @next/next/no-img-element */

export function PlayerCard({ id, nickname, level, photo, finisher = false, dark = false }:
  { id: string; nickname: string; level: number; photo?: string | null; finisher?: boolean; dark?: boolean }) {
  return (
    <li className="min-w-0">
      <Link href={`/player/${id}`} className="block">
        <div className={`aspect-[4/5] border overflow-hidden ${dark ? "border-offwhite/40" : "border-ink/40"}`}>
          {photo ? (
            <img src={photo} alt={nickname} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full flex items-end p-2">
              <span className="font-display text-4xl leading-none opacity-30" aria-hidden>{nickname.slice(0, 1)}</span>
            </div>
          )}
        </div>
        <div className="mt-2 flex items-baseline justify-between gap-2 uppercase text-sm tracking-wide">
          <span className="truncate font-bold">{nickname}</span>
          <span className="tabular-nums shrink-0">LV {level}</span>
        </div>
        {finisher && <p className="uppercase text-xs tracking-widest mt-1">Finisher</p>}
      </Link>
    </li>
  );
}
