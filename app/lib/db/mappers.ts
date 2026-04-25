// Centralized MongoDB document → typed object mappers.
// Keep these in sync with the schemas in app/lib/schemas/.

import type { Document } from "mongodb";

import type { CandidateDocument } from "@/app/lib/schemas/candidate";
import type { JobDocument, JobStatusValue } from "@/app/lib/schemas/job";

export function mapJob(doc: Document): JobDocument {
  return {
    _id: doc._id.toString(),
    user_id: doc.user_id,
    role: doc.role,
    company: doc.company,
    requirements: doc.requirements ?? null,
    skills: doc.skills ?? null,
    experience: doc.experience ?? null,
    status: doc.status as JobStatusValue,
    created_at: doc.created_at,
  };
}

export function mapCandidate(doc: Document): CandidateDocument {
  return {
    _id: doc._id.toString(),
    job_id: doc.job_id,
    first_name: doc.first_name ?? "",
    last_name: doc.last_name ?? "",
    email: doc.email,
    headline: doc.headline ?? "",
    bio: doc.bio ?? null,
    location: doc.location ?? "",
    skills: doc.skills ?? [],
    languages: doc.languages ?? null,
    experience: doc.experience ?? [],
    education: doc.education ?? [],
    certifications: doc.certifications ?? null,
    projects: doc.projects ?? [],
    availability: doc.availability,
    socialLinks: doc.socialLinks ?? null,
    source: doc.source ?? "json",
    raw_resume_text: doc.raw_resume_text ?? null,
    screening: doc.screening ?? null,
    created_at: doc.created_at,
  };
}
