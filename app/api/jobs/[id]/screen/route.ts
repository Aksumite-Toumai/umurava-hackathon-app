import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { getDb } from "@/app/lib/db/mongodb";
import { JobStatus } from "@/app/lib/schemas/job";
import { screenCandidates } from "@/app/lib/services/screening";
import type { CandidateDocument } from "@/app/lib/schemas/candidate";

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

    const candidatesForScreening: CandidateDocument[] = rows.map((c) => ({
      _id: c._id.toString(),
      job_id: c.job_id,
      first_name: c.first_name ?? "",
      last_name: c.last_name ?? "",
      email: c.email,
      headline: c.headline ?? "",
      bio: c.bio ?? null,
      location: c.location ?? "",
      skills: c.skills ?? [],
      languages: c.languages ?? null,
      experience: c.experience ?? [],
      education: c.education ?? [],
      certifications: c.certifications ?? null,
      projects: c.projects ?? [],
      availability: c.availability,
      socialLinks: c.socialLinks ?? null,
      source: c.source ?? "json",
      raw_resume_text: c.raw_resume_text ?? null,
      screening: c.screening ?? null,
      created_at: c.created_at,
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
        top_n: Math.min(candidatesForScreening.length, 20),
      },
      candidatesForScreening,
    );

    for (const c of result.shortlist) {
      const update: Record<string, unknown> = {
        screening: {
          rank: c.rank,
          final_score: c.final_score,
          scores: c.scores,
          strengths: c.strengths,
          gaps: c.gaps,
          recommendation: c.recommendation,
        },
      };

      if (c.enriched_profile) {
        for (const [key, value] of Object.entries(c.enriched_profile)) {
          if (value !== undefined && value !== null) {
            update[key] = value;
          }
        }
      }

      await candidates.updateOne(
        { job_id, email: c.email },
        { $set: update },
      );
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
