"use client";

import { useEffect } from "react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { useTranslations } from "next-intl";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("ErrorPage");

  useEffect(() => {
    console.error("Caught by Error Boundary:", error);
  }, [error]);

  return (
    <main className="flex min-h-[400px] flex-col items-center justify-center gap-4 p-6">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
        <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />
      </div>
      <h2 className="text-xl font-bold text-stone-900 md:text-2xl">
        {t("title")}
      </h2>
      <p className="max-w-md text-center text-stone-500">{t("description")}</p>
      <Link
        href="/dashboard"
        className="mt-4 rounded-md bg-amber-700 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-amber-800"
      >
        {t("try_again")}
      </Link>
    </main>
  );
}
