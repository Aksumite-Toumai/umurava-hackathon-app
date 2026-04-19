import ATLogo from "@/app/ui/at-logo";
import RegisterForm from "@/app/ui/register-form";
import { Suspense } from "react";

export default function RegisterPage() {
  return (
    <main className="flex items-center justify-center md:h-screen">
      <div className="relative mx-auto flex w-full max-w-[500px] flex-col space-y-2.5 p-4 md:-mt-32">
        <div className="flex h-20 w-full items-end rounded-lg bg-orange-800 p-3 md:h-36">
          <div className="w-auto text-white">
            <ATLogo />
          </div>
        </div>
        <Suspense>
          <RegisterForm />
        </Suspense>
      </div>
    </main>
  );
}
