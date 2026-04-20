import { EyeIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

export function ViewTalent({ id }: { id: string }) {
  return (
    <Link
      href={`/dashboard/jobs/talent/${id}`}
      className="rounded-md border p-2 text-stone-600 hover:bg-gray-100 hover:text-blue-600 transition-colors"
    >
      <span className="sr-only">View</span>
      <EyeIcon className="w-5" />
    </Link>
  );
}
