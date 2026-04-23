"use client";

import { useState } from "react";
import {
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/24/outline";
import { useTranslations } from "next-intl";

import type { UploadRecord } from "@/app/lib/definitions";

function formatTime(ts: string): string {
  try {
    const d = new Date(ts);
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(d);
  } catch {
    return ts;
  }
}

function StatusIcon({ status }: { status: UploadRecord["status"] }) {
  if (status === "success")
    return <CheckCircleIcon className="h-4 w-4 text-green-600" />;
  if (status === "partial")
    return <ExclamationTriangleIcon className="h-4 w-4 text-amber-600" />;
  return <XCircleIcon className="h-4 w-4 text-red-600" />;
}

export default function UploadHistory({
  uploads,
}: {
  uploads: UploadRecord[];
}) {
  const t = useTranslations("UploadHistory");
  const [expanded, setExpanded] = useState<string | null>(null);

  if (uploads.length === 0) {
    return null;
  }

  const failedCount = uploads.filter((u) => u.status === "failed").length;
  const partialCount = uploads.filter((u) => u.status === "partial").length;

  return (
    <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
      <div className="border-b border-gray-100 bg-gray-50/50 p-4">
        <h2 className="flex items-center gap-2 font-bold text-stone-900">
          <ClockIcon className="h-5 w-5 text-stone-600" />
          {t("title")}
          {(failedCount > 0 || partialCount > 0) && (
            <span className="ml-auto text-xs font-normal">
              {failedCount > 0 && (
                <span className="text-red-600">
                  {t("failed", { count: failedCount })}
                </span>
              )}
              {failedCount > 0 && partialCount > 0 && (
                <span className="text-stone-400"> · </span>
              )}
              {partialCount > 0 && (
                <span className="text-amber-700">
                  {t("partial", { count: partialCount })}
                </span>
              )}
            </span>
          )}
        </h2>
      </div>

      <ul className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
        {uploads.map((u) => {
          const isOpen = expanded === u._id;
          const hasDetails = u.errors.length > 0;
          return (
            <li key={u._id} className="p-3 text-sm">
              <button
                onClick={() => hasDetails && setExpanded(isOpen ? null : u._id)}
                className={`flex w-full items-start gap-2 text-left ${
                  hasDetails ? "cursor-pointer" : "cursor-default"
                }`}
              >
                <StatusIcon status={u.status} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-stone-800 truncate">
                    {u.filename}
                  </p>
                  <p className="text-xs text-stone-500">
                    {u.file_type} · {u.candidates_parsed} parsed ·{" "}
                    {formatTime(u.uploaded_at)}
                    {u.errors.length > 0 && (
                      <span className="text-amber-700">
                        {" "}
                        · {u.errors.length} error
                        {u.errors.length !== 1 ? "s" : ""}
                      </span>
                    )}
                  </p>
                </div>
                {hasDetails &&
                  (isOpen ? (
                    <ChevronUpIcon className="h-4 w-4 text-gray-400 shrink-0" />
                  ) : (
                    <ChevronDownIcon className="h-4 w-4 text-gray-400 shrink-0" />
                  ))}
              </button>

              {isOpen && hasDetails && (
                <ul className="mt-2 ml-6 space-y-1 rounded-lg bg-red-50/40 p-2 ring-1 ring-inset ring-red-600/10">
                  {u.errors.map((err, i) => (
                    <li key={i} className="text-xs text-red-700">
                      {err}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
