import type { Collection } from "mongodb";
import type { ParsedCandidate } from "./file-parser";

export type UpsertStats = {
  inserted: number;
  merged: number;
};

/**
 * Upsert candidates by {job_id, email}. If a candidate with the same email
 * already exists for this job, merge: prefer non-empty incoming fields and
 * keep raw_resume_text if either side has it.
 *
 * This makes multi-file uploads (CSV + PDFs, or repeat uploads) idempotent.
 */
export async function upsertCandidates(
  candidates: Collection,
  jobId: string,
  parsed: ParsedCandidate[],
): Promise<UpsertStats> {
  let inserted = 0;
  let merged = 0;
  const created_at = new Date().toISOString();

  for (const c of parsed) {
    const email = c.profile.email;
    if (!email) continue;

    const existing = await candidates.findOne({ job_id: jobId, email });

    if (!existing) {
      await candidates.insertOne({
        job_id: jobId,
        ...c.profile,
        source: c.source,
        raw_resume_text: c.raw_resume_text,
        screening: null,
        created_at,
      });
      inserted++;
      continue;
    }

    // Merge: keep richer of each field
    const update: Record<string, unknown> = {};

    const merge = <T>(key: string, incoming: T, current: T) => {
      if (isEmpty(current) && !isEmpty(incoming)) update[key] = incoming;
      // For arrays, prefer non-empty incoming if current is empty
      if (Array.isArray(incoming) && Array.isArray(current)) {
        if (current.length === 0 && incoming.length > 0) update[key] = incoming;
      }
    };

    merge("first_name", c.profile.first_name, existing.first_name);
    merge("last_name", c.profile.last_name, existing.last_name);
    merge("headline", c.profile.headline, existing.headline);
    merge("bio", c.profile.bio, existing.bio);
    merge("location", c.profile.location, existing.location);
    merge("skills", c.profile.skills, existing.skills);
    merge("languages", c.profile.languages, existing.languages);
    merge("experience", c.profile.experience, existing.experience);
    merge("education", c.profile.education, existing.education);
    merge("certifications", c.profile.certifications, existing.certifications);
    merge("projects", c.profile.projects, existing.projects);
    merge("availability", c.profile.availability, existing.availability);
    merge("socialLinks", c.profile.socialLinks, existing.socialLinks);

    // Resume text: prefer the longer of the two (PDF source usually wins)
    if (c.raw_resume_text) {
      const currentLen = (existing.raw_resume_text as string | null)?.length ?? 0;
      if (c.raw_resume_text.length > currentLen) {
        update.raw_resume_text = c.raw_resume_text;
      }
    }

    if (Object.keys(update).length > 0) {
      await candidates.updateOne({ _id: existing._id }, { $set: update });
    }
    merged++;
  }

  return { inserted, merged };
}

function isEmpty(v: unknown): boolean {
  if (v === null || v === undefined) return true;
  if (typeof v === "string" && v.trim() === "") return true;
  if (Array.isArray(v) && v.length === 0) return true;
  return false;
}
