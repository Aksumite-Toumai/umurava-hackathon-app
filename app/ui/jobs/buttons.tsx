import {
  PencilIcon,
  PlusIcon,
  TrashIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { deleteJobAction } from "@/app/lib/actions";
import { getTranslations } from "next-intl/server";

export async function CreateJob() {
  const t = await getTranslations("JobsPage");
  return (
    <Link
      href="/dashboard/jobs/create"
      className="flex h-10 items-center rounded-lg bg-amber-700 hover:bg-amber-800 px-4 text-sm font-medium text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
    >
      <span className="hidden md:block">{t("create_job")}</span>{" "}
      <PlusIcon className="h-5 md:ml-4" />
    </Link>
  );
}

export async function UpdateJob({ id }: { id: string }) {
  const t = await getTranslations("JobsPage.actions");
  return (
    <Link
      href={`/dashboard/jobs/${id}/edit`}
      className="rounded-md border p-2 text-stone-600 hover:bg-gray-100 hover:text-amber-700 transition-colors"
    >
      <span className="sr-only">{t("edit")}</span>
      <PencilIcon className="w-5" />
    </Link>
  );
}

export async function DeleteJob({ id }: { id: string }) {
  const t = await getTranslations("JobsPage.actions");
  const deleteJobWithId = deleteJobAction.bind(null, id);

  return (
    <form action={deleteJobWithId}>
      <button
        type="submit"
        className="rounded-md border p-2 text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors"
      >
        <span className="sr-only">{t("delete")}</span>
        <TrashIcon className="w-5" />
      </button>
    </form>
  );
}

export async function ViewJob({ id }: { id: string }) {
  const t = await getTranslations("JobsPage.actions");
  return (
    <Link
      href={`/dashboard/jobs/${id}`}
      className="rounded-md border p-2 text-stone-600 hover:bg-gray-100 hover:text-blue-600 transition-colors"
    >
      <span className="sr-only">{t("view")}</span>
      <EyeIcon className="w-5" />
    </Link>
  );
}
