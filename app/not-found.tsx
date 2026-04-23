import Link from "next/link";
import { FaceFrownIcon } from "@heroicons/react/24/outline";
import { getTranslations } from "next-intl/server";

export default async function NotFound() {
  const t = await getTranslations("NotFoundPage");

  return (
    <main className="flex h-screen flex-col items-center justify-center gap-2">
      <FaceFrownIcon className="w-16 text-gray-400" />
      <h2 className="text-xl font-semibold">{t("title")}</h2>
      <p>{t("description")}</p>
      <Link
        href="/dashboard"
        className="mt-4 rounded-md bg-amber-700 px-4 py-2 text-sm text-white transition-colors hover:bg-amber-800"
      >
        {t("go_back")}
      </Link>
    </main>
  );
}
