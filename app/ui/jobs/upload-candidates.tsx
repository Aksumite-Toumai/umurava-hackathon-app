"use client";

import { useState, useRef } from "react";
import {
  ArrowUpTrayIcon,
  DocumentDuplicateIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export default function UploadCandidates({ jobId }: { jobId: string }) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const t = useTranslations("UploadCandidates");

  const [completedCount, setCompletedCount] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);
  const [uploadSummary, setUploadSummary] = useState<{
    successful: number;
    failed: number;
  } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const ALLOWED = [".pdf", ".csv", ".xlsx", ".xls", ".json"];

  function handleFiles(selected: FileList | null) {
    if (!selected) return;
    const valid = Array.from(selected).filter((f) =>
      ALLOWED.some((ext) => f.name.toLowerCase().endsWith(ext)),
    );
    setFiles((prev) => [...prev, ...valid]);
    setUploadSummary(null);
  }

  function clearFiles() {
    setFiles([]);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleUpload() {
    if (files.length === 0) return;

    setUploading(true);
    setTotalFiles(files.length);
    setCompletedCount(0);
    setUploadSummary(null);

    let successful = 0;
    let failed = 0;

    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch(`/api/jobs/${jobId}/upload-talents`, {
          method: "POST",
          body: formData,
        });

        if (!res.ok) failed++;
        else successful++;
      } catch {
        failed++;
      }

      setCompletedCount((prev) => prev + 1);
    }

    setUploadSummary({ successful, failed });
    setFiles([]);
    setUploading(false);
    router.refresh();
  }

  return (
    <>
      <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 p-4">
          <h2 className="flex items-center gap-2 font-bold text-stone-900">
            <ArrowUpTrayIcon className="h-5 w-5 text-amber-600" />
            {t("title")}
          </h2>
          <button
            onClick={() => setShowInfo(true)}
            className="rounded-full p-1 text-stone-400 hover:bg-amber-100 hover:text-amber-700 transition-colors"
            title={t("info_title")}
          >
            <InformationCircleIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Drop zone */}
          <div
            onClick={() => !uploading && inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!uploading) handleFiles(e.dataTransfer.files);
            }}
            className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors ${
              uploading
                ? "border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed"
                : "border-gray-200 cursor-pointer hover:border-amber-400 hover:bg-amber-50/30"
            }`}
          >
            <ArrowUpTrayIcon className="h-8 w-8 text-gray-400 mb-2" />
            <p className="text-sm text-stone-600 text-center">
              {uploading ? t("upload_in_progress") : t("drop_files")}
            </p>
            <p className="text-xs text-stone-400 mt-1">
              {t("supported_formats")}
            </p>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept=".pdf,.csv,.xlsx,.xls,.json"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
              disabled={uploading}
            />
          </div>

          {/* Selected Files Summary */}
          {files.length > 0 && !uploading && (
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg bg-amber-50 px-4 py-3 ring-1 ring-amber-100">
                <div className="flex items-center gap-3 text-sm text-amber-900">
                  <DocumentDuplicateIcon className="h-5 w-5 text-amber-600" />
                  <span className="font-medium">
                    {t("files_selected", { count: files.length })}
                  </span>
                </div>
                <button
                  onClick={clearFiles}
                  className="text-amber-700 hover:text-red-600"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              <button
                onClick={handleUpload}
                className="w-full rounded-lg bg-amber-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-amber-800"
              >
                {t("start_upload")}
              </button>
            </div>
          )}

          {/* Live Progress Bar */}
          {uploading && (
            <div className="mt-4 w-full space-y-2 rounded-lg bg-gray-50 p-4 ring-1 ring-gray-100">
              <div className="flex justify-between text-sm text-stone-600">
                <span className="font-medium animate-pulse text-amber-700">
                  {t("processing")}
                </span>
                <span className="font-bold text-stone-900">
                  {completedCount} / {totalFiles}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full bg-amber-500 transition-all duration-300"
                  style={{
                    width: `${totalFiles > 0 ? (completedCount / totalFiles) * 100 : 0}%`,
                  }}
                ></div>
              </div>
            </div>
          )}

          {/* Final Summary */}
          {uploadSummary && !uploading && (
            <div className="rounded-lg bg-stone-50 p-4 ring-1 ring-gray-100 space-y-2">
              <h3 className="text-sm font-bold text-stone-900 mb-3">
                {t("upload_complete")}
              </h3>
              {uploadSummary.successful > 0 && (
                <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded-md">
                  <CheckCircleIcon className="h-5 w-5" />
                  <span>
                    {t("successfully_parsed")}{" "}
                    <strong>{uploadSummary.successful}</strong>
                  </span>
                </div>
              )}
              {uploadSummary.failed > 0 && (
                <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 px-3 py-2 rounded-md">
                  <ExclamationCircleIcon className="h-5 w-5" />
                  <span>
                    {t("failed_to_process")}{" "}
                    <strong>{uploadSummary.failed}</strong>
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* The Information Modal */}
      {showInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h3 className="text-lg font-bold text-stone-900">
                {t("info_title")}
              </h3>
              <button
                onClick={() => setShowInfo(false)}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="overflow-y-auto px-6 py-4 space-y-8 text-sm text-stone-700">
              {/* Scenario 1: PDF */}
              <section>
                <h4 className="font-bold text-amber-700 text-base mb-2">
                  {t("scenario_cv_title")}
                </h4>
                <p>{t("scenario_cv_desc")}</p>
              </section>

              <hr className="border-gray-100" />

              {/* Scenario 2: CSV (Simple) */}
              <section>
                <h4 className="font-bold text-amber-700 text-base mb-2">
                  {t("scenario_csv_title")}
                </h4>
                <p className="mb-4">{t("scenario_csv_desc")}</p>

                <div className="bg-stone-900 rounded-lg overflow-hidden border border-stone-800">
                  <div className="bg-stone-800 px-4 py-2 flex items-center gap-2 border-b border-stone-700">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <span className="text-xs text-stone-400 ml-2 font-mono">
                      candidates_example.csv
                    </span>
                  </div>
                  <div className="overflow-x-auto p-4 text-xs font-mono text-stone-300 leading-relaxed whitespace-pre">
                    {`First Name,Last Name,Email,Headline,Location,Skills,Bio
