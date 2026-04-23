import {
  ClockIcon,
  UserGroupIcon,
  DocumentArrowUpIcon,
  DocumentCheckIcon,
} from "@heroicons/react/24/outline";
import { lusitana } from "@/app/ui/fonts";

const iconMap = {
  job_analysed: DocumentCheckIcon,
  talents: UserGroupIcon,
  pending: ClockIcon,
  file: DocumentArrowUpIcon,
};

export function Card({
  title,
  value,
  type,
}: {
  title: string;
  value: number | string;
  type: "job_analysed" | "talents" | "pending" | "file";
}) {
  const Icon = iconMap[type];

  return (
    <div className="rounded-xl bg-orange-800 p-2 shadow-sm">
      <div className="flex p-4 text-white">
        {Icon ? <Icon className="h-6 w-6" /> : null}
        <h2 className={`${lusitana.className} ml-2 text-xl md:text-xl`}>
          {title}
        </h2>
      </div>
      <p
        className={`${lusitana.className}
          truncate rounded-xl text-white px-2 py-8 text-center text-4xl`}
      >
        {value}
      </p>
    </div>
  );
}
