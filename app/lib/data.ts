import { ObjectId } from "mongodb";

import { getDb } from "@/app/lib/db/mongodb";
import type { JobDocument } from "@/app/lib/schemas/job";
import type { CandidateDocument } from "@/app/lib/schemas/candidate";
import { unstable_noStore as noStore } from "next/cache";

const TABLE_ITEMS_PER_PAGE = 10;

export async function fetchDashboardStats(userId: string) {
  noStore();

  try {
    const db = await getDb();

    const [totalJobs, pendingJobs, doneJobs] = await Promise.all([
      db.collection("jobs").countDocuments({ user_id: userId }),
      db
        .collection("jobs")
        .countDocuments({ user_id: userId, status: "pending" }),
      db.collection("jobs").countDocuments({ user_id: userId, status: "done" }),
    ]);

    const userJobs = await db
      .collection("jobs")
      .find({ user_id: userId }, { projection: { _id: 1 } })
      .toArray();

    const jobIds = userJobs.map((job) => job._id.toString());

    let totalCandidates = 0;
    let screenedCandidates = 0;

    if (jobIds.length > 0) {
      [totalCandidates, screenedCandidates] = await Promise.all([
        db.collection("candidates").countDocuments({ job_id: { $in: jobIds } }),
        db
          .collection("candidates")
          .countDocuments({ job_id: { $in: jobIds }, status: "done" }),
      ]);
    }
    return {
      totalJobs,
      pendingJobs,
      doneJobs,
      totalCandidates,
      screenedCandidates,
    };
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch dashboard stats.");
  }
}

export async function fetchTopJobsChart(userId: string) {
  noStore();

  try {
    const db = await getDb();

    const recentJobs = await db
      .collection("jobs")
      .find({ user_id: userId })
      .sort({ created_at: -1 })
      .limit(6)
      .toArray();

    if (recentJobs.length === 0) return [];

    const chartData = await Promise.all(
      recentJobs.map(async (job) => {
        const candidateCount = await db
          .collection("candidates")
          .countDocuments({ job_id: job._id.toString() });

        return {
          jobTitle: job.role,
          candidates: candidateCount,
          id: job._id.toString(),
        };
      }),
    );

    return chartData;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch chart data.");
  }
}

export async function fetchLatestTopTalents(userId: string) {
  noStore();

  try {
    const db = await getDb();

    const userJobs = await db
      .collection("jobs")
      .find({ user_id: userId })
      .toArray();

    if (userJobs.length === 0) return [];

    const jobIds = userJobs.map((job) => job._id.toString());

    const jobTitleMap = userJobs.reduce(
      (acc, job) => {
        acc[job._id.toString()] = job.role;
        return acc;
      },
      {} as Record<string, string>,
    );

    const topTalents = await db
      .collection("candidates")
      .find({
        job_id: { $in: jobIds },
      })
      .sort({ "screening.rank": 1 })
      .limit(5)
      .toArray();

    return topTalents.map((talent) => ({
      id: talent._id.toString(),
      name: `${talent.first_name || ""} ${talent.last_name || ""}`.trim(),
      email: talent.email,
      screening: talent.screening,

      job_applied_for: jobTitleMap[talent.job_id] || "Unknown Job",
    }));
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch latest talents.");
  }
}

