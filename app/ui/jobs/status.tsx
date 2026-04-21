import {
  CheckIcon,
  ClockIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";

export default function JobStatus({ status }: { status: string }) {
  return (
    <span
      className={clsx("inline-flex items-center rounded px-2 py-1 text-xs", {
        "bg-gray-100 text-gray-500": status === "pending",
        "bg-green-500 text-white": status === "done",
        "bg-red-50 text-red-700": status === "error",
      })}
    >
      {status === "pending" ? (
        <>
          Pending
          <ClockIcon className="ml-1 w-4 text-gray-500" />
        </>
      ) : null}
      {status === "done" ? (
        <>
          Screened
          <CheckIcon className="ml-1 w-4 text-white" />
        </>
      ) : null}
      {status === "error" ? (
        <>
          Error
          <ExclamationCircleIcon className="ml-1 w-4 text-red" />
        </>
      ) : null}
    </span>
  );
}
