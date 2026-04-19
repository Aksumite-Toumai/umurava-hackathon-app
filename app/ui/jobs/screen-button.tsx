"use client";

import { useState } from "react";
import { SparklesIcon } from "@heroicons/react/24/outline";
import { screenCandidatesAction } from "@/app/lib/actions";
import { useRouter } from "next/navigation";

export default function ScreenButton({ jobId }: { jobId: string }) {
  const [loading, setLoading] = useState(false);
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

    const res = await screenCandidatesAction(jobId);
    setResult(res);
    setLoading(false);

    if (res.success) {
      router.refresh();
    }
  }

  return (
    <div>
      <button
        onClick={handleScreen}
        disabled={loading}
        className="flex h-10 items-center gap-2 rounded-lg bg-stone-800 px-4 text-sm font-medium text-white transition-colors hover:bg-stone-900 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <SparklesIcon className="h-4 w-4" />
        {loading ? "Screening..." : "Screen Candidates"}
      </button>

      {result?.error && (
        <p className="mt-2 text-sm text-red-600">{result.error}</p>
      )}
      {result?.success && (
        <p className="mt-2 text-sm text-green-700">{result.message}</p>
      )}
    </div>
  );
}
