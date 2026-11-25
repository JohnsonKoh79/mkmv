"use client";
import { useFormStatus } from "react-dom";

/** Submit button that locks itself while its form is being sent, so a second tap does nothing. */
export function SubmitButton({ children, className, pendingLabel = "Working…" }:
  { children: React.ReactNode; className?: string; pendingLabel?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-busy={pending} className={`${className ?? ""} disabled:opacity-50`}>
      {pending ? pendingLabel : children}
    </button>
  );
}
