import ATLogo from "@/app/ui/at-logo";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { lusitana } from "@/app/ui/fonts";
import Image from "next/image";
import { getTranslations } from "next-intl/server";

export default async function Page() {
  const t = await getTranslations("HomePage");

  return (
    <main className="flex min-h-screen flex-col p-6">
      <div className="flex h-20 shrink-0 items-end rounded-lg bg-orange-800 p-4 md:h-52">
        <ATLogo />
      </div>
      <div className="mt-4 flex grow flex-col gap-4 md:flex-row">
        <div className="flex flex-col justify-center gap-6 rounded-lg px-6 py-10 md:w-2/5 md:px-20">
          <p
            className={`${lusitana.className} text-xl text-gray-800 md:text-3xl md:leading-normal`}
          >
            <strong>{t("title")}</strong> <br />
            {t("description")}
          </p>
          <Link
            href="/auth/login"
            className="flex items-center gap-5 self-start rounded-lg bg-orange-800 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-orange-600 md:text-base"
          >
            <span>{t("login")}</span> <ArrowRightIcon className="w-5 md:w-6" />
          </Link>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>{t("no_account")}</span>
            <Link
              href="/auth/register"
              className="font-medium text-orange-800 hover:text-orange-600"
            >
              {t("register")}
            </Link>
          </div>
        </div>
        <div className="flex items-center justify-center p-6 md:w-3/5 md:px-28 md:py-12">
          <Image src="/at.png" width={500} height={100} alt={t("logo_alt")} />
        </div>
      </div>
    </main>
  );
}
