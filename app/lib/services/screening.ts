import { GoogleGenAI } from "@google/genai";

import type {
  ParsedApplicant,
  ScreeningResult,
} from "@/app/lib/schemas/candidate";

export type ScreeningRequest = {
  job_title: string;
  job_description: string;
  required_skills: string[];
  experience_level: string;
  education_requirement?: string;
  top_n: number;
};

export type ScreeningResponse = {
  job_title: string;
  total_evaluated: number;
  shortlist: (ScreeningResult & {
    name: string;
    email: string | null;
  })[];
  screening_summary: string;
};

// Fixed default weights — documented in docs/scoring_weights.md
export const SCORING_WEIGHTS = {
  work_experience: 0.3,
  skills_match: 0.25,
  projects_portfolio: 0.15,
  education: 0.12,
  certifications: 0.1,
  other: 0.08,
} as const;

const SYSTEM_PROMPT = `You are an expert recruitment AI assistant. Your job is to evaluate \
job applicants against a job description and produce a structured, fair, and transparent \
ranking.

For each candidate, you will:
1. Extract structured information from their resume/profile data.
2. Score them across 6 categories (0-100 each):
   - work_experience (30% weight): Relevance of roles, responsibilities, years of experience
   - skills_match (25% weight): How well their skills match the job requirements
   - projects_portfolio (15% weight): Relevant projects, contributions, demonstrable impact
   - education (12% weight): Degree level, field relevance, institution quality
   - certifications (10% weight): Professional certifications, courses, ongoing learning
   - other (8% weight): Extracurriculars, leadership, volunteering, soft skills, cultural fit
3. Calculate the final_score as the weighted average using the weights above.
4. Rank all candidates by final_score (highest first).
5. For each candidate in the shortlist, provide:
   - strengths: 2-4 specific strengths with evidence from their profile
   - gaps: 1-3 specific gaps or risks relative to the job
   - recommendation: 1-2 sentence recruiter-friendly summary

IMPORTANT RULES:
- Be objective and evidence-based. Cite specifics from the candidate's data.
- If a candidate has no data for a category, score it 0.
- If a candidate only has raw resume text (no structured data), extract what you can.
- Return ONLY valid JSON matching the schema below. No markdown, no explanation outside JSON.

OUTPUT JSON SCHEMA:
{
  "shortlist": [
    {
      "name": "string",
      "email": "string or null",
      "scores": {
        "work_experience": 0-100,
        "skills_match": 0-100,
        "projects_portfolio": 0-100,
        "education": 0-100,
        "certifications": 0-100,
        "other": 0-100
      },
      "final_score": 0-100,
      "rank": 1,
      "strengths": ["string"],
      "gaps": ["string"],
      "recommendation": "string"
    }
  ],
  "total_evaluated": number,
  "screening_summary": "string"
}`;

export async function screenCandidates(
  job: ScreeningRequest,
  applicants: ParsedApplicant[],
): Promise<ScreeningResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const ai = new GoogleGenAI({ apiKey });

  const userPrompt = buildUserPrompt(job, applicants);

  const response = await ai.models.generateContent({
    model,
    contents: [
      { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
      {
        role: "model",
        parts: [{ text: "Understood. Send me the job and candidates." }],
      },
      { role: "user", parts: [{ text: userPrompt }] },
    ],
    config: {
      responseMimeType: "application/json",
      temperature: 0.2,
    },
  });

  const text = response.text || "";
  const data = JSON.parse(text);

  return {
    job_title: job.job_title,
    total_evaluated: data.total_evaluated || applicants.length,
    shortlist: data.shortlist || [],
    screening_summary: data.screening_summary || "",
  };
}

function buildUserPrompt(
  job: ScreeningRequest,
  applicants: ParsedApplicant[],
): string {
  const lines: string[] = [
    "## JOB DETAILS",
    `**Title:** ${job.job_title}`,
    `**Description:** ${job.job_description}`,
    `**Required Skills:** ${job.required_skills.join(", ")}`,
    `**Experience Level:** ${job.experience_level}`,
    `**Education Requirement:** ${job.education_requirement || ""}`,
    "",
    `Return the top ${job.top_n} candidates.`,
    "",
    `## CANDIDATES (${applicants.length} total)`,
    "",
  ];

  applicants.forEach((a, i) => {
    lines.push(`### Candidate ${i + 1}`);
    lines.push(`**Name:** ${a.name}`);
    if (a.email) lines.push(`**Email:** ${a.email}`);

    if (a.skills.length > 0) {
      lines.push(`**Skills:** ${a.skills.join(", ")}`);
    }
    if (a.experience_years !== null) {
      lines.push(`**Years of Experience:** ${a.experience_years}`);
    }
    if (a.experience_details.length > 0) {
      lines.push(`**Experience:** ${a.experience_details.join("; ")}`);
    }
    if (a.education.length > 0) {
      lines.push(`**Education:** ${a.education.join("; ")}`);
    }
    if (a.summary) {
      lines.push(`**Summary:** ${a.summary}`);
    }
    if (a.raw_resume_text) {
      lines.push("");
      lines.push(`**Full Resume:**\n${a.raw_resume_text}`);
    }

    lines.push("");
  });

  return lines.join("\n");
}
