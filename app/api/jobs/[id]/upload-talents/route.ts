import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { getDb } from "@/app/lib/db/mongodb";
import { parseUploadedFile } from "@/app/lib/services/file-parser";

const ALLOWED_EXTENSIONS = [".pdf", ".csv", ".xlsx", ".xls"];
const MAX_UPLOAD_SIZE_MB = parseInt(
  process.env.MAX_UPLOAD_SIZE_MB || "10",
  10,
);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: job_id } = await params;

    if (!ObjectId.isValid(job_id)) {
      return NextResponse.json(
        { detail: "Invalid Job ID format" },
        { status: 400 },
      );
    }

    const db = await getDb();
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

    const ext = "." + (file.name.split(".").pop() || "").toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        {
          detail: `Unsupported file type '${ext}'. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`,
        },
        { status: 400 },
      );
    }

    const sizeMb = file.size / (1024 * 1024);
    if (sizeMb > MAX_UPLOAD_SIZE_MB) {
      return NextResponse.json(
        {
          detail: `File too large (${sizeMb.toFixed(1)}MB). Max: ${MAX_UPLOAD_SIZE_MB}MB`,
        },
        { status: 400 },
      );
    }

    const result = await parseUploadedFile(file);

    const candidates = db.collection("candidates");
    const created_at = new Date().toISOString();

    const docs = result.applicants.map((a) => ({
      job_id,
      name: a.name,
      email: a.email,
      phone: a.phone,
      skills: a.skills,
      experience_years: a.experience_years,
      experience_details: a.experience_details,
      education: a.education,
      summary: a.summary,
      raw_resume_text: a.raw_resume_text,
      screening: null,
      created_at,
    }));

    if (docs.length > 0) {
      await candidates.insertMany(docs);
    }

    return NextResponse.json({
      message: `Parsed and stored ${docs.length} candidates.`,
      filename: file.name,
      file_type: result.fileType,
      candidates_parsed: docs.length,
      errors: result.errors,
    });
  } catch (error) {
    console.error("Error uploading talents:", error);
    return NextResponse.json(
      { detail: "Failed to process upload" },
      { status: 500 },
    );
  }
}
