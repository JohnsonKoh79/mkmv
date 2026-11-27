import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { CheckinNow } from "./CheckinNow";
import { getViewer } from "@/lib/viewer";

async function Content({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  await connection();
  const { code } = await searchParams;
  if (!code || !/^[a-f0-9]{32}$/.test(code)) {
    return <><p>Scan the founder&apos;s code to check in.</p><Link href="/move" className="btn mt-4 border-ink">My move</Link></>;
  }
  if (!(await getViewer()).signedIn) redirect(`/sign-in?next=/checkin?code=${code}`);
  return <CheckinNow code={code} />;
}

export default function CheckinPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-8"><Suspense fallback={null}><Content searchParams={searchParams} /></Suspense></main>
    </>
  );
}
