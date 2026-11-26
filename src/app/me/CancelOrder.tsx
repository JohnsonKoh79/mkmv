"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

export function CancelOrder({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button type="button" disabled={busy} className="min-h-11 text-xs font-bold uppercase tracking-widest underline disabled:opacity-50"
      onClick={async () => {
        if (!window.confirm("Cancel this order?")) return;
        setBusy(true);
        await supabaseBrowser().rpc("cancel_order", { oid: id });
        router.refresh();
        setBusy(false);
      }}>
      Cancel
    </button>
  );
}
