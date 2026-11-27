import Link from "next/link";
import { pendingPayment } from "@/lib/pending";
import { rm } from "@/lib/orders";

export async function PendingBanner({ playerId }: { playerId: string }) {
  const { count, total } = await pendingPayment(playerId);
  if (!count) return null;
  return (
    <Link href="/pay" className="mb-4 flex min-h-16 items-center justify-between gap-3 bg-ink px-4 py-3 text-offwhite">
      <span><span className="lbl block">Payment pending · {count} {count === 1 ? "item" : "items"}</span><b className="text-xl tabular-nums">{rm(total)}</b></span>
      <span className="border border-offwhite px-3 py-2 text-xs font-bold uppercase tracking-widest">Pay now</span>
    </Link>
  );
}
