import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { getDb } from "@/app/lib/db/mongodb";
import { parseUploadedFile } from "@/app/lib/services/file-parser";
import { upsertCandidates } from "@/app/lib/services/candidate-upsert";
import { logUpload } from "@/app/lib/services/upload-log";

const ALLOWED_EXTENSIONS = [".pdf", ".csv", ".xlsx", ".xls", ".json"];
const MAX_UPLOAD_SIZE_MB = parseInt(process.env.MAX_UPLOAD_SIZE_MB || "10", 10);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  let job_id = "";
  let filename = "unknown";

  try {
    ({ id: job_id } = await params);

    if (!ObjectId.isValid(job_id)) {
      return NextResponse.json(
        { detail: "Invalid Job ID format" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const uploads = db.collection("uploads");
    const job = await db
      .collection("jobs")
      .findOne({ _id: new ObjectId(job_id) });

    if (!job) {
      return NextResponse.json({ detail: "Job not found" }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { detail: "No file provided" },
        { status: 400 },
      );
    }

    filename = file.name;
    const ext = "." + (file.name.split(".").pop() || "").toLowerCase();

    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      await logUpload(uploads, {
        job_id,
        filename,
        file_type: ext.replace(".", "") || "unknown",
        candidates_parsed: 0,
        errors: [
          `Unsupported file type '${ext}'. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`,
        ],
        status: "failed",
      });
      return NextResponse.json(
        {
          detail: `Unsupported file type '${ext}'. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`,
        },
        { status: 400 },
      );
    }

    const sizeMb = file.size / (1024 * 1024);
    if (sizeMb > MAX_UPLOAD_SIZE_MB) {
      await logUpload(uploads, {
        job_id,
        filename,
        file_type: ext.replace(".", ""),
        candidates_parsed: 0,
        errors: [
          `File too large (${sizeMb.toFixed(1)}MB). Max: ${MAX_UPLOAD_SIZE_MB}MB`,
        ],
        status: "failed",
      });
      return NextResponse.json(
        {
          detail: `File too large (${sizeMb.toFixed(1)}MB). Max: ${MAX_UPLOAD_SIZE_MB}MB`,
        },
        { status: 400 },
      );
    }

    const result = await parseUploadedFile(file);

    const candidates = db.collection("candidates");
    const stats = await upsertCandidates(candidates, job_id, result.candidates);

    const total = stats.inserted + stats.merged;
    await logUpload(uploads, {
      job_id,
      filename,
      file_type: result.fileType,
      candidates_parsed: total,
      errors: result.errors,
    });

    return NextResponse.json({
      message: `Stored ${total} candidates (${stats.inserted} new, ${stats.merged} merged).`,
      filename: file.name,
      file_type: result.fileType,
      candidates_parsed: total,
      inserted: stats.inserted,
      merged: stats.merged,
      errors: result.errors,
    });
  } catch (error) {
    console.error("Error uploading talents:", error);
    try {
      const db = await getDb();
      await logUpload(db.collection("uploads"), {
        job_id,
        filename,
        file_type: "unknown",
        candidates_parsed: 0,
        errors: [error instanceof Error ? error.message : "Unknown error"],
        status: "failed",
      });
    } catch {
      /* ignore logging failure */
    }
    return NextResponse.json(
      { detail: "Failed to process upload" },
      { status: 500 },
    );
  }
}
