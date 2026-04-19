import { lusitana } from "@/app/ui/fonts";
import { Job } from "@/app/lib/definitions";

export default async function JobCard({ job }: { job: Job[] }) {
  const chartHeight = 350;

  if (!job || job.length === 0) {
    return (
      <div className="w-full md:col-span-4">
        <p className="mt-4 text-gray-400">No data available.</p>
      </div>
    );
  }

  return (
    <div className="w-full md:col-span-4">
      <h2 className={`${lusitana.className} mb-4 text-xl md:text-2xl`}>
        Latest Job
      </h2>

      <div className="rounded-xl bg-gray-50 p-4"></div>
    </div>
  );
}
