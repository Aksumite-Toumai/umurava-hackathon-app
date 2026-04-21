"use client";

import { useState } from "react";
import { SparklesIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { screenCandidatesAction } from "@/app/lib/actions";

const TOP_N_OPTIONS = [3, 5, 10, 15, 20] as const;

export default function ScreenButton({ jobId }: { jobId: string }) {
  const t = useTranslations("ScreenButton");
  const [loading, setLoading] = useState(false);
  const [topN, setTopN] = useState<number>(10);
  const [result, setResult] = useState<{
    error?: string;
    success?: boolean;
    message?: string;
    summary?: string;
  } | null>(null);
  const router = useRouter();

  async function handleScreen() {
    setLoading(true);
    setResult(null);

    const res = await screenCandidatesAction(jobId, topN);
    setResult(res);
    setLoading(false);

    if (res.success) {
      router.refresh();
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-1 rounded-lg border border-stone-300 bg-white px-2 h-10 text-sm">
          <span className="text-stone-500">{t("top")}</span>
          <select
            value={topN}
            onChange={(e) => setTopN(Number(e.target.value))}
            disabled={loading}
            className="bg-transparent font-medium text-stone-800 outline-none"
          >
            {TOP_N_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>

        <button
          onClick={handleScreen}
          disabled={loading}
          className="flex h-10 items-center gap-2 rounded-lg bg-stone-800 px-4 text-sm font-medium text-white transition-colors hover:bg-stone-900 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <SparklesIcon className="h-4 w-4" />
          {loading ? t("loading") : t("label")}
        </button>
      </div>

      {result?.error && (
        <p className="mt-2 text-sm text-red-600">{result.error}</p>
      )}
      {result?.success && (
        <p className="mt-2 text-sm text-green-700">{result.message}</p>
      )}
    </div>
  );
}
