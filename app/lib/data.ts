import { ObjectId, type Filter, type Document } from "mongodb";
import { unstable_noStore as noStore } from "next/cache";

import { getDb } from "@/app/lib/db/mongodb";
import { mapCandidate, mapJob } from "@/app/lib/db/mappers";
import type { CandidateDocument } from "@/app/lib/schemas/candidate";
import type { JobDocument } from "@/app/lib/schemas/job";
import type {
  ChartData,
  DashboardStats,
  FilterJob,
  ResultRow,
  TopTalent,
  UploadRecord,
} from "./definitions";

const TABLE_ITEMS_PER_PAGE = 6;

// ============================================================
// DASHBOARD
// ============================================================

/**
 * Fetches high-level statistics for the main dashboard.
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
        db.collection("candidates").countDocuments({
          job_id: { $in: jobIds },
          "screening.rank": { $exists: true },
        }),
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
    console.error("[data] fetchDashboardStats failed:", error);
    throw new Error("Failed to fetch dashboard stats.");
  }
}

/**
 * Fetches data for the "Jobs by Talent Volume" chart on the dashboard.
 */
export async function fetchTopJobsChart(
  userId: string,
  topN: number = 5,
): Promise<ChartData[]> {
  noStore();

  try {
    const db = await getDb();

    const recentJobs = await db
      .collection("jobs")
      .find({ user_id: userId })
      .sort({ created_at: -1 })
      .limit(topN)
      .toArray();

    if (recentJobs.length === 0) return [];

    return await Promise.all(
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
  } catch (error) {
    console.error("[data] fetchTopJobsChart failed:", error);
    throw new Error("Failed to fetch chart data.");
  }
}

/**
 * Fetches the top n highest-ranked screened candidates across all jobs for a user.
 */
export async function fetchLatestTopTalents(
  userId: string,
  topN: number = 5,
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

    const jobTitleMap: Record<string, string> = {};
    for (const job of userJobs) {
      jobTitleMap[job._id.toString()] = job.role;
    }

    const topTalents = await db
      .collection("candidates")
      .find({
        job_id: { $in: jobIds },
        "screening.rank": { $exists: true },
      })
      .sort({ "screening.rank": 1 })
      .limit(topN)
      .toArray();

    return topTalents.map((talent) => ({
      id: talent._id.toString(),
      name: `${talent.first_name || ""} ${talent.last_name || ""}`.trim(),
      email: talent.email,
      screening: talent.screening,
      job_applied_for: jobTitleMap[talent.job_id] ?? "Unknown Job",
    }));
  } catch (error) {
    console.error("[data] fetchLatestTopTalents failed:", error);
    throw new Error("Failed to fetch latest talents.");
  }
}

// ============================================================
// JOBS
// ============================================================

/**
 * Fetches a paginated list of jobs created by the user, with optional search filter.
 */
export async function fetchJobs(
  userId: string,
  query: string = "",
  currentPage: number = 0,
): Promise<JobDocument[]> {
  try {
    const skip = (currentPage - 1) * TABLE_ITEMS_PER_PAGE;
    const db = await getDb();
    const filter: Filter<Document> = { user_id: userId };

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

    return results.map(mapJob);
  } catch (error) {
    console.error("[data] fetchJobs failed:", error);
    return [];
  }
}

/**
 * Fetches a single job by its document ID. Throws on missing or invalid ID.
 */
export async function fetchJobById(id: string): Promise<JobDocument> {
  if (!ObjectId.isValid(id)) {
    throw new Error("Invalid job ID.");
  }

  const db = await getDb();
  const job = await db.collection("jobs").findOne({ _id: new ObjectId(id) });

  if (!job) throw new Error("Job not found.");

  return mapJob(job);
}

/**
 * Calculates total pages for the Jobs table pagination.
 */
export async function fetchJobPages(
  userId: string,
  query: string,
): Promise<number> {
  try {
    const db = await getDb();
    const filter: Filter<Document> = { user_id: userId };

    if (query) {
      filter.$or = [
        { role: { $regex: query, $options: "i" } },
        { company: { $regex: query, $options: "i" } },
        { status: { $regex: query, $options: "i" } },
      ];
    }

    const count = await db.collection("jobs").countDocuments(filter);
    return Math.ceil(count / TABLE_ITEMS_PER_PAGE);
  } catch (error) {
    console.error("[data] fetchJobPages failed:", error);
    throw new Error("Failed to fetch total number of jobs.");
  }
}

/**
 * Fetches a lightweight list of the user's done jobs for filter dropdowns.
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
    console.error("[data] fetchJobsForFilter failed:", error);
    throw new Error("Failed to fetch jobs for filter.");
  }
}

// ============================================================
// CANDIDATES (per job)
// ============================================================

/**
 * Fetches a limited list of candidates for a specific job, sorted by AI rank.
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

    return results.map(mapCandidate);
  } catch (error) {
    console.error("[data] fetchCandidates failed:", error);
    return [];
  }
}

/**
 * Convenience wrapper to fetch the top N highest-ranked candidates for a job.
 */
export async function fetchTopTalents(
  jobId: string,
  topN: number = 3,
): Promise<CandidateDocument[]> {
  return fetchCandidates(jobId, topN);
}

/**
 * Fetches a paginated, search-filtered list of candidates for a job.
 * Sorting: ranked candidates first (rank asc), unranked at the bottom.
 */
