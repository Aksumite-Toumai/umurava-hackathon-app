import Pagination from "@/app/ui/jobs/pagination";
import Search from "@/app/ui/search";
import Table from "@/app/ui/results/table";
import JobFilter from "@/app/ui/results/job-filter";
import { lusitana } from "@/app/ui/fonts";
import { Suspense } from "react";
import { fetchResultPages, fetchJobsForFilter } from "@/app/lib/data";
import { auth } from "@/auth";
import { getTranslations } from "next-intl/server";
import { ResultTableSkeleton } from "@/app/ui/skeletons";

export default async function Page(props: {
  searchParams?: Promise<{
    query?: string;
    page?: string;
    jobId?: string;
  }>;
}) {
  const session = await auth();
  const userId = session?.user?.id;
  const t = await getTranslations("ResultsPage");

  if (!userId) {
    return (
      <div className="mt-6 text-center text-stone-500">
        {t("please_log_in")}
      </div>
    );
  }

  const searchParams = await props.searchParams;
  const query = searchParams?.query || "";
  const jobId = searchParams?.jobId || "";
  const currentPage = Number(searchParams?.page) || 1;

  const { totalPages, totalCount } = await fetchResultPages(
    userId,
    query,
    jobId,
  );
  const filterJobs = await fetchJobsForFilter(userId);

  return (
    <div className="w-full">
      <div className="flex w-full items-center justify-between">
        <h1 className={`${lusitana.className} text-2xl text-stone-900`}>
          {t("title")}
        </h1>
      </div>

      <div className="mt-4 flex flex-col items-center justify-between gap-4 md:mt-8 md:flex-row">
        <Search placeholder={t("search_placeholder")} />
        <JobFilter jobs={filterJobs} />
      </div>

      <div className="mt-5 flex w-full items-center justify-between">
        <h1 className={`${lusitana.className} text-2xl`}>
          <span className="rounded bg-amber-100 px-3 py-1 font-bold text-amber-800">
            {totalCount} {t("total_candidates_label")}
          </span>
        </h1>
      </div>

      <Suspense
        key={query + currentPage + jobId}
        fallback={<ResultTableSkeleton />}
      >
        <Table query={query} currentPage={currentPage} jobId={jobId} />
      </Suspense>

      <div className="mt-5 flex w-full justify-center">
        <Pagination totalPages={totalPages} />
      </div>
    </div>
  );
}
