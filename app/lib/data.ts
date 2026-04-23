import { ObjectId } from "mongodb";
import { getDb } from "@/app/lib/db/mongodb";
import type { JobDocument } from "@/app/lib/schemas/job";
import type { CandidateDocument } from "@/app/lib/schemas/candidate";
import { unstable_noStore as noStore } from "next/cache";
import {
  ChartData,
  DashboardStats,
  FilterJob,
  ResultRow,
  TopTalent,
  UploadRecord,
} from "./definitions";

// Max number of item to diplay in a table
const TABLE_ITEMS_PER_PAGE = 6;

/**
 * Fetches high-level statistics for the main dashboard.
 * * @param userId - The ID of the currently logged-in user.
 * @returns An object containing counts for total jobs, pending jobs, done jobs, and candidate metrics.
 */
export async function fetchDashboardStats(
  userId: string,
): Promise<DashboardStats> {
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

/**
 * Fetches data for the "Jobs by Talent Volume" bar chart on the dashboard.
 * @param userId - The ID of the currently logged-in user.
 * @param top_n - Number of recent jobs to fetch.
 * @returns A Promise resolving to an array of ChartData.
 */
export async function fetchTopJobsChart(
  userId: string,
  top_n: number = 5,
): Promise<ChartData[]> {
  noStore();

  try {
    const db = await getDb();

    const recentJobs = await db
      .collection("jobs")
      .find({ user_id: userId })
      .sort({ created_at: -1 })
      .limit(top_n)
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

/**
 * Fetches the top 5 highest-ranked AI screened candidates across all jobs for a user.
 * @param userId - The ID of the currently logged-in user.
 * @param top_n - Top n talents to fetch.
 * @returns A Promise resolving to an array of TopTalent.
 */
export async function fetchLatestTopTalents(
  userId: string,
  top_n: number = 5,
): Promise<TopTalent[]> {
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
      .limit(top_n)
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

// ==========================================
// JOB DATA FETCHERS
// ==========================================
/**
 * Fetches a paginated list of jobs created by the user, with optional search filtering.
 * @param userId - The ID of the currently logged-in user.
 * @param query - The search string.
 * @param currentPage - The current page number from the table.
 * @returns A Promise resolving to an array of JobDocuments.
 */
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

/**
 * Fetches a single job by its MongoDB document ID.
 * @param id - The ObjectId string of the job.
 * @returns A Promise resolving to a JobDocument.
 */
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

/**
 * Calculates the total number of pages required for the Jobs table pagination.
 * @param userId - The ID of the currently logged-in user.
 * @param query - The current search query.
 * @returns A Promise resolving to a number representing total pages.
 */
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

// ==========================================
// CANDIDATE DATA FETCHERS
// ==========================================

/**
 * Fetches a limited list of candidates for a specific job, sorted by AI Rank.
 * @param jobId - The ID of the job.
 * @param limit - Maximum number of candidates to return.
 * @returns A Promise resolving to an array of CandidateDocuments.
 */
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

/**
 * Fetches a paginated and filtered list of candidates.
 * @param jobId - The ID of the job.
 * @param query - Search term for candidates.
 * @param currentPage - The current pagination page.
 * @returns A Promise resolving to an array of CandidateDocuments.
 */
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

    // Sort: ranked candidates first (by rank asc), unranked last.
    const results = await db
      .collection("candidates")
      .aggregate([
        { $match: search_filter },
        {
          $addFields: {
            _has_rank: {
              $cond: [{ $ifNull: ["$screening.rank", false] }, 0, 1],
            },
            _rank: { $ifNull: ["$screening.rank", 999999] },
          },
        },
        { $sort: { _has_rank: 1, _rank: 1 } },
        { $project: { _has_rank: 0, _rank: 0 } },
        { $skip: skip },
        { $limit: TABLE_ITEMS_PER_PAGE },
      ])
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

/**
 * Fetches a single candidate/talent profile by their document ID.
 * @param id - The ObjectId string of the candidate.
 * @returns A Promise resolving to a CandidateDocument.
 */
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

/**
 * Convenience wrapper to fetch the top n highest-ranked candidates for a specific job.
 * @param jobId - The ID of the job.
 * @param top_n - Number of top talent to fetch.
 * @returns A Promise resolving to an array of CandidateDocuments.
 */
export async function fetchTopTalents(
  jobId: string,
  top_n: number = 3,
): Promise<CandidateDocument[]> {
  return fetchCandidates(jobId, top_n);
}

/**
 * Fetches the resume parsing and upload logs for a specific job.
 * @param jobId - The ID of the job.
 * @param limit - Maximum number of logs to return.
 * @returns A Promise resolving to an array of UploadRecords.
 */
export async function fetchUploadHistory(
  jobId: string,
  limit: number = 20,
): Promise<UploadRecord[]> {
  try {
    const db = await getDb();
    const rows = await db
      .collection("uploads")
      .find({ job_id: jobId })
      .sort({ uploaded_at: -1 })
      .limit(limit)
      .toArray();

    return rows.map((r) => ({
      _id: r._id.toString(),
      filename: r.filename,
      file_type: r.file_type,
      status: r.status,
      candidates_parsed: r.candidates_parsed ?? 0,
      errors: r.errors ?? [],
      uploaded_at: r.uploaded_at,
    }));
  } catch (error) {
    console.error("Failed to fetch upload history:", error);
    return [];
  }
}

/**
 * Fetches counts for Total Candidates and Screened Candidates for a specific job.
 * @param jobId - The ID of the job.
 * @returns A Promise resolving to an object with total and screened counts.
 */
export async function fetchCandidateCounts(
  jobId: string,
): Promise<{ total: number; screened: number }> {
  try {
    const db = await getDb();
    const [total, screened] = await Promise.all([
      db.collection("candidates").countDocuments({ job_id: jobId }),
      db.collection("candidates").countDocuments({
        job_id: jobId,
        "screening.rank": { $exists: true },
      }),
    ]);
    return { total, screened };
  } catch (error) {
    console.error("Failed to fetch candidate counts:", error);
    return { total: 0, screened: 0 };
  }
}

/**
 * Calculates total pages required for the Candidates table pagination inside a Job Details view.
 * @param jobId - The ID of the job.
 * @param query - The current search query.
 * @returns A Promise resolving to a number representing total pages.
 */
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

// ==========================================
// RESULTS & AI SCREENING TYPES
// ==========================================
/**
 * Legacy fetcher for finding jobs marked as "done".
 * @param userId - The ID of the currently logged-in user.
 * @param query - The search string.
 * @param currentPage - The current page number.
 * @returns A Promise resolving to an array of ResultRows.
 */
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

/**
 * Fetches a lightweight list of the user's jobs to populate dropdown filters.
 * @param userId - The ID of the currently logged-in user.
 * @returns A Promise resolving to an array of FilterJobs.
 */
export async function fetchJobsForFilter(userId: string): Promise<FilterJob[]> {
  try {
    const db = await getDb();
    const jobs = await db
      .collection("jobs")
      .find({ user_id: userId, status: "done" })
      .project({ _id: 1, role: 1 })
      .sort({ created_at: -1 })
      .toArray();

    return jobs.map((j) => ({
      _id: j._id.toString(),
      role: j.role,
    }));
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch jobs for filter.");
  }
}

/**
 * Advanced Omni-search fetcher for the Global AI Results page.
 * @param userId - The ID of the currently logged-in user.
 * @param query - The string or number searched by the user.
 * @param currentPage - The current pagination page.
 * @param jobId - Optional. A specific job ID to filter the results by.
 * @returns A Promise resolving to an array of CandidateDocuments merged with a job_title.
 */
export async function fetchScreenedCandidates(
  userId: string,
  query: string,
  currentPage: number,
  jobId: string,
): Promise<(CandidateDocument & { job_title: string })[]> {
  const skip = (currentPage - 1) * TABLE_ITEMS_PER_PAGE;

  try {
    const db = await getDb();

    // Get the user's jobs first
    const userJobsFilter: any = { user_id: userId };
    if (jobId) {
      userJobsFilter._id = new ObjectId(jobId);
    }

    const userJobs = await db.collection("jobs").find(userJobsFilter).toArray();
    if (userJobs.length === 0) return [];

    let validJobIds = userJobs.map((j) => j._id.toString());

    // Create a map of Job ID -> Job Role for the table display
    const jobTitleMap = userJobs.reduce(
      (acc, job) => {
        acc[job._id.toString()] = job.role;
        return acc;
      },
      {} as Record<string, string>,
    );

    const matchQuery: any = {
      job_id: { $in: validJobIds },
      screening: { $exists: true, $ne: null },
    };

    // Build the Advanced Omni-Search
    if (query) {
      const orConditions: any[] = [
        { first_name: { $regex: query, $options: "i" } },
        { last_name: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
        { "screening.strengths": { $regex: query, $options: "i" } },
      ];

      // If the user typed a number, search Rank and Score
      const numQuery = parseInt(query, 10);
      if (!isNaN(numQuery)) {
        orConditions.push({ "screening.rank": numQuery });
        orConditions.push({ "screening.final_score": numQuery });
      }

      // Search by Job Title
      // Find any jobs where the role matches the search text
      const matchingJobIds = userJobs
        .filter((j) => j.role.toLowerCase().includes(query.toLowerCase()))
        .map((j) => j._id.toString());

      if (matchingJobIds.length > 0) {
        orConditions.push({ job_id: { $in: matchingJobIds } });
      }

      matchQuery.$or = orConditions;
    }

    const candidates = await db
      .collection("candidates")
      .find(matchQuery)
      .sort({ "screening.rank": 1 })
      .skip(skip)
      .limit(TABLE_ITEMS_PER_PAGE)
      .toArray();

    // the returned data
    return candidates.map((c) => ({
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

      job_title: jobTitleMap[c.job_id] || "Unknown Job",
    }));
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch AI screened candidates.");
  }
}

/**
 * Calculates total pages and total candidate count for the Global AI Results page.
 * @param userId - The ID of the currently logged-in user.
 * @param query - The active search string/number.
 * @param jobId - Optional. The currently selected job filter.
 * @returns A Promise resolving to an object containing totalPages and totalCount.
 */
export async function fetchResultPages(
  userId: string,
  query: string,
  jobId?: string,
): Promise<{ totalPages: number; totalCount: number }> {
  try {
    const db = await getDb();

    const userJobsFilter: any = { user_id: userId };
    if (jobId) {
      userJobsFilter._id = new ObjectId(jobId);
    }
    const userJobs = await db.collection("jobs").find(userJobsFilter).toArray();

    // If user has no jobs, return 0 for both
    if (userJobs.length === 0) return { totalPages: 0, totalCount: 0 };

    const validJobIds = userJobs.map((j) => j._id.toString());

    const matchQuery: any = {
      job_id: { $in: validJobIds },
      screening: { $exists: true, $ne: null },
    };

    if (query) {
      const orConditions: any[] = [
        { first_name: { $regex: query, $options: "i" } },
        { last_name: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
        { "screening.strengths": { $regex: query, $options: "i" } },
      ];

      const numQuery = parseInt(query, 10);
      if (!isNaN(numQuery)) {
        orConditions.push({ "screening.rank": numQuery });
        orConditions.push({ "screening.final_score": numQuery });
      }

      const matchingJobIds = userJobs
        .filter((j) => j.role.toLowerCase().includes(query.toLowerCase()))
        .map((j) => j._id.toString());

      if (matchingJobIds.length > 0) {
        orConditions.push({ job_id: { $in: matchingJobIds } });
      }

      matchQuery.$or = orConditions;
    }

    const count = await db.collection("candidates").countDocuments(matchQuery);

    return {
      totalPages: Math.ceil(count / TABLE_ITEMS_PER_PAGE),
      totalCount: count,
    };
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch total number of screened results pages.");
  }
}
