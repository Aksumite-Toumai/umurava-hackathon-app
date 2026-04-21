import { ArrowPathIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import Image from "next/image";
import { lusitana } from "@/app/ui/fonts";
import { ViewTalent } from "../talents/button";
import { getTranslations } from "next-intl/server";

export default async function LatestTopTalents({
  talents,
}: {
  talents: Record<string, any>[];
}) {
  const t = await getTranslations("Dashboard.charts");

  return (
    <div className="flex w-full flex-col md:col-span-4">
      <h2 className={`${lusitana.className} mb-4 text-xl md:text-2xl`}>
        {t("latest_talents")}
      </h2>
      <div className="flex grow flex-col justify-between rounded-xl bg-gray-50 p-4">
        <div className="bg-white px-6">
          {talents.map((talent, i) => {
            return (
              <div
                key={talent.id}
                className={clsx(
                  "flex flex-row items-center justify-between py-4",
                  {
                    "border-t": i !== 0,
                  },
                )}
              >
                <div className="flex items-center">
                  <Image
                    src="/talent.png"
                    alt={`${talent.name}'s profile picture`}
                    className="mr-4 rounded-full"
                    width={24}
                    height={24}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold md:text-base">
                      {talent.name}
                    </p>
                    <p className="hidden text-sm text-gray-500 sm:block">
                      {talent.email}
                    </p>
                  </div>
                </div>
                <p
                  className={`${lusitana.className} truncate text-sm font-medium md:text-base`}
                >
                  {talent.screening?.rank}
                </p>
                <ViewTalent id={talent.id} />
              </div>
            );
          })}
        </div>
        <div className="flex items-center pb-2 pt-6">
          <ArrowPathIcon className="h-5 w-5 text-gray-500" />
          <h3 className="ml-2 text-sm text-gray-500 ">
            {t("updated_just_now")}
          </h3>
        </div>
      </div>
    </div>
  );
}
