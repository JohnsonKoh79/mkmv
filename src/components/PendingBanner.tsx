import Link from "next/link";
import { pendingPayment } from "@/lib/pending";
import { rm } from "@/lib/orders";

const items = (n: number) => `${n} ${n === 1 ? "item" : "items"}`;

export async function PendingBanner({ playerId }: { playerId: string }) {
  const { due, checking } = await pendingPayment(playerId);
  return (
    <>
      {due.count > 0 && (
        <Link href="/pay" className="mb-4 flex min-h-16 items-center justify-between gap-3 bg-ink px-4 py-3 text-offwhite">
          <span><span className="lbl block">Payment pending · {items(due.count)}</span><b className="text-xl tabular-nums">{rm(due.total)}</b></span>
          <span className="border border-offwhite px-3 py-2 text-xs font-bold uppercase tracking-widest">Pay now</span>
        </Link>
      )}
      {checking.count > 0 && (
        <Link href="/me?tab=kit" className="mb-4 flex min-h-16 items-center justify-between gap-3 border-2 border-dashed border-ink px-4 py-3">
          <span><span className="lbl block">Pending for approval · {items(checking.count)}</span><b className="text-xl tabular-nums">{rm(checking.total)}</b></span>
          <span className="text-xs font-bold uppercase tracking-widest">View</span>
        </Link>
      )}
    </>
  );
}
