import {
  fetchJobById,
  fetchCandidates,
  fetchTalentPages,
} from "@/app/lib/data";
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
  DocumentArrowUpIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";
import TalentSidebar from "@/app/ui/jobs/talent-sidebar";
import ScreenButton from "@/app/ui/jobs/screen-button";
import UploadCandidates from "@/app/ui/jobs/upload-candidates";
import Pagination from "@/app/ui/jobs/pagination";
import Search from "@/app/ui/search";
import Table from "@/app/ui/jobs/talent-table";
import { lusitana } from "@/app/ui/fonts";
import { JobTableSkeleton } from "@/app/ui/skeletons";
import { Suspense } from "react";

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

export default async function Page(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ query?: string; page?: string }>;
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const id = params.id;
  const query = searchParams?.query || "";
  const currentPage = Number(searchParams?.page) || 1;
  const totalPages = await fetchTalentPages(id, query);

  let job, candidates;
  [job, candidates] = await Promise.all([
    fetchJobById(id),
    fetchCandidates(id, 3),
  ]);

  if (!job) {
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
        <div className="lg:col-span-2 overflow-hidden rounded-xl">
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

              <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-stone-500 mb-2">
                  <CalendarIcon className="h-5 w-5" />
                  Date Posted
                </div>
                <p className="text-stone-900 font-medium">
                  {formatDate(job.created_at)}
                </p>
              </div>

              <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-stone-500 mb-2">
                  <DocumentArrowUpIcon className="h-5 w-5" />
                  Talent Upload Status
                </div>
                {/* Candidate count */}
                {candidates.length > 0 && (
                  <div className="px-3 pb-3">
                    <p className="text-sm text-amber-800">
                      {candidates.length} talent
                      {candidates.length !== 1 ? "s" : ""} uploaded
                      {hasScreened
                        ? ": screening complete"
                        : ": not screened yet"}
                    </p>
                  </div>
                )}
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

          <div className="w-full mt-8">
            <div className="flex w-full items-center justify-between">
              <h1 className={`${lusitana.className} text-2xl`}>Talents</h1>
            </div>
            <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
              <Search placeholder="Search talent..." />
            </div>
            <Suspense key={query + currentPage} fallback={<JobTableSkeleton />}>
              <Table job_id={id} query={query} currentPage={currentPage} />
            </Suspense>
            <div className="mt-5 flex w-full justify-center">
              <Pagination totalPages={totalPages} />
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <UploadCandidates jobId={id} />
          <TalentSidebar candidates={candidates} />
        </div>
      </div>
    </main>
  );
}
