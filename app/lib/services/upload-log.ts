import type { Collection } from "mongodb";

export type UploadStatus = "success" | "partial" | "failed";

export type UploadLogEntry = {
  _id?: string;
  job_id: string;
  filename: string;
  file_type: string;
  status: UploadStatus;
  candidates_parsed: number;
  errors: string[];
  uploaded_at: string;
};

export async function logUpload(
  uploads: Collection,
  entry: Omit<UploadLogEntry, "_id" | "uploaded_at" | "status"> & {
    status?: UploadStatus;
  },
): Promise<void> {
  const status: UploadStatus =
    entry.status ??
    (entry.candidates_parsed === 0
      ? "failed"
      : entry.errors.length > 0
        ? "partial"
        : "success");

  await uploads.insertOne({
    job_id: entry.job_id,
    filename: entry.filename,
    file_type: entry.file_type,
    status,
    candidates_parsed: entry.candidates_parsed,
    errors: entry.errors,
    uploaded_at: new Date().toISOString(),
  });
}
