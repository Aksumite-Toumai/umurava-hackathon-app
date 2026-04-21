import { lusitana } from "@/app/ui/fonts";
import { generateYAxis } from "@/app/lib/utils";
import { UsersIcon } from "@heroicons/react/24/outline";
import { getTranslations } from "next-intl/server";

export default async function JobCard({ jobs }: { jobs: any[] }) {
  const chartHeight = 350;
  const t = await getTranslations("Dashboard.charts");

  if (!jobs || jobs.length === 0) {
    return (
      <div className="w-full md:col-span-4">
        <p className="mt-4 text-gray-400">{t("no_data")}</p>
      </div>
    );
  }

  const chartData = Array.isArray(jobs) ? jobs : [];
  const { yAxisLabels, topLabel } = generateYAxis(chartData);

  return (
    <div className="w-full md:col-span-4">
      <h2 className={`${lusitana.className} mb-4 text-xl md:text-2xl`}>
        {t("top_jobs")}
      </h2>

      <div className="rounded-xl bg-gray-50 p-4">
        <div className="flex flex-1 items-end gap-2 rounded-md bg-white p-4 md:gap-4 border border-gray-100">
          <div
            className="mb-8 hidden flex-col justify-between text-xs text-gray-400 sm:flex"
            style={{ height: `${chartHeight}px` }}
          >
            {yAxisLabels.map((label) => (
              <p key={label}>{label}</p>
            ))}
          </div>

          <div className="flex flex-1 items-end justify-around gap-2 sm:gap-4 h-full">
            {chartData.map((item: any) => (
              <div
                key={item.id}
                className="flex flex-col items-center gap-2 group w-full"
              >
                <span className="opacity-0 transition-opacity group-hover:opacity-100 text-xs font-bold text-amber-700">
                  {item.talents || item.candidates}
                </span>

                <div
                  className="w-full max-w-[60px] rounded-t-md bg-amber-700 transition-colors hover:bg-amber-600"
                  style={{
                    height: `${topLabel === 0 ? 0 : (chartHeight / topLabel) * (item.candidates || item.talents)}px`,
                    minHeight: "4px",
                  }}
                ></div>

                <p
                  className="text-xs text-gray-500 text-center w-full truncate px-1"
                  title={item.jobTitle}
                >
                  {item.jobTitle}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center pb-2 pt-4 px-2">
          <UsersIcon className="h-5 w-5 text-gray-500" />
          <h3 className="ml-2 text-sm text-gray-500 font-medium">
            {t("talents_per_job")}
          </h3>
        </div>
      </div>
    </div>
  );
}
