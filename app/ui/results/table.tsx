import { auth } from "@/auth";
import { fetchScreenedCandidates } from "@/app/lib/data";
import { getTranslations } from "next-intl/server";
import {
  EyeIcon,
  EnvelopeIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

export default async function ResultsTable({
  query,
  currentPage,
  jobId,
}: {
  query: string;
  currentPage: number;
  jobId: string;
}) {
  const session = await auth();
  const userId = session?.user?.id;
  const t = await getTranslations("ResultsPage");

  if (!userId) return null;

  // Fetch only candidates who have a screening object attached
  const candidates = await fetchScreenedCandidates(
    userId,
    query,
    currentPage,
    jobId,
  );

  return (
    <div className="mt-6 flow-root">
      <div className="inline-block min-w-full align-middle">
        <div className="rounded-lg bg-gray-50 p-2 md:pt-0">
          <table className="min-w-full text-stone-900 md:table">
            <thead className="rounded-lg text-left text-sm font-normal">
              <tr>
                <th scope="col" className="px-4 py-5 font-medium sm:pl-6">
                  {t("headers.candidate")}
                </th>
                <th
                  scope="col"
                  className="px-3 py-5 font-medium hidden md:table-cell"
                >
                  {t("headers.job")}
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  {t("headers.rank")}
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  {t("headers.score")}
                </th>
                <th
                  scope="col"
                  className="px-3 py-5 font-medium hidden lg:table-cell"
                >
                  {t("headers.key_strength")}
                </th>
                <th scope="col" className="relative py-3 pl-6 pr-3">
                  <span className="sr-only">{t("headers.actions")}</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {candidates?.map((candidate) => {
                const s = candidate.screening;
                if (!s) return null;

                // Determine score color badge
                const isHigh = s.final_score >= 85;
                const isMed = s.final_score >= 70 && s.final_score < 85;

                return (
                  <tr
                    key={candidate._id}
                    className="w-full border-b py-3 text-sm last-of-type:border-none hover:bg-stone-50 transition-colors"
                  >
                    {/* Candidate Info */}
                    <td className="whitespace-nowrap py-3 pl-6 pr-3">
                      <p className="font-semibold text-stone-900">
                        {candidate.first_name} {candidate.last_name}
                      </p>
                      <p className="text-xs text-stone-500">
                        {candidate.email}
                      </p>
                    </td>

                    {/* Job Applied For (Requires joining the job data or passing job_title from DB) */}
                    <td className="whitespace-nowrap px-3 py-3 text-stone-600 hidden md:table-cell">
                      {candidate.job_title || "Unknown Job"}
                    </td>

                    {/* AI Rank */}
                    <td className="whitespace-nowrap px-3 py-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-800 ring-1 ring-amber-200">
                        #{s.rank}
                      </span>
                    </td>

                    {/* AI Score Badge */}
                    <td className="whitespace-nowrap px-3 py-3 font-medium">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-bold ring-1 ring-inset ${
                          isHigh
                            ? "bg-green-50 text-green-700 ring-green-600/20"
                            : isMed
                              ? "bg-yellow-50 text-yellow-800 ring-yellow-600/20"
                              : "bg-red-50 text-red-700 ring-red-600/10"
                        }`}
                      >
                        <SparklesIcon className="h-3 w-3" />
                        {s.final_score}/100
                      </span>
                    </td>

                    {/* Key Strength Snippet */}
                    <td className="px-3 py-3 text-stone-600 hidden lg:table-cell max-w-[250px] truncate text-xs">
                      {s.strengths[0] || "No data"}
                    </td>

                    {/* Actions */}
                    <td className="whitespace-nowrap py-3 pl-6 pr-3">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/dashboard/jobs/talent/${candidate._id}`}
                          className="rounded-md border p-2 text-stone-600 hover:bg-amber-100 hover:text-amber-700 transition-colors"
                          title={t("view_report")}
                        >
                          <EyeIcon className="w-5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {candidates?.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-stone-500">
                    <span className="mt-4 text-gray-400">
                      {t("no_results")}
                    </span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
