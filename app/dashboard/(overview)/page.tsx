import { Card } from "@/app/ui/dashboard/cards";
import RevenueChart from "@/app/ui/dashboard/job-chart";
import LatestTopTalents from "@/app/ui/dashboard/latest-job-top-talent";
import { lusitana } from "@/app/ui/fonts";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function Page() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <main>
      <h1 className={`${lusitana.className} mb-4 text-xl md:text-2xl`}>
        Dashboard
      </h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card title="Jobs Analysed" value={10} type="job_analysed" />
        <Card title="Pending Jobs" value={0} type="pending" />
        <Card title="File Uploaded" value={0} type="file" />
        <Card title="Talents" value={0} type="talents" />
      </div>
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-4 lg:grid-cols-8">
        <RevenueChart job={[]} />
        <LatestTopTalents talents={[]} />
      </div>
    </main>
  );
}
