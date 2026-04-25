"use client";

import { useState, useMemo } from "react";
import {
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/24/outline";
import { useTranslations, useLocale } from "next-intl";

import type { UploadRecord } from "@/app/lib/definitions";

type UploadGroup = {
  dateLabel: string;
  totalFiles: number;
  parsedCandidates: number;
  failedFiles: number;
  errors: string[];
};

export default function UploadHistory({
  uploads,
}: {
  uploads: UploadRecord[];
}) {
  const t = useTranslations("UploadHistory");
  const locale = useLocale();
  const [expanded, setExpanded] = useState<string | null>(null);

  // Group the individual file uploads by Date
  const groupedUploads = useMemo(() => {
    const groups: Record<string, UploadGroup> = {};

    uploads.forEach((u) => {
      const d = new Date(u.uploaded_at);
      const dateKey = new Intl.DateTimeFormat(locale, {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(d);

      if (!groups[dateKey]) {
        groups[dateKey] = {
          dateLabel: dateKey,
          totalFiles: 0,
          parsedCandidates: 0,
          failedFiles: 0,
          errors: [],
        };
      }

      groups[dateKey].totalFiles += 1;
      groups[dateKey].parsedCandidates += u.candidates_parsed || 0;

      if (u.status === "failed") {
        groups[dateKey].failedFiles += 1;
      }

      // Collect errors but cap them so the UI doesn't break if 100 files fail
      if (u.errors && u.errors.length > 0) {
        if (groups[dateKey].errors.length < 10) {
          groups[dateKey].errors.push(`${u.filename}: ${u.errors[0]}`);
        }
      }
    });

    return Object.values(groups);
  }, [uploads, locale]);

  if (groupedUploads.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
      <div className="border-b border-gray-100 bg-gray-50/50 p-4">
        <h2 className="flex items-center gap-2 font-bold text-stone-900">
          <ClockIcon className="h-5 w-5 text-stone-600" />
          {t("title")}
        </h2>
      </div>

      <ul className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
        {groupedUploads.map((group) => {
          const isOpen = expanded === group.dateLabel;
          const hasErrors = group.errors.length > 0;

          return (
            <li
              key={group.dateLabel}
              className="p-4 text-sm hover:bg-stone-50 transition-colors"
            >
              <button
                onClick={() =>
                  hasErrors && setExpanded(isOpen ? null : group.dateLabel)
                }
                className={`flex w-full items-start gap-3 text-left ${
                  hasErrors ? "cursor-pointer" : "cursor-default"
                }`}
              >
                <div className="mt-0.5">
                  {hasErrors || group.failedFiles > 0 ? (
                    <ExclamationTriangleIcon className="h-5 w-5 text-amber-500" />
                  ) : (
                    <CheckCircleIcon className="h-5 w-5 text-green-600" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-stone-900">
                    {t("files_uploaded_on", {
                      count: group.totalFiles,
                      date: group.dateLabel,
                    })}
                  </p>
                  <p className="text-stone-500 mt-0.5">
                    {t("candidates_parsed", { count: group.parsedCandidates })}
                    {group.failedFiles > 0 && (
                      <span className="text-red-500 font-medium">
                        {" "}
                        · {t("files_failed", { count: group.failedFiles })}
                      </span>
                    )}
                  </p>
                </div>

                {hasErrors && (
                  <div className="shrink-0 text-stone-400">
                    {isOpen ? (
                      <ChevronUpIcon className="h-5 w-5" />
                    ) : (
                      <ChevronDownIcon className="h-5 w-5" />
                    )}
                  </div>
                )}
              </button>

              {isOpen && hasErrors && (
                <div className="mt-3 ml-8 rounded-lg bg-red-50 p-3 ring-1 ring-inset ring-red-100">
                  <p className="text-xs font-semibold text-red-800 mb-2">
                    {t("error_log")}
                  </p>
                  <ul className="space-y-1 list-disc pl-4">
                    {group.errors.map((err, i) => (
                      <li key={i} className="text-xs text-red-700 truncate">
                        {err}
                      </li>
                    ))}
                    {group.failedFiles > 10 && (
                      <li className="text-xs text-red-700 italic">
                        ...and more
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
