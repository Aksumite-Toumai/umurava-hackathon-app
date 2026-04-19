"use client";

import { useState, useRef } from "react";
import {
  ArrowUpTrayIcon,
  DocumentIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";

export default function UploadCandidates({ jobId }: { jobId: string }) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<
    { filename: string; count: number; errors: string[] }[]
  >([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const ALLOWED = [".pdf", ".csv", ".xlsx", ".xls", ".json"];

  function handleFiles(selected: FileList | null) {
    if (!selected) return;
    const valid = Array.from(selected).filter((f) =>
      ALLOWED.some((ext) => f.name.toLowerCase().endsWith(ext)),
    );
    setFiles((prev) => [...prev, ...valid]);
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleUpload() {
    if (files.length === 0) return;
    setUploading(true);
    setResults([]);

    const uploadResults: { filename: string; count: number; errors: string[] }[] = [];

    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch(
          `/api/jobs/${jobId}/upload-talents`,
          { method: "POST", body: formData },
        );

        if (!res.ok) {
          const err = await res.json().catch(() => ({ detail: "Upload failed" }));
          uploadResults.push({
            filename: file.name,
            count: 0,
            errors: [err.detail || "Upload failed"],
          });
        } else {
          const data = await res.json();
          uploadResults.push({
            filename: file.name,
            count: data.candidates_parsed || 0,
            errors: data.errors || [],
          });
        }
      } catch {
        uploadResults.push({
          filename: file.name,
          count: 0,
          errors: ["Network error"],
        });
      }
    }

    setResults(uploadResults);
    setFiles([]);
    setUploading(false);
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
      <div className="border-b border-gray-100 bg-gray-50/50 p-4">
        <h2 className="flex items-center gap-2 font-bold text-stone-900">
          <ArrowUpTrayIcon className="h-5 w-5 text-amber-600" />
          Upload Candidates
        </h2>
      </div>

      <div className="p-4 space-y-4">
        {/* Drop zone */}
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleFiles(e.dataTransfer.files);
          }}
          className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 p-6 cursor-pointer hover:border-amber-400 hover:bg-amber-50/30 transition-colors"
        >
          <ArrowUpTrayIcon className="h-8 w-8 text-gray-400 mb-2" />
          <p className="text-sm text-stone-600">
            Drop files here or click to browse
          </p>
          <p className="text-xs text-stone-400 mt-1">
            PDF, CSV, XLSX, JSON supported
          </p>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".pdf,.csv,.xlsx,.xls,.json"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>

        {/* File list */}
        {files.length > 0 && (
          <div className="space-y-2">
            {files.map((file, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2"
              >
                <div className="flex items-center gap-2 text-sm text-stone-700">
                  <DocumentIcon className="h-4 w-4 text-gray-400" />
                  <span className="truncate max-w-[180px]">{file.name}</span>
                  <span className="text-xs text-stone-400">
                    ({(file.size / 1024).toFixed(0)}KB)
                  </span>
                </div>
                <button
                  onClick={() => removeFile(i)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            ))}

            <button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-amber-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-800 disabled:opacity-50"
            >
              {uploading
                ? "Uploading..."
                : `Upload ${files.length} file${files.length > 1 ? "s" : ""}`}
            </button>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-2">
            {results.map((r, i) => (
              <div
                key={i}
                className={`rounded-lg p-3 text-sm ${
                  r.errors.length > 0 && r.count === 0
                    ? "bg-red-50 text-red-700"
                    : "bg-green-50 text-green-700"
                }`}
              >
                <p className="font-medium">{r.filename}</p>
                {r.count > 0 && (
                  <p>
                    {r.count} candidate{r.count !== 1 ? "s" : ""} parsed
                  </p>
                )}
                {r.errors.map((err, j) => (
                  <p key={j} className="text-xs text-red-600">
                    {err}
                  </p>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
