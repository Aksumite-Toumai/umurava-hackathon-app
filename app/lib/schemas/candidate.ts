import { z } from "zod";

// ============================================================
// Umurava Talent Profile Schema
// Field naming follows the official spec exactly, including
// the mixed conventions ("Start Date", "yearsOfExperience").
// ============================================================

export const SkillLevelEnum = z.enum([
  "Beginner",
  "Intermediate",
  "Advanced",
  "Expert",
]);
export type SkillLevel = z.infer<typeof SkillLevelEnum>;

export const LanguageProficiencyEnum = z.enum([
  "Basic",
  "Conversational",
  "Fluent",
  "Native",
]);
export type LanguageProficiency = z.infer<typeof LanguageProficiencyEnum>;

export const AvailabilityStatusEnum = z.enum([
  "Available",
  "Open to Opportunities",
  "Not Available",
]);
export const AvailabilityTypeEnum = z.enum([
  "Full-time",
  "Part-time",
  "Contract",
]);

export const SkillSchema = z.object({
  name: z.string(),
  level: SkillLevelEnum,
  yearsOfExperience: z.number().min(0),
});

export const LanguageSchema = z.object({
  name: z.string(),
  proficiency: LanguageProficiencyEnum,
});

export const ExperienceSchema = z.object({
  company: z.string(),
  role: z.string(),
  "Start Date": z.string(),
  "End Date": z.string(),
  description: z.string(),
  technologies: z.array(z.string()).default([]),
  "Is Current": z.boolean().default(false),
});

export const EducationSchema = z.object({
  institution: z.string(),
  degree: z.string(),
  "Field of Study": z.string(),
  "Start Year": z.number().int(),
  "End Year": z.number().int(),
});

export const CertificationSchema = z.object({
  name: z.string(),
  issuer: z.string(),
  "Issue Date": z.string(),
});

export const ProjectSchema = z.object({
  name: z.string(),
  description: z.string(),
  technologies: z.array(z.string()).default([]),
  role: z.string(),
  link: z.string().optional(),
  "Start Date": z.string(),
  "End Date": z.string(),
});

export const AvailabilitySchema = z.object({
  status: AvailabilityStatusEnum,
  type: AvailabilityTypeEnum,
  "Start Date": z.string().optional(),
});

export const SocialLinksSchema = z
  .object({
    linkedin: z.string().optional(),
    github: z.string().optional(),
    portfolio: z.string().optional(),
  })
  .passthrough();

// The full Talent Profile (input format from Umurava platform)
export const TalentProfileSchema = z.object({
  first_name: z.string(),
  last_name: z.string(),
  email: z.string().email(),
  headline: z.string(),
  bio: z.string().optional().nullable(),
  location: z.string(),
  skills: z.array(SkillSchema).default([]),
  languages: z.array(LanguageSchema).optional().nullable(),
  experience: z.array(ExperienceSchema).default([]),
  education: z.array(EducationSchema).default([]),
  certifications: z.array(CertificationSchema).optional().nullable(),
  projects: z.array(ProjectSchema).default([]),
  availability: AvailabilitySchema.optional(),
  socialLinks: SocialLinksSchema.optional().nullable(),
});

export type TalentProfile = z.infer<typeof TalentProfileSchema>;
export type Skill = z.infer<typeof SkillSchema>;
export type Language = z.infer<typeof LanguageSchema>;
export type Experience = z.infer<typeof ExperienceSchema>;
export type Education = z.infer<typeof EducationSchema>;
export type Certification = z.infer<typeof CertificationSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type Availability = z.infer<typeof AvailabilitySchema>;
export type SocialLinks = z.infer<typeof SocialLinksSchema>;

// ============================================================
// Screening result (our extension)
// ============================================================

export const ScoreBreakdownSchema = z.object({
  work_experience: z.number().min(0).max(100),
  skills_match: z.number().min(0).max(100),
  projects_portfolio: z.number().min(0).max(100),
  education: z.number().min(0).max(100),
  certifications: z.number().min(0).max(100),
  other: z.number().min(0).max(100),
});

export const ScreeningResultSchema = z.object({
  rank: z.number().int(),
  final_score: z.number(),
  scores: ScoreBreakdownSchema,
  strengths: z.array(z.string()),
  gaps: z.array(z.string()),
  recommendation: z.string(),
});

export type ScoreBreakdown = z.infer<typeof ScoreBreakdownSchema>;
export type ScreeningResult = z.infer<typeof ScreeningResultSchema>;

// ============================================================
// Candidate document (what we store in MongoDB)
// = Talent Profile + our extensions
// ============================================================

export type CandidateSource = "json" | "pdf" | "csv" | "xlsx";

export type CandidateDocument = TalentProfile & {
  _id: string;
  job_id: string;
  source: CandidateSource;
  raw_resume_text: string | null; // only set for PDFs
  screening: ScreeningResult | null;
  created_at: string;
};

// ============================================================
// Helper: build a minimal TalentProfile (used by parsers when
// we only have partial data, e.g. CSV rows or unparsed PDFs)
// ============================================================

export function emptyTalentProfile(
  overrides: Partial<TalentProfile> & { email: string },
): TalentProfile {
  return {
    first_name: overrides.first_name ?? "",
    last_name: overrides.last_name ?? "",
    email: overrides.email,
    headline: overrides.headline ?? "",
    bio: overrides.bio ?? null,
    location: overrides.location ?? "",
    skills: overrides.skills ?? [],
    languages: overrides.languages ?? null,
    experience: overrides.experience ?? [],
    education: overrides.education ?? [],
    certifications: overrides.certifications ?? null,
    projects: overrides.projects ?? [],
    availability: overrides.availability,
    socialLinks: overrides.socialLinks ?? null,
  };
}
