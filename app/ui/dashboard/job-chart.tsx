import { lusitana } from "@/app/ui/fonts";
import { UsersIcon } from "@heroicons/react/24/outline";
import { getTranslations } from "next-intl/server";

type JobChartItem = {
  id: string;
  jobTitle: string;
  candidates?: number;
  talents?: number;
};

export default async function JobCard({ jobs }: { jobs: JobChartItem[] }) {
  const t = await getTranslations("Dashboard.charts");

  if (!jobs || jobs.length === 0) {
    return (
      <div className="w-full md:col-span-4">
        <p className="mt-4 text-gray-400">{t("no_data")}</p>
      </div>
    );
  }

  const rows = [...jobs]
    .map((j) => ({
      id: j.id,
      title: j.jobTitle,
      count: j.candidates ?? j.talents ?? 0,
    }))
    .sort((a, b) => b.count - a.count);

  const maxCount = Math.max(...rows.map((r) => r.count), 1);

  return (
    <div className="w-full md:col-span-4">
      <h2 className={`${lusitana.className} mb-4 text-xl md:text-2xl`}>
        {t("top_jobs")}
      </h2>

      <div className="rounded-xl bg-gray-50 p-4">
        <div className="rounded-md bg-white p-4 border border-gray-100">
          <ul className="divide-y divide-gray-100">
            {rows.map((row) => {
              const widthPct =
                maxCount === 0 ? 0 : (row.count / maxCount) * 100;
              return (
                <li
                  key={row.id}
                  className="flex items-center gap-3 py-2.5 group"
                >
                  <p
                    className={`${lusitana.className} w-40 shrink-0 text-l text-stone-700 truncate`}
                    title={row.title}
                  >
                    {row.title}
                  </p>

                  <div className="relative flex-1 h-6 rounded-md bg-amber-100/60 overflow-hidden">
                    <div
                      className="h-full rounded-md bg-amber-700 transition-all group-hover:bg-amber-600"
                      style={{
                        width: `${Math.max(widthPct, row.count > 0 ? 4 : 0)}%`,
                      }}
                    />
                  </div>

                  <span
                    className={`${lusitana.className} w-10 text-right text-xl font-semibold text-stone-800 tabular-nums`}
                  >
                    {row.count}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="flex items-center pb-2 pt-4 px-2">
          <UsersIcon className="h-5 w-5 text-gray-500" />
          <h3
            className={`${lusitana.className} ml-2 text-sm text-gray-500 font-medium`}
          >
            {t("talents_per_job")}
          </h3>
        </div>
      </div>
    </div>
  );
}
