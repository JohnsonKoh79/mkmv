"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { sendCheckIn } from "@/lib/check-in";

/** Reached by scanning with the phone's own camera. Checks in straight away. */
export function CheckinNow({ code }: { code: string }) {
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    void sendCheckIn(code).then(setResult);
  }, [code]);

  return (
    <>
      <div className={`border p-6 ${result?.ok ? "border-ink bg-ink text-offwhite" : "border-ink"}`} role="status">
        <p className="h2 !text-4xl !leading-none">{result ? result.message : "Checking you in…"}</p>
      </div>
      <Link href="/move" className="btn mt-4 border-ink">My move</Link>
    </>
  );
}
