import { Suspense } from "react";
import { Header } from "@/components/Header";
import { SignInForm } from "./SignInForm";
import { safeNext } from "@/lib/after-sign-in";

async function Form({ searchParams }: { searchParams: Promise<{ error_code?: string; next?: string }> }) {
  const { error_code, next } = await searchParams;
  return <SignInForm key={error_code ?? "none"} linkError={Boolean(error_code)} next={safeNext(next)} />;
}

export default function SignIn({ searchParams }: { searchParams: Promise<{ error_code?: string; next?: string }> }) {
  return (
    <>
      <Header />
      <main className="flex-1 px-4 py-10 max-w-xl w-full mx-auto">
        <h1 className="font-display text-4xl"><span className="slant">Sign in</span></h1>
        <Suspense fallback={null}><Form searchParams={searchParams} /></Suspense>
      </main>
    </>
  );
}
