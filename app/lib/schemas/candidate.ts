import { z } from "zod";

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

export type CandidateDocument = {
  _id: string;
  job_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  skills: string[];
  experience_years: number | null;
  experience_details: string[];
  education: string[];
  summary: string | null;
  raw_resume_text: string | null;
  screening: ScreeningResult | null;
  created_at: string;
};

export type ParsedApplicant = {
  name: string;
  email: string | null;
  phone: string | null;
  skills: string[];
  experience_years: number | null;
  experience_details: string[];
  education: string[];
  summary: string | null;
  raw_resume_text: string | null;
};
