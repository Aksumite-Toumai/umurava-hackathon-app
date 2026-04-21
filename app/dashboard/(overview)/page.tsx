import {
  fetchDashboardStats,
  fetchTopJobsChart,
  fetchLatestTopTalents,
} from "@/app/lib/data";
import { Card } from "@/app/ui/dashboard/cards";
import JobCard from "@/app/ui/dashboard/job-chart";
import LatestTopTalents from "@/app/ui/dashboard/latest-job-top-talent";
import { lusitana } from "@/app/ui/fonts";
import { auth } from "@/auth";
import { getTranslations } from "next-intl/server";

export default async function Page() {
  const session = await auth();
  const userId = session?.user?.id;

  const t = await getTranslations();

  if (!userId) {
    return <div>{t("Dashboard.please_log_in")}</div>;
  }

  const [stats, chartData, latestTopTalent] = await Promise.all([
    fetchDashboardStats(userId),
    fetchTopJobsChart(userId),
    fetchLatestTopTalents(userId),
  ]);

  if (!stats) return null;

  return (
    <main>
      <h1 className={`${lusitana.className} mb-4 text-xl md:text-2xl`}>
        {t("Navigation.dashboard")}
      </h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card
          title={t("Dashboard.total_jobs")}
          value={stats["totalJobs"]}
          type="job_analysed"
        />
        <Card
          title={t("Dashboard.completed_jobs")}
          value={stats["doneJobs"]}
          type="file"
        />
        <Card
          title={t("Dashboard.pending_jobs")}
          value={stats["pendingJobs"]}
          type="pending"
        />
        <Card
          title={t("Dashboard.total_candidates")}
          value={stats["totalCandidates"]}
          type="talents"
        />
      </div>
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-4 lg:grid-cols-8">
        <JobCard jobs={chartData} />
        <LatestTopTalents talents={latestTopTalent} />
      </div>
    </main>
  );
}
