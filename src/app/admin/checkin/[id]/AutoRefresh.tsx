"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Updates the list of who has checked in while the code is on screen. */
export function AutoRefresh() {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => router.refresh(), 8000);
    return () => clearInterval(t);
  }, [router]);
  return null;
}
