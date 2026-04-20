import { fetchFilteredTalents } from "@/app/lib/data";
import { ViewTalent } from "@/app/ui/talents/button";

export default async function Table({
  job_id,
  query,
  currentPage,
}: {
  job_id: string;
  query: string;
  currentPage: number;
}) {
  const talents = await fetchFilteredTalents(job_id, query, currentPage);
  return (
    <div className="w-full">
      <div className="mt-6 flow-root">
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden rounded-md bg-gray-50 p-2 md:pt-0">
              <div className="md:hidden">
                {talents?.map((talent) => (
                  <div
                    key={talent._id}
                    className="mb-2 w-full rounded-md bg-white p-4"
                  >
                    <div className="flex items-center justify-between border-b pb-4">
                      <div>
                        <div className="mb-2 flex items-center">
                          <div className="flex items-center gap-3">
                            <p>{talent.first_name}</p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-500">
                          {talent.last_name}
                        </p>
                      </div>
                    </div>
                    <div className="flex w-full items-center justify-between border-b py-5">
                      <div className="flex w-1/2 flex-col">
                        <p className="font-medium">{talent.email}</p>
                      </div>
                      <div className="flex w-1/2 flex-col">
                        <p className="font-medium">{talent.headline}</p>
                      </div>
                    </div>
                    <div className="pt-4 text-sm">
                      <p>{talent.screening?.rank}</p>
                    </div>
                    <div className="flex justify-end gap-2">
                      <ViewTalent id={talent._id} />
                    </div>
                  </div>
                ))}

                {talents.length === 0 && (
                  <p className="mt-4 text-gray-400">
                    No talents found. please upload talents!
                  </p>
                )}
              </div>
              <table className="hidden min-w-full rounded-md text-gray-900 md:table">
                <thead className="rounded-md bg-gray-50 text-left text-sm font-normal">
                  <tr>
                    <th scope="col" className="px-4 py-5 font-medium sm:pl-6">
                      First Name
                    </th>
                    <th scope="col" className="px-3 py-5 font-medium">
                      Last Name
                    </th>
                    <th scope="col" className="px-3 py-5 font-medium">
                      Headline
                    </th>
                    <th scope="col" className="px-3 py-5 font-medium">
                      Rank
                    </th>
                    <th scope="col" className="relative py-3 pl-6 pr-3">
                      <span className="">Actions</span>
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200 text-gray-900">
                  {talents.map((talent) => (
                    <tr key={talent._id} className="group">
                      <td className="whitespace-nowrap bg-white px-4 py-5 text-sm">
                        {talent.first_name}
                      </td>
                      <td className="whitespace-nowrap bg-white px-4 py-5 text-sm">
                        {talent.last_name}
                      </td>
                      <td className="whitespace-nowrap bg-white px-4 py-5 text-sm">
                        {talent.headline}
                      </td>
                      <td className="whitespace-nowrap bg-white px-4 py-5 text-sm">
                        {talent.screening?.rank}
                      </td>
                      <td className="whitespace-nowrap py-3 pl-6 pr-3">
                        <div className="flex justify-end gap-3">
                          <ViewTalent id={talent._id} />
                        </div>
                      </td>
                    </tr>
                  ))}

                  {talents.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-10 text-center text-stone-500"
                      >
                        <span className="mt-4 text-gray-400">
                          No talents found. please upload talents!
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
