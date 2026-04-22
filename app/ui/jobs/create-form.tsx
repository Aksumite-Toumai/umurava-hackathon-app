"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  BriefcaseIcon,
  BuildingOfficeIcon,
  ClockIcon,
  WrenchScrewdriverIcon,
  ClipboardDocumentListIcon,
  DocumentArrowUpIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/app/ui/button";
import { createJobAction } from "@/app/lib/actions";

export default function Form() {
  const [state, formAction, isPending] = useActionState(
    createJobAction,
    undefined,
  );

  return (
    <form action={formAction}>
      <div className="rounded-md bg-gray-50 p-4 md:p-6">
        {/* Job Role */}
        <div className="mb-4">
          <label htmlFor="role" className="mb-2 block text-sm font-medium">
            Job Role / Title <span className="text-red-500">*</span>
          </label>
          <div className="relative mt-2 rounded-md">
            <div className="relative">
              <input
                id="role"
                name="role"
                type="text"
                required
                placeholder="e.g., Senior Software Engineer"
                className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500 focus:border-amber-700 focus:ring-1 focus:ring-amber-700"
              />
              <BriefcaseIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-amber-700" />
            </div>
          </div>
        </div>

        {/* Company Name */}
        <div className="mb-4">
          <label htmlFor="company" className="mb-2 block text-sm font-medium">
            Company Name <span className="text-red-500">*</span>
          </label>
          <div className="relative mt-2 rounded-md">
            <div className="relative">
              <input
                id="company"
                name="company"
                type="text"
                required
                placeholder="Enter the name of the company"
                className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500 focus:border-amber-700 focus:ring-1 focus:ring-amber-700"
              />
              <BuildingOfficeIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-amber-700" />
            </div>
          </div>
        </div>

        {/* Experience */}
        <div className="mb-4">
          <label
            htmlFor="experience"
            className="mb-2 block text-sm font-medium"
          >
            Experience Level
          </label>
          <div className="relative mt-2 rounded-md">
            <div className="relative">
              <input
                id="experience"
                name="experience"
                type="text"
                placeholder="e.g., 3+ years in software development"
                className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500 focus:border-amber-700 focus:ring-1 focus:ring-amber-700"
              />
              <ClockIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-amber-700" />
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="mb-4">
          <label htmlFor="skills" className="mb-2 block text-sm font-medium">
            Key Skills
          </label>
          <div className="relative mt-2 rounded-md">
            <div className="relative">
              <input
                id="skills"
                name="skills"
                type="text"
                placeholder="e.g., Python, FastAPI, MongoDB, React"
                className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500 focus:border-amber-700 focus:ring-1 focus:ring-amber-700"
              />
              <WrenchScrewdriverIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-amber-700" />
            </div>
          </div>
        </div>

        {/* Requirements */}
        <div className="mb-4">
          <label
            htmlFor="requirements"
            className="mb-2 block text-sm font-medium"
          >
            Detailed Requirements
          </label>
          <div className="relative mt-2 rounded-md">
            <div className="relative">
              <textarea
                id="requirements"
                name="requirements"
                rows={4}
                placeholder="Describe the responsibilities and requirements..."
                className="peer block w-full rounded-md border border-gray-200 py-3 pl-10 text-sm outline-2 placeholder:text-gray-500 focus:border-amber-700 focus:ring-1 focus:ring-amber-700"
              />
              {/* Notice the icon is aligned to top-3 instead of centered so it stays at the top of the textarea */}
              <ClipboardDocumentListIcon className="pointer-events-none absolute left-3 top-3 h-[18px] w-[18px] text-gray-500 peer-focus:text-amber-700" />
            </div>
          </div>
        </div>

        {/* Talent File Upload */}
        {/* <div className="mt-8 mb-4 border-t border-gray-200 pt-6">
          <label
            htmlFor="talents_file"
            className="mb-2 block text-sm font-medium text-stone-900"
          >
            Upload Talents
          </label>
          <p className="mb-4 text-xs text-stone-500">
            Upload a CSV or PDF file of applicants now, or skip this and upload
            them later from the dashboard.
          </p>
          <div className="relative mt-2 rounded-md">
            <div className="relative flex items-center">
              <input
                id="talents_file"
                name="talents_file"
                type="file"
                // the file types we want to accept, e.g., accept=".csv,.xlsx"
                className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm text-stone-600 outline-2 file:mr-4 file:rounded-md file:border-0 file:bg-amber-700 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-amber-800 focus:border-amber-700 focus:ring-1 focus:ring-amber-700"
              />
              <DocumentArrowUpIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-amber-700" />
            </div>
          </div>
        </div> */}
      </div>

      {state?.error && (
        <div className="mt-4 flex items-center gap-2 text-red-500">
          <ExclamationCircleIcon className="h-5 w-5" />
          <p className="text-sm font-medium">{state.error}</p>
        </div>
      )}

      <div className="mt-6 flex justify-end gap-4">
        <Link
          href="/dashboard/jobs"
          className="flex h-10 items-center rounded-lg bg-gray-100 px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
        >
          Cancel
        </Link>

        <Button
          type="submit"
          disabled={isPending}
          className="bg-amber-700 hover:bg-amber-800 disabled:opacity-50"
        >
          {isPending ? "Creating..." : "Create Job"}
        </Button>
      </div>
    </form>
  );
}
