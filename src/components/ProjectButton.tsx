import Link from "next/link";
import { WaitlistButton } from "@/components/WaitlistButton";
import type { BatchState } from "@/lib/batch";
import type { Viewer } from "@/lib/viewer";

const STATUS: Record<string, string> = { requested: "Requested", waitlisted: "On the waitlist", approved: "You're in" };

/** One button, chosen by batch state and visitor (build brief section 13). `tone` is the surface it sits on. */
export function ProjectButton({ projectId, slug, batchId, state, viewer, tone, solid = true }: {
  projectId: string | null; slug: string | null; batchId: string | null; state: BatchState; viewer: Viewer; tone: "dark" | "light"; solid?: boolean;
}) {
  const filled = tone === "dark" ? "bg-offwhite text-ink border-offwhite" : "bg-ink text-offwhite border-ink";
  const outline = tone === "dark" ? "border-offwhite text-offwhite" : "border-ink text-ink";
  const cls = solid ? filled : outline;

  if (batchId && viewer.seats.includes(batchId)) return <Link href="/move" className={`btn ${cls}`}>My move</Link>;
  const mine = viewer.requests.find((r) => r.projectId === projectId);
  if (mine) return <p className={`btn border-dashed ${outline}`} role="status">{STATUS[mine.status]}</p>;
  if (state === "finished") return <Link href={`/project/${slug}`} className={`btn ${cls}`}>See the record</Link>;

  const next = state === "open" ? `/project/${slug}/request` : slug ? `/project/${slug}` : "/";
  if (!viewer.signedIn) {
    return <Link href={`/sign-in?next=${next}`} className={`btn ${cls}`}>{state === "open" ? "Request to join" : "Join the waitlist"}</Link>;
  }
  if (state === "open") return <Link href={next} className={`btn ${cls}`}>Request to join</Link>;
  return <WaitlistButton projectId={projectId} kind={projectId ? "waitlist_next_batch" : "waitlist_next_project"} className={cls} />;
}
