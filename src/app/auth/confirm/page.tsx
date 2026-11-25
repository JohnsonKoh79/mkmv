import { Suspense } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { SubmitButton } from "@/components/SubmitButton";
import { confirmSignIn } from "./actions";

// The token is used only when the person taps the button, so mail scanners that open links cannot use it up.
async function Content({ searchParams }: { searchParams: Promise<{ token_hash?: string }> }) {
  const { token_hash } = await searchParams;
  if (!token_hash) {
    return <Link href="/sign-in" className="mt-6 inline-flex min-h-12 items-center border border-ink px-8 uppercase text-sm font-bold tracking-widest">Send a new link</Link>;
  }
  return (
    <form action={confirmSignIn} className="mt-6">
      <input type="hidden" name="token_hash" value={token_hash} />
      <SubmitButton className="w-full min-h-14 bg-ink text-offwhite uppercase text-sm font-bold tracking-widest" pendingLabel="Getting you in…">Let me in</SubmitButton>
    </form>
  );
}

export default function Confirm({ searchParams }: { searchParams: Promise<{ token_hash?: string }> }) {
  return (
    <>
      <Header />
      <main className="flex-1 px-4 py-10 max-w-xl w-full mx-auto">
        <h1 className="font-display text-4xl"><span className="slant">One tap left</span></h1>
        <Suspense fallback={null}><Content searchParams={searchParams} /></Suspense>
      </main>
    </>
  );
}
