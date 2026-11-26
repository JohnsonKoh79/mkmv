"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

export function WithdrawButton({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button type="button" disabled={busy} className="min-h-11 text-xs font-bold uppercase tracking-widest underline disabled:opacity-50"
      onClick={async () => {
        if (!window.confirm("Withdraw this request?")) return;
        setBusy(true);
        await supabaseBrowser().rpc("withdraw_request", { p_request: id });
        router.refresh();
        setBusy(false);
      }}>
      Withdraw
    </button>
  );
}
