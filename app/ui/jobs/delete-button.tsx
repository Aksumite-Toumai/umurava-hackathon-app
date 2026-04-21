"use client";

import { TrashIcon } from "@heroicons/react/24/outline";
import { deleteJobAction } from "@/app/lib/actions";
import { useTranslations } from "next-intl";

export function DeleteJob({ id }: { id: string }) {
  const t = useTranslations("JobsPage.actions");
  const deleteJobWithId = deleteJobAction.bind(null, id);

  return (
    <form
      action={deleteJobWithId}
      onSubmit={(e) => {
        if (!window.confirm(t("confirm_delete"))) {
          e.preventDefault();
        }
      }}
    >
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
