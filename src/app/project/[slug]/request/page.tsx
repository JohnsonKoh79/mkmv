import { Suspense } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";

async function Back({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <Link href={`/project/${slug}`} className="btn border-ink">Back to the project</Link>;
}

// Step 5 replaces this with the request form from the mock-up.
export default function RequestPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <>
      <Header />
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-4 px-4 py-8">
        <h1 className="h2 !text-4xl">Request to join</h1>
        <p>The request form opens soon. For now, ask a founder to add you.</p>
        <Suspense fallback={null}><Back params={params} /></Suspense>
      </main>
    </>
  );
}