export async function fetchJobs(
  userId: string,
  query: string = "",
  currentPage: number = 0,
): Promise<JobDocument[]> {
  try {
    const skip = (currentPage - 1) * TABLE_ITEMS_PER_PAGE;
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
      .limit(TABLE_ITEMS_PER_PAGE)
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

export async function fetchJobPages(
  userId: string,
  query: string,
): Promise<number> {
  try {
    const db = await getDb();

    const search_filter: any = { user_id: userId };

    if (query) {
      search_filter["$or"] = [
        { role: { $regex: query, $options: "i" } },
        { company: { $regex: query, $options: "i" } },
        { status: { $regex: query, $options: "i" } },
      ];
    }

    const count = await db.collection("jobs").countDocuments(search_filter);

    const totalPages = Math.ceil(count / TABLE_ITEMS_PER_PAGE);

    return totalPages;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch total number of jobs.");
  }
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

export async function fetchFilteredTalents(
  jobId: string,
  query: string,
  currentPage: number,
): Promise<CandidateDocument[]> {
  const skip = (currentPage - 1) * TABLE_ITEMS_PER_PAGE;

  try {
    const db = await getDb();

    const search_filter: any = { job_id: jobId };

    // Only add the text search if a query actually exists!
    if (query) {
      search_filter["$or"] = [
        { first_name: { $regex: query, $options: "i" } },
        { headline: { $regex: query, $options: "i" } },
        { last_name: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
      ];
    }

    const results = await db
      .collection("candidates")
      .find(search_filter)
      .sort({ "screening.rank": 1 })
      .skip(skip)
      .limit(TABLE_ITEMS_PER_PAGE)
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

export async function fetchTalentById(id: string): Promise<CandidateDocument> {
  try {
    if (!ObjectId.isValid(id)) {
      throw new Error("Invalid talent ID.");
    }

    const db = await getDb();
    const talent = await db
      .collection("candidates")
      .findOne({ _id: new ObjectId(id) });

    if (!talent) throw new Error("Talent not found.");

    return {
      _id: talent._id.toString(),
      job_id: talent.job_id,
      first_name: talent.first_name ?? "",
      last_name: talent.last_name ?? "",
      email: talent.email,
      headline: talent.headline ?? "",
      bio: talent.bio ?? null,
      location: talent.location ?? "",
      skills: talent.skills ?? [],
      languages: talent.languages ?? null,
      experience: talent.experience ?? [],
      education: talent.education ?? [],
      certifications: talent.certifications ?? null,
      projects: talent.projects ?? [],
      availability: talent.availability,
      socialLinks: talent.socialLinks ?? null,
      source: talent.source ?? "json",
      raw_resume_text: talent.raw_resume_text ?? null,
      screening: talent.screening ?? null,
      created_at: talent.created_at,
    };
  } catch (error) {
    console.error("Failed to fetch candidate:", error);
    throw new Error("Error to fetch talent");
  }
}

export async function fetchTopTalents(
  jobId: string,
): Promise<CandidateDocument[]> {
  return fetchCandidates(jobId, 3);
}

export async function fetchTalentPages(
  jobId: string,
  query: string,
): Promise<number> {
  try {
    const db = await getDb();

    const search_filter: any = { job_id: jobId };

    if (query) {
      search_filter["$or"] = [
        { first_name: { $regex: query, $options: "i" } },
        { headline: { $regex: query, $options: "i" } },
        { last_name: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
      ];
    }

    const count = await db
      .collection("candidates")
      .countDocuments(search_filter);

    const totalPages = Math.ceil(count / TABLE_ITEMS_PER_PAGE);

    return totalPages;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch total number of candidates.");
  }
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
  query: string,
  currentPage: number,
): Promise<ResultRow[]> {
  try {
    const skip = (currentPage - 1) * TABLE_ITEMS_PER_PAGE;
    const db = await getDb();
    const filter: Record<string, unknown> = { user_id: userId, status: "done" };

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
      .limit(TABLE_ITEMS_PER_PAGE)
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

export async function fetchResultPages(
  userId: string,
  query: string,
): Promise<number> {
  try {
    const db = await getDb();

    const search_filter: any = {
      user_id: userId,
      status: "done",
    };

    if (query) {
      search_filter["$or"] = [
        { role: { $regex: query, $options: "i" } },
        { company: { $regex: query, $options: "i" } },
      ];
    }

    const count = await db.collection("jobs").countDocuments(search_filter);

    const totalPages = Math.ceil(count / TABLE_ITEMS_PER_PAGE);

    return totalPages;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch total number of screened results.");
  }
}
