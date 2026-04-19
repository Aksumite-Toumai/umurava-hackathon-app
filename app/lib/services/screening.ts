import { GoogleGenAI } from "@google/genai";

import type {
  CandidateDocument,
  ScreeningResult,
  TalentProfile,
} from "@/app/lib/schemas/candidate";

export type ScreeningRequest = {
  job_title: string;
  job_description: string;
  required_skills: string[];
  experience_level: string;
  education_requirement?: string;
  top_n: number;
};

// What Gemini returns per candidate
export type EnrichedCandidate = ScreeningResult & {
  email: string;
  // Optional schema enrichment from raw resume text (PDFs)
  enriched_profile?: Partial<TalentProfile>;
};

export type ScreeningResponse = {
  job_title: string;
  total_evaluated: number;
  shortlist: EnrichedCandidate[];
  screening_summary: string;
};

// Fixed default weights — see docs/scoring_weights.md
export const SCORING_WEIGHTS = {
  work_experience: 0.3,
  skills_match: 0.25,
  projects_portfolio: 0.15,
  education: 0.12,
  certifications: 0.1,
  other: 0.08,
} as const;

const SYSTEM_PROMPT = `You are an expert recruitment AI assistant. You evaluate job \
applicants against a job description and produce a structured, fair, and transparent ranking \
that follows the Umurava Talent Profile schema.

For each candidate, you will:

1. If the candidate has only raw resume text (no structured data), EXTRACT structured fields \
into the Talent Profile schema. If they already have full structured data, use it as-is.

2. Score the candidate across 6 categories (0-100 each):
   - work_experience (30% weight): Relevance of roles, responsibilities, years of experience
   - skills_match (25% weight): How well their skills match the job requirements
   - projects_portfolio (15% weight): Relevant projects, contributions, demonstrable impact
   - education (12% weight): Degree level, field relevance, institution quality
   - certifications (10% weight): Professional certifications, courses, ongoing learning
   - other (8% weight): Extracurriculars, leadership, volunteering, soft skills, cultural fit

3. Compute final_score = weighted average using the weights above.
4. Rank all candidates by final_score (highest first).
5. For each candidate, provide:
   - strengths: 2-4 specific strengths with evidence
   - gaps: 1-3 specific gaps or risks vs. the job
   - recommendation: 1-2 sentence recruiter-friendly summary

RULES:
- Be objective and evidence-based. Cite specifics from the candidate's data.
- If a candidate has no data for a category, score it 0.
- Field naming MUST match the Talent Profile schema EXACTLY (including spaces and case):
  "Start Date", "End Date", "Is Current", "Field of Study", "Start Year", "End Year",
  "Issue Date", "yearsOfExperience", "socialLinks".
- Skill levels must be one of: Beginner, Intermediate, Advanced, Expert.
- Language proficiency must be one of: Basic, Conversational, Fluent, Native.
- Availability status must be one of: Available, Open to Opportunities, Not Available.
- Availability type must be one of: Full-time, Part-time, Contract.
- Return ONLY valid JSON. No markdown fences, no commentary.

OUTPUT JSON SHAPE:
{
  "shortlist": [
    {
      "email": "string (use the candidate's email exactly as provided)",
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
      "recommendation": "string",
      "enriched_profile": {
        // Only include for candidates whose data was raw text (PDF) and you extracted it.
        // For already-structured candidates, omit this field.
        // Use Talent Profile schema field names exactly.
        "first_name": "string",
        "last_name": "string",
        "headline": "string",
        "bio": "string",
        "location": "string",
        "skills": [{"name": "...", "level": "Intermediate", "yearsOfExperience": 3}],
        "experience": [{
          "company": "...", "role": "...",
          "Start Date": "YYYY-MM", "End Date": "YYYY-MM | Present",
          "description": "...", "technologies": [...], "Is Current": true
        }],
        "education": [{
          "institution": "...", "degree": "...",
          "Field of Study": "...", "Start Year": 2020, "End Year": 2024
        }],
        "projects": [...], "certifications": [...]
      }
    }
  ],
  "total_evaluated": number,
  "screening_summary": "string"
}`;

export async function screenCandidates(
  job: ScreeningRequest,
  candidates: CandidateDocument[],
): Promise<ScreeningResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const ai = new GoogleGenAI({ apiKey });

  const userPrompt = buildUserPrompt(job, candidates);

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
    total_evaluated: data.total_evaluated || candidates.length,
    shortlist: data.shortlist || [],
    screening_summary: data.screening_summary || "",
  };
}

function buildUserPrompt(
  job: ScreeningRequest,
  candidates: CandidateDocument[],
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
    `## CANDIDATES (${candidates.length} total)`,
    "",
  ];

  candidates.forEach((c, i) => {
    lines.push(`### Candidate ${i + 1}`);
    lines.push(`**Email:** ${c.email}`);

    if (c.raw_resume_text) {
      // PDF source — let Gemini extract everything
      lines.push("**Source:** raw resume markdown (extract structured fields)");
      lines.push("");
      lines.push("**Resume:**");
      lines.push(c.raw_resume_text);
    } else {
      // Structured profile — feed full talent profile JSON
      const profileForPrompt = {
        first_name: c.first_name,
        last_name: c.last_name,
        headline: c.headline,
        bio: c.bio,
        location: c.location,
        skills: c.skills,
        languages: c.languages,
        experience: c.experience,
        education: c.education,
        certifications: c.certifications,
        projects: c.projects,
        availability: c.availability,
        socialLinks: c.socialLinks,
      };
      lines.push("**Source:** structured profile");
      lines.push("```json");
      lines.push(JSON.stringify(profileForPrompt, null, 2));
      lines.push("```");
    }

    lines.push("");
  });

  return lines.join("\n");
}