export async function fetchFilteredTalents(
  jobId: string,
  query: string,
  currentPage: number,
): Promise<CandidateDocument[]> {
  const skip = (currentPage - 1) * TABLE_ITEMS_PER_PAGE;

  try {
    const db = await getDb();
    const filter: Filter<Document> = { job_id: jobId };

    if (query) {
      filter.$or = [
        { first_name: { $regex: query, $options: "i" } },
        { last_name: { $regex: query, $options: "i" } },
        { headline: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
      ];
    }

    const results = await db
      .collection("candidates")
      .aggregate([
        { $match: filter },
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

    return results.map(mapCandidate);
  } catch (error) {
    console.error("[data] fetchFilteredTalents failed:", error);
    return [];
  }
}

/**
 * Fetches a single candidate by document ID.
 */
export async function fetchTalentById(id: string): Promise<CandidateDocument> {
  if (!ObjectId.isValid(id)) {
    throw new Error("Invalid talent ID.");
  }

  const db = await getDb();
  const talent = await db
    .collection("candidates")
    .findOne({ _id: new ObjectId(id) });

  if (!talent) throw new Error("Talent not found.");

  return mapCandidate(talent);
}

/**
 * Fetches counts for total and screened candidates for a specific job.
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
    console.error("[data] fetchCandidateCounts failed:", error);
    return { total: 0, screened: 0 };
  }
}

/**
 * Total pages for the candidates table inside a job detail view.
 */
export async function fetchTalentPages(
  jobId: string,
  query: string,
): Promise<number> {
  try {
    const db = await getDb();
    const filter: Filter<Document> = { job_id: jobId };

    if (query) {
      filter.$or = [
        { first_name: { $regex: query, $options: "i" } },
        { last_name: { $regex: query, $options: "i" } },
        { headline: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
      ];
    }

    const count = await db.collection("candidates").countDocuments(filter);
    return Math.ceil(count / TABLE_ITEMS_PER_PAGE);
  } catch (error) {
    console.error("[data] fetchTalentPages failed:", error);
    throw new Error("Failed to fetch total number of candidates.");
  }
}

// ============================================================
// UPLOADS
// ============================================================

/**
 * Fetches the resume parsing and upload logs for a specific job.
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
    console.error("[data] fetchUploadHistory failed:", error);
    return [];
  }
}

// ============================================================
// RESULTS / SCREENED CANDIDATES (cross-job)
// ============================================================

/**
 * Fetches "done" jobs with their candidate counts, for the Results page table.
 */
export async function fetchResults(
  userId: string,
  query: string,
  currentPage: number,
): Promise<ResultRow[]> {
  try {
    const skip = (currentPage - 1) * TABLE_ITEMS_PER_PAGE;
    const db = await getDb();
    const filter: Filter<Document> = { user_id: userId, status: "done" };

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
    console.error("[data] fetchResults failed:", error);
    return [];
  }
}

/**
 * Builds the omni-search filter for the global Results page.
 * Searches name, email, strengths, role; if numeric, also rank/score.
 */
function buildScreenedSearchFilter(
  validJobIds: string[],
  query: string,
  userJobs: Array<{ _id: ObjectId; role: string }>,
): Filter<Document> {
  const matchQuery: Filter<Document> = {
    job_id: { $in: validJobIds },
    screening: { $exists: true, $ne: null },
  };

  if (!query) return matchQuery;

  const orConditions: Filter<Document>[] = [
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
  return matchQuery;
}

/**
 * Omni-search fetcher for the Global AI Results page.
 * Returns screened candidates merged with their job_title.
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

    const userJobsFilter: Filter<Document> = { user_id: userId };
    if (jobId) {
      userJobsFilter._id = new ObjectId(jobId);
    }

    const userJobs = (await db
      .collection("jobs")
      .find(userJobsFilter)
      .toArray()) as unknown as Array<{ _id: ObjectId; role: string }>;

    if (userJobs.length === 0) return [];

    const validJobIds = userJobs.map((j) => j._id.toString());
    const jobTitleMap: Record<string, string> = {};
    for (const job of userJobs) {
      jobTitleMap[job._id.toString()] = job.role;
    }

    const matchQuery = buildScreenedSearchFilter(validJobIds, query, userJobs);

    const candidates = await db
      .collection("candidates")
      .find(matchQuery)
      .sort({ "screening.rank": 1 })
      .skip(skip)
      .limit(TABLE_ITEMS_PER_PAGE)
      .toArray();

    return candidates.map((c) => ({
      ...mapCandidate(c),
      job_title: jobTitleMap[c.job_id] ?? "Unknown Job",
    }));
  } catch (error) {
    console.error("[data] fetchScreenedCandidates failed:", error);
    throw new Error("Failed to fetch AI screened candidates.");
  }
}

/**
 * Calculates total pages and total candidate count for the Global Results page.
 */
export async function fetchResultPages(
  userId: string,
  query: string,
  jobId?: string,
): Promise<{ totalPages: number; totalCount: number }> {
  try {
    const db = await getDb();

    const userJobsFilter: Filter<Document> = { user_id: userId };
    if (jobId) {
      userJobsFilter._id = new ObjectId(jobId);
    }

    const userJobs = (await db
      .collection("jobs")
      .find(userJobsFilter)
      .toArray()) as unknown as Array<{ _id: ObjectId; role: string }>;

    if (userJobs.length === 0) return { totalPages: 0, totalCount: 0 };

    const validJobIds = userJobs.map((j) => j._id.toString());
    const matchQuery = buildScreenedSearchFilter(validJobIds, query, userJobs);

    const count = await db.collection("candidates").countDocuments(matchQuery);

    return {
      totalPages: Math.ceil(count / TABLE_ITEMS_PER_PAGE),
      totalCount: count,
    };
  } catch (error) {
    console.error("[data] fetchResultPages failed:", error);
    throw new Error("Failed to fetch screened results pages.");
  }
}
