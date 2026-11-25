import { Header } from "@/components/Header";
import { SignInForm } from "./SignInForm";

export default function SignIn() {
  return (
    <>
      <Header />
      <main className="flex-1 px-4 py-10 max-w-xl w-full mx-auto">
        <h1 className="font-display text-4xl"><span className="slant">Sign in</span></h1>
        <SignInForm />
      </main>
    </>
  );
}
