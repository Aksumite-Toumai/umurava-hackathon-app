import { fetchFilteredTalents } from "@/app/lib/data";
import { ViewTalent } from "@/app/ui/talents/button";

type Tier = "champion" | "shortlist" | "below" | "unranked";

const TOP_N_CHAMPION = 3; // Rank 1-3: green
const TOP_N_SHORTLIST = 10; // Rank 4-10: amber

function tierFor(rank: number | null | undefined): Tier {
  if (!rank) return "unranked";
  if (rank <= TOP_N_CHAMPION) return "champion";
  if (rank <= TOP_N_SHORTLIST) return "shortlist";
  return "below";
}

const TIER_STYLES: Record<
  Tier,
  { row: string; indicator: string; label: string; labelText: string }
> = {
  champion: {
    row: "bg-green-50/60 hover:bg-green-50",
    indicator: "bg-green-500",
    label: "bg-green-100 text-green-800 ring-green-600/20",
    labelText: "Shortlist",
  },
  shortlist: {
    row: "bg-amber-50/50 hover:bg-amber-50",
    indicator: "bg-amber-500",
    label: "bg-amber-100 text-amber-800 ring-amber-600/20",
    labelText: "Top 10",
  },
  below: {
    row: "bg-white hover:bg-stone-50",
    indicator: "bg-stone-300",
    label: "bg-stone-100 text-stone-700 ring-stone-400/20",
    labelText: "Ranked",
  },
  unranked: {
    row: "bg-stone-50/40 hover:bg-stone-100/40 text-stone-500",
    indicator: "bg-stone-200",
    label: "bg-stone-100 text-stone-500 ring-stone-300/30",
    labelText: "Not screened",
  },
};

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
      {/* Legend */}
      <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-stone-600">
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-sm bg-green-500" />
          Top {TOP_N_CHAMPION} — Shortlist
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-sm bg-amber-500" />
          Top {TOP_N_SHORTLIST}
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-sm bg-stone-300" />
          Ranked (below Top {TOP_N_SHORTLIST})
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-sm bg-stone-200" />
          Not screened
        </span>
      </div>

      <div className="mt-3 flow-root">
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden rounded-md bg-gray-50 p-2 md:pt-0">
              {/* Mobile */}
              <div className="md:hidden">
                {talents?.map((talent) => {
                  const tier = tierFor(talent.screening?.rank);
                  const style = TIER_STYLES[tier];
                  return (
                    <div
                      key={talent._id}
                      className={`mb-2 w-full overflow-hidden rounded-md p-4 ${style.row}`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`h-5 w-1 rounded-sm ${style.indicator}`}
                        />
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${style.label}`}
                        >
                          {talent.screening?.rank
                            ? `#${talent.screening.rank}`
                            : style.labelText}
                        </span>
                      </div>
                      <p className="font-medium text-stone-900">
                        {talent.first_name} {talent.last_name}
                      </p>
                      <p className="text-xs text-stone-500">
                        {talent.headline}
                      </p>
                      <p className="text-xs text-stone-400">{talent.email}</p>
                      <div className="mt-3 flex justify-end gap-2">
                        <ViewTalent id={talent._id} />
                      </div>
                    </div>
                  );
                })}

                {talents.length === 0 && (
                  <p className="mt-4 text-gray-400">
                    No talents found. Upload talents to get started.
                  </p>
                )}
              </div>

              {/* Desktop */}
              <table className="hidden min-w-full rounded-md text-gray-900 md:table">
                <thead className="rounded-md bg-gray-50 text-left text-sm font-normal">
                  <tr>
                    <th
                      scope="col"
                      className="w-14 py-5 pl-4 font-medium sm:pl-6"
                    >
                      Rank
                    </th>
                    <th scope="col" className="px-3 py-5 font-medium">
                      Name
                    </th>
                    <th scope="col" className="px-3 py-5 font-medium">
                      Headline
                    </th>
                    <th scope="col" className="px-3 py-5 font-medium">
                      Email
                    </th>
                    <th scope="col" className="px-3 py-5 font-medium">
                      Status
                    </th>
                    <th
                      scope="col"
                      className="relative py-3 pl-6 pr-3 text-right"
                    >
                      <span className="pr-2">Actions</span>
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100 text-gray-900">
                  {talents.map((talent) => {
                    const rank = talent.screening?.rank;
                    const tier = tierFor(rank);
                    const style = TIER_STYLES[tier];
                    return (
                      <tr
                        key={talent._id}
                        className={`group relative ${style.row}`}
                      >
                        <td className="relative whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium sm:pl-6">
                          <span
                            className={`absolute left-0 top-0 h-full w-1 ${style.indicator}`}
                          />
                          {rank ? (
                            <span className="text-stone-900">#{rank}</span>
                          ) : (
                            <span className="text-stone-400">—</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span className="font-medium text-stone-900">
                            {talent.first_name} {talent.last_name}
                          </span>
                        </td>
                        <td className="px-3 py-4 text-sm text-stone-700 max-w-[240px] truncate">
                          {talent.headline || (
                            <span className="text-stone-400">—</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-stone-500">
                          {talent.email}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${style.label}`}
                          >
                            {style.labelText}
                          </span>
                        </td>
                        <td className="whitespace-nowrap py-3 pl-6 pr-3">
                          <div className="flex justify-end gap-3">
                            <ViewTalent id={talent._id} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {talents.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-10 text-center text-stone-500"
                      >
                        No talents found. Upload talents to get started.
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
