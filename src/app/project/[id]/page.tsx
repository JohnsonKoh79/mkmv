import { Suspense } from "react";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Stage } from "@/components/Stage";
import { getPublic } from "@/lib/public";
import { myLoggedDates } from "@/lib/mine";

async function Content({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  const [all, mine] = await Promise.all([getPublic(), myLoggedDates()]);
  const p = all.find((x) => x.id === id);
  if (!p) notFound();
  return <main className="flex-1"><Stage p={p} mine={mine} /></main>;
}

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  return (<><Header /><Suspense fallback={null}><Content params={params} /></Suspense></>);
}
