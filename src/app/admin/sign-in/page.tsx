import { AdminBar } from "@/components/AdminBar";
import { AdminSignInForm } from "./AdminSignInForm";

export default function AdminSignIn() {
  return (
    <>
      <AdminBar menu={false} />
      <main className="flex-1 px-4 py-10 max-w-sm w-full mx-auto">
        <h1 className="font-display text-4xl"><span className="slant">Admin</span></h1>
        <AdminSignInForm />
      </main>
    </>
  );
}
