import { fetchJobById, fetchCandidates } from "@/app/lib/data";
import { notFound } from "next/navigation";
import Link from "next/link";
import Breadcrumbs from "@/app/ui/jobs/breadcrumbs";
import JobStatus from "@/app/ui/jobs/status";
import {
  BuildingOfficeIcon,
  ClockIcon,
  WrenchScrewdriverIcon,
  CalendarIcon,
  ArrowLeftIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";
import TalentSidebar from "@/app/ui/jobs/talent-sidebar";
import ScreenButton from "@/app/ui/jobs/screen-button";
import UploadCandidates from "@/app/ui/jobs/upload-candidates";

const formatDate = (dateString?: string) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
  }).format(date);
};

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const id = params.id;

  let job, candidates;
  try {
    [job, candidates] = await Promise.all([
      fetchJobById(id),
      fetchCandidates(id),
    ]);
  } catch (error) {
    notFound();
  }

  const hasScreened = candidates.some(
    (c: any) => c.screening && c.screening.rank,
  );

  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: "Jobs", href: "/dashboard/jobs" },
          {
            label: "View Job",
            href: `/dashboard/jobs/${id}`,
            active: true,
          },
        ]}
      />
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 overflow-hidden rounded-xl shadow-sm">
          <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
            <div className="border-b border-gray-100 bg-gray-50/50 p-6 md:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-stone-900 md:text-3xl">
                    {job.role}
                  </h1>
                  <div className="mt-2 flex items-center gap-2 text-amber-700">
                    <BuildingOfficeIcon className="h-5 w-5" />
                    <span className="font-medium text-lg">{job.company}</span>
                  </div>
                </div>
                <div className="flex sm:justify-end">
                  <JobStatus status={job.status} />
                </div>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2 md:p-8">
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-stone-500 mb-2">
                  <ClockIcon className="h-5 w-5" />
                  Experience Required
                </div>
                <p className="text-stone-900 font-medium">
                  {job.experience || "Not specified"}
                </p>
              </div>

              <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-stone-500 mb-2">
                  <WrenchScrewdriverIcon className="h-5 w-5" />
                  Key Skills
                </div>
                <p className="text-stone-900 font-medium">
                  {job.skills || "Not specified"}
                </p>
              </div>

              <div className="rounded-lg border border-gray-100 bg-gray-50 p-4 md:col-span-2">
                <div className="flex items-center gap-2 text-sm font-medium text-stone-500 mb-2">
                  <CalendarIcon className="h-5 w-5" />
                  Date Posted
                </div>
                <p className="text-stone-900 font-medium">
                  {formatDate(job.created_at)}
                </p>
              </div>
            </div>

            {job.requirements && (
              <div className="border-t border-gray-100 p-6 md:p-8">
                <h2 className="text-lg font-bold text-stone-900 mb-4">
                  Detailed Requirements
                </h2>
                <div className="prose prose-stone max-w-none text-stone-600 whitespace-pre-wrap">
                  {job.requirements}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex items-center justify-between p-3">
            <Link
              href="/dashboard/jobs"
              className="flex items-center gap-2 text-sm font-medium text-stone-500 hover:text-stone-900 transition-colors"
            >
              <ArrowLeftIcon className="h-4 w-4" /> Back to Jobs
            </Link>

            <div className="flex items-center gap-3">
              <ScreenButton jobId={id} />
              <Link
                href={`/dashboard/jobs/${id}/edit`}
                className="flex h-10 items-center gap-2 rounded-lg bg-amber-700 px-4 text-sm font-medium text-white transition-colors hover:bg-amber-800"
              >
                <PencilIcon className="h-4 w-4" /> Edit Job
              </Link>
            </div>
          </div>

          {/* Candidate count */}
          {candidates.length > 0 && (
            <div className="px-3 pb-3">
              <p className="text-sm text-stone-500">
                {candidates.length} candidate{candidates.length !== 1 ? "s" : ""} uploaded
                {hasScreened ? " — screening complete" : " — not screened yet"}
              </p>
            </div>
          )}
        </div>

        <div className="lg:col-span-1 space-y-6">
          <UploadCandidates jobId={id} />
          <TalentSidebar candidates={candidates} />
        </div>
      </div>
    </main>
  );
}
