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
    <div className="rounded-xl bg-gray-50 p-2 shadow-sm">
      <div className="flex p-4">
        {Icon ? <Icon className="h-5 w-5 text-gray-700" /> : null}
        <h2 className="ml-2 text-sm font-medium">{title}</h2>
      </div>
      <p
        className={`${lusitana.className}
          truncate rounded-xl bg-white px-4 py-8 text-center text-4xl`}
      >
        {value}
      </p>
    </div>
  );
}
