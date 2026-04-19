import {
  PencilIcon,
  PlusIcon,
  TrashIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { deleteJobAction } from "@/app/lib/actions";

export function CreateJob() {
  return (
    <Link
      href="/dashboard/jobs/create"
      className="flex h-10 items-center rounded-lg bg-amber-700 hover:bg-amber-800 px-4 text-sm font-medium text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
    >
      <span className="hidden md:block">Create Job</span>{" "}
      <PlusIcon className="h-5 md:ml-4" />
    </Link>
  );
}

export function UpdateJob({ id }: { id: string }) {
  return (
    <Link
      href={`/dashboard/jobs/${id}/edit`}
      className="rounded-md border p-2 text-stone-600 hover:bg-gray-100 hover:text-amber-700 transition-colors"
    >
      <PencilIcon className="w-5" />
    </Link>
  );
}

export function DeleteJob({ id }: { id: string }) {
  const deleteJobWithId = deleteJobAction.bind(null, id);

  return (
    <form action={deleteJobWithId}>
      <button
        type="submit"
        className="rounded-md border p-2 text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors"
      >
        <span className="sr-only">Delete</span>
        <TrashIcon className="w-5" />
      </button>
    </form>
  );
}

export function ViewJob({ id }: { id: string }) {
  return (
    <Link
      href={`/dashboard/jobs/${id}`}
      className="rounded-md border p-2 text-stone-600 hover:bg-gray-100 hover:text-blue-600 transition-colors"
    >
      <span className="sr-only">View</span>
      <EyeIcon className="w-5" />
    </Link>
  );
}
