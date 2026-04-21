"use client";

import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export default function JobFilter({
  jobs,
}: {
  jobs: { _id: string; role: string }[];
}) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();
  const t = useTranslations("ResultsPage");

  const handleFilterChange = (jobId: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", "1");

    if (jobId) {
      params.set("jobId", jobId);
    } else {
      params.delete("jobId");
    }
    replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="w-full md:w-72 flex-shrink-0">
      <label htmlFor="job-filter" className="sr-only">
        {t("filter_by_job")}
      </label>
      <select
        id="job-filter"
        className="block w-full rounded-md border border-gray-200 py-2.5 pl-3 pr-10 text-sm outline-2 text-stone-700 hover:bg-stone-50 focus:border-amber-500 focus:ring-amber-500"
        onChange={(e) => handleFilterChange(e.target.value)}
        defaultValue={searchParams.get("jobId")?.toString() || ""}
      >
        <option value="">{t("all_jobs")}</option>
        {jobs.map((job) => (
          <option key={job._id} value={job._id}>
            {job.role}
          </option>
        ))}
      </select>
    </div>
  );
}
