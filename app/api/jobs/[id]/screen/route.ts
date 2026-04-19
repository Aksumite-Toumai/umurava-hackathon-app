import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { getDb } from "@/app/lib/db/mongodb";
import { JobStatus } from "@/app/lib/schemas/job";
import { screenCandidates } from "@/app/lib/services/screening";
import type { ParsedApplicant } from "@/app/lib/schemas/candidate";

export async function POST(
  _req: NextRequest,
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
    const jobs = db.collection("jobs");
    const candidates = db.collection("candidates");

    const job = await jobs.findOne({ _id: new ObjectId(job_id) });
    if (!job) {
      return NextResponse.json({ detail: "Job not found" }, { status: 404 });
    }

    const rows = await candidates.find({ job_id }).limit(500).toArray();
    if (rows.length === 0) {
      return NextResponse.json(
        { detail: "No candidates found. Upload a file first." },
        { status: 400 },
      );
    }

    const applicants: ParsedApplicant[] = rows.map((c) => ({
      name: c.name || "Unknown",
      email: c.email ?? null,
      phone: c.phone ?? null,
      skills: c.skills || [],
      experience_years: c.experience_years ?? null,
      experience_details: c.experience_details || [],
      education: c.education || [],
      summary: c.summary ?? null,
      raw_resume_text: c.raw_resume_text ?? null,
    }));

    const required_skills = ((job.skills as string) || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const result = await screenCandidates(
      {
        job_title: (job.role as string) || "",
        job_description: (job.requirements as string) || "",
        required_skills,
        experience_level: (job.experience as string) || "",
        top_n: Math.min(applicants.length, 20),
      },
      applicants,
    );

    // Store results back on each candidate (by email if available, else name)
    for (const c of result.shortlist) {
      const filter: Record<string, unknown> = { job_id };
      if (c.email) filter.email = c.email;
      else filter.name = c.name;

      await candidates.updateOne(filter, {
        $set: {
          screening: {
            rank: c.rank,
            final_score: c.final_score,
            scores: c.scores,
            strengths: c.strengths,
            gaps: c.gaps,
            recommendation: c.recommendation,
          },
        },
      });
    }

    await jobs.updateOne(
      { _id: new ObjectId(job_id) },
      { $set: { status: JobStatus.DONE } },
    );

    return NextResponse.json({
      message: `Screening complete. ${result.shortlist.length} candidates ranked.`,
      total_evaluated: result.total_evaluated,
      summary: result.screening_summary,
    });
  } catch (error) {
    console.error("Error screening candidates:", error);
    return NextResponse.json(
      {
        detail:
          error instanceof Error
            ? `Screening failed: ${error.message}`
            : "Screening failed",
      },
      { status: 500 },
    );
  }
}