Anubhav,Singh,xprilion@gmail.com,AI & Backend Engineer,Kolkata India,"Python,TensorFlow,Django,Docker",IT graduate with strong ML background.
John,Snow,me@myself.me,M.Sc. Snack Science Student,Winterfell,"Pizza,Teamwork,Programming",Creative student with an unusual specialization.
Marissa,Mayer,mmayer@yahoo.com,Business Woman,"Sunnyvale, CA","Leadership,Product,Strategy",Former Yahoo CEO and Google alum.`}
                  </div>
                </div>
                <p className="mt-2 text-xs text-stone-500">
                  {t("csv_example_note")}
                </p>
              </section>

              <hr className="border-gray-100" />

              {/* Scenario 3: JSON (Complex) */}
              <section>
                <h4 className="font-bold text-amber-700 text-base mb-2">
                  {t("scenario_json_title")}
                </h4>
                <p className="mb-4">{t("scenario_json_desc")}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h5 className="font-semibold text-stone-900 mb-2">
                      {t("mandatory_fields")}
                    </h5>
                    <ul className="list-disc pl-5 space-y-1 text-xs font-mono text-stone-600 bg-gray-50 p-3 rounded-md border border-gray-100">
                      <li>
                        first_name{" "}
                        <span className="text-stone-400">(String)</span>
                      </li>
                      <li>
                        last_name{" "}
                        <span className="text-stone-400">(String)</span>
                      </li>
                      <li>
                        email <span className="text-stone-400">(String)</span>
                      </li>
                      <li>
                        headline{" "}
                        <span className="text-stone-400">(String)</span>
                      </li>
                      <li>
                        location{" "}
                        <span className="text-stone-400">(String)</span>
                      </li>
                      <li>
                        skills{" "}
                        <span className="text-stone-400">
                          (Array of Objects)
                        </span>
                      </li>
                      <li>
                        experience{" "}
                        <span className="text-stone-400">
                          (Array of Objects)
                        </span>
                      </li>
                      <li>
                        education{" "}
                        <span className="text-stone-400">
                          (Array of Objects)
                        </span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h5 className="font-semibold text-stone-900 mb-2">
                      {t("optional_fields")}
                    </h5>
                    <ul className="list-disc pl-5 space-y-1 text-xs font-mono text-stone-600 bg-gray-50 p-3 rounded-md border border-gray-100">
                      <li>
                        bio <span className="text-stone-400">(String)</span>
                      </li>
                      <li>
                        projects{" "}
                        <span className="text-stone-400">
                          (Array of Objects)
                        </span>
                      </li>
                      <li>
                        languages{" "}
                        <span className="text-stone-400">
                          (Array of Objects)
                        </span>
                      </li>
                      <li>
                        certifications{" "}
                        <span className="text-stone-400">
                          (Array of Objects)
                        </span>
                      </li>
                      <li>
                        availability{" "}
                        <span className="text-stone-400">(Object)</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </section>
            </div>

            <div className="border-t border-gray-100 bg-gray-50 px-6 py-4 flex justify-end">
              <button
                onClick={() => setShowInfo(false)}
                className="rounded-lg bg-stone-900 px-5 py-2 text-sm font-medium text-white hover:bg-stone-800"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
