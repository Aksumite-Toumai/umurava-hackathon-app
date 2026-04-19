import { ObjectId } from "mongodb";

import { getDb } from "@/app/lib/db/mongodb";
import type { JobDocument } from "@/app/lib/schemas/job";
import type { CandidateDocument } from "@/app/lib/schemas/candidate";

export async function fetchJobs(
  userId: string,
  skip: number = 0,
  limit: number = 10,
  query: string = "",
): Promise<JobDocument[]> {
  try {
    const db = await getDb();
    const filter: Record<string, unknown> = { user_id: userId };

    if (query) {
      filter.$or = [
        { role: { $regex: query, $options: "i" } },
        { company: { $regex: query, $options: "i" } },
        { skills: { $regex: query, $options: "i" } },
      ];
    }

    const results = await db
      .collection("jobs")
      .find(filter)
      .sort({ _id: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    return results.map((j) => ({
      _id: j._id.toString(),
      user_id: j.user_id,
      role: j.role,
      company: j.company,
      requirements: j.requirements ?? null,
      skills: j.skills ?? null,
      experience: j.experience ?? null,
      status: j.status,
      created_at: j.created_at,
    }));
  } catch (error) {
    console.error("Failed to fetch jobs:", error);
    return [];
  }
}

export async function fetchJobById(id: string): Promise<JobDocument> {
  if (!ObjectId.isValid(id)) {
    throw new Error("Invalid job ID.");
  }

  const db = await getDb();
  const job = await db.collection("jobs").findOne({ _id: new ObjectId(id) });

  if (!job) throw new Error("Job not found.");

  return {
    _id: job._id.toString(),
    user_id: job.user_id,
    role: job.role,
    company: job.company,
    requirements: job.requirements ?? null,
    skills: job.skills ?? null,
    experience: job.experience ?? null,
    status: job.status,
    created_at: job.created_at,
  };
}

export async function fetchCandidates(
  jobId: string,
  limit: number = 20,
): Promise<CandidateDocument[]> {
  try {
    const db = await getDb();
    const results = await db
      .collection("candidates")
      .find({ job_id: jobId })
      .sort({ "screening.rank": 1 })
      .limit(limit)
      .toArray();

    return results.map((c) => ({
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
  } catch (error) {
    console.error("Failed to fetch candidates:", error);
    return [];
  }
}

export async function fetchTopTalents(jobId: string): Promise<CandidateDocument[]> {
  return fetchCandidates(jobId, 3);
}

export type ResultRow = {
  job_id: string;
  role: string;
  company: string;
  created_at: string;
  status: string;
  total_talent: number;
};

export async function fetchResults(
  userId: string,
  skip: number = 0,
  limit: number = 10,
  query: string = "",
): Promise<ResultRow[]> {
  try {
    const db = await getDb();
    const filter: Record<string, unknown> = { user_id: userId };

    if (query) {
      filter.$or = [
        { role: { $regex: query, $options: "i" } },
        { company: { $regex: query, $options: "i" } },
      ];
    }

    const jobs = await db
      .collection("jobs")
      .find(filter)
      .sort({ _id: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    return await Promise.all(
      jobs.map(async (j) => {
        const total_talent = await db
          .collection("candidates")
          .countDocuments({ job_id: j._id.toString() });

        return {
          job_id: j._id.toString(),
          role: j.role,
          company: j.company,
          created_at: j.created_at,
          status: j.status,
          total_talent,
        };
      }),
    );
  } catch (error) {
    console.error("Failed to fetch results:", error);
    return [];
  }
}
