import { UpdateJob, ViewJob } from "@/app/ui/jobs/buttons";
import { DeleteJob } from "@/app/ui/jobs/delete-button";
import { auth } from "@/auth";
import { fetchJobs } from "@/app/lib/data";
import JobStatus from "./status";
import { getTranslations } from "next-intl/server";

const formatDate = (dateString?: string) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

export default async function JobsTable({
  query,
  currentPage,
}: {
  query: string;
  currentPage: number;
}) {
  const session = await auth();
  const userId = session?.user?.id;
  const t = await getTranslations("JobsPage");

  if (!userId) {
    return (
      <div className="mt-6 text-center text-stone-500">
        {t("please_log_in")}
      </div>
    );
  }

  const jobs = await fetchJobs(userId, query, currentPage);

  return (
    <div className="mt-6 flow-root">
      <div className="inline-block min-w-full align-middle">
        <div className="rounded-lg bg-gray-50 p-2 md:pt-0">
          {/* --- MOBILE VIEW --- */}
          <div className="md:hidden">
            {jobs?.map((job) => (
              <div
                key={job._id}
                className="mb-2 w-full rounded-md bg-white p-4 border border-gray-100"
              >
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <p className="font-sm text-amber-700 text-lg">{job.role}</p>
                    <p className="text-sm font-medium text-stone-700">
                      {job.company}
                    </p>
                  </div>
                </div>
                <div className="flex w-full items-center justify-between pt-4">
                  <div>
                    <p className="text-sm text-stone-500 max-w-[200px] truncate">
                      {job.skills || t("no_skills")}
                    </p>
                    <p className="text-xs text-stone-400 mt-1">
                      {formatDate(job.created_at)}
                    </p>
                  </div>
                  <div className="flex justify-end gap-2">
                    <ViewJob id={job._id} />
                    <UpdateJob id={job._id} />
                    <DeleteJob id={job._id} />
                  </div>
                </div>
              </div>
            ))}

            {jobs.length === 0 && (
              <p className="mt-4 text-gray-400">{t("no_jobs_found")}</p>
            )}
          </div>

          {/* --- DESKTOP VIEW --- */}
          <table className="hidden min-w-full text-stone-900 md:table">
            <thead className="rounded-lg text-left text-sm font-normal">
              <tr>
                <th scope="col" className="px-4 py-5 font-medium sm:pl-6">
                  {t("table_headers.role")}
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  {t("table_headers.company")}
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  {t("table_headers.experience")}
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  {t("table_headers.skills")}
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  {t("table_headers.date_created")}
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  {t("table_headers.status")}
                </th>
                <th scope="col" className="relative py-3 pl-6 pr-3">
                  <span className="sr-only">{t("table_headers.actions")}</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {jobs?.map((job) => (
                <tr
                  key={job._id}
                  className="w-full border-b py-3 text-sm last-of-type:border-none hover:bg-stone-50 transition-colors [&:first-child>td:first-child]:rounded-tl-lg [&:first-child>td:last-child]:rounded-tr-lg [&:last-child>td:first-child]:rounded-bl-lg [&:last-child>td:last-child]:rounded-br-lg"
                >
                  <td className="whitespace-nowrap py-3 pl-6 pr-3 font-medium text-amber-800">
                    {job.role}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-stone-600 font-medium">
                    {job.company}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-stone-600">
                    {job.experience || t("not_specified")}
                  </td>
                  <td className="px-3 py-3 text-stone-600 max-w-[200px] truncate">
                    {job.skills || t("not_specified")}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-stone-500">
                    {formatDate(job.created_at)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-stone-500">
                    <JobStatus status={job.status} />
                  </td>
                  <td className="whitespace-nowrap py-3 pl-6 pr-3">
                    <div className="flex justify-end gap-3">
                      <ViewJob id={job._id} />
                      <UpdateJob id={job._id} />
                      <DeleteJob id={job._id} />
                    </div>
                  </td>
                </tr>
              ))}

              {jobs.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-stone-500">
                    <span className="mt-4 text-gray-400">
                      {t("no_jobs_found")}
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
