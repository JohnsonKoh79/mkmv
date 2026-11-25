import { Header } from "@/components/Header";
import { JoinForm } from "./JoinForm";

export default function Join() {
  return (
    <>
      <Header />
      <main className="flex-1 px-4 py-10 max-w-xl w-full mx-auto">
        <h1 className="font-display text-4xl"><span className="slant">Join</span></h1>
        <p className="mt-3">Referral only. No fee. Bring your word.</p>
        <JoinForm />
      </main>
    </>
  );
}
