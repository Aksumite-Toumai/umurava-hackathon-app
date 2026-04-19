import { auth } from "@/auth";
import { fetchResults } from "@/app/lib/data";
import { ViewJob } from "@/app/ui/jobs/buttons";

export default async function Table({
  query,
  currentPage,
}: {
  query: string;
  currentPage: number;
}) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return (
      <div className="mt-6 text-center text-stone-500">
        Please log in to view your jobs.
      </div>
    );
  }

  const results = await fetchResults(
    userId,
    (currentPage - 1) * 10,
    10,
    query,
  );

  return (
    <div className="w-full">
      <div className="mt-6 flow-root">
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden rounded-md bg-gray-50 p-2 md:pt-0">
              <div className="md:hidden">
                {results?.map((result) => (
                  <div
                    key={result.job_id}
                    className="mb-2 w-full rounded-md bg-white p-4"
                  >
                    <div className="flex items-center justify-between border-b pb-4">
                      <div>
                        <p className="font-medium text-amber-700">
                          {result.role}
                        </p>
                        <p className="text-sm text-stone-600">
                          {result.company}
                        </p>
                      </div>
                    </div>
                    <div className="flex w-full items-center justify-between border-b py-5">
                      <div className="flex w-1/2 flex-col">
                        <p className="text-xs">Status</p>
                        <p className="font-medium">{result.status}</p>
                      </div>
                      <div className="flex w-1/2 flex-col">
                        <p className="text-xs">Candidates</p>
                        <p className="font-medium">{result.total_talent}</p>
                      </div>
                    </div>
                    <div className="pt-4 text-sm">
                      <p>{result.created_at}</p>
                    </div>
                    <div className="flex justify-end gap-2">
                      <ViewJob id={result.job_id} />
                    </div>
                  </div>
                ))}

                {results.length === 0 && (
                  <p className="mt-4 text-gray-400">No result found.</p>
                )}
              </div>
              <table className="hidden min-w-full rounded-md text-gray-900 md:table">
                <thead className="rounded-md bg-gray-50 text-left text-sm font-normal">
                  <tr>
                    <th scope="col" className="px-4 py-5 font-medium sm:pl-6">
                      Job Role
                    </th>
                    <th scope="col" className="px-3 py-5 font-medium">
                      Company
                    </th>
                    <th scope="col" className="px-3 py-5 font-medium">
                      Number of Talents
                    </th>
                    <th scope="col" className="px-3 py-5 font-medium">
                      Date
                    </th>
                    <th scope="col" className="relative py-3 pl-6 pr-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200 text-gray-900">
                  {results.map((result) => (
                    <tr key={result.job_id} className="group">
                      <td className="whitespace-nowrap bg-white px-4 py-5 text-sm">
                        {result.role}
                      </td>
                      <td className="whitespace-nowrap bg-white px-4 py-5 text-sm">
                        {result.company}
                      </td>
                      <td className="whitespace-nowrap bg-white px-4 py-5 text-sm">
                        {result.total_talent}
                      </td>
                      <td className="whitespace-nowrap bg-white px-4 py-5 text-sm">
                        {result.created_at}
                      </td>
                      <td className="whitespace-nowrap py-3 pl-6 pr-3">
                        <div className="flex justify-end gap-3">
                          <ViewJob id={result.job_id} />
                        </div>
                      </td>
                    </tr>
                  ))}

                  {results.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-10 text-center text-stone-500"
                      >
                        <span className="mt-4 text-gray-400">
                          No results found.
                        </span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
