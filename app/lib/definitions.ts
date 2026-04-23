import { ScreeningResult } from "./schemas/candidate";

// User Types
export type User = {
  id: string;
  username: string;
  email: string;
};

export type Job = {
  user_id: string;
  role: string;
  company: string;
  requirements?: string | null;
  skills?: string | null;
  experience?: string | null;
  created_at?: string | null;
};

export type JobField = {
  role: string;
  company: string;
  requirements: string;
  skills: string;
  experience: string;
};

export type Talent = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  headline: string;
  bio?: string | null;
  location: string;
  rank: number;
  skills: Array<{
    name: string;
    level: "Beginner" | "Intermediate" | "Advanced" | "Expert";
    yearsOfExperience: number;
  }>;
  languages?: Array<{
    name: string;
    level: "Basic" | "Conversational" | "Fluent" | "Native";
  }> | null;
  experience: Array<{
    company: string;
    role: string;
    "Start Date": string;
    "End Date": string | "Present";
    description: string;
    technologies: string[];
    "Is Current": boolean;
  }>;
  education: Array<{
    institution: string;
    degree: string;
    "Field of Study": string;
    "Start Year": number;
    "End Year": number;
  }>;
  certifications?: Array<{
    name: string;
    issuer: string;
    "Issue Date": string;
  }> | null;
  projects: Array<{
    name: string;
    description: string;
    technologies: string[];
    role: string;
    link?: string;
    "Start Date": string;
    "End Date": string;
  }>;
  availability: {
    status: "Available" | "Open to Opportunities" | "Not Available";
    type: "Full-time" | "Part-time" | "Contract";
    "Start Date"?: string;
  };
  social_links?: {
    linkedin?: string;
    github?: string;
    portfolio?: string;
  } | null;
  job_id: string;
  ai_generated_score?: number | null;
  portofolio_ratings?: Record<string, number> | null;
  personality_insights?: string | null;
  created_at?: string | null;
};

// ==========================================
// DASHBOARD & CHART TYPES
// ==========================================
export type DashboardStats = {
  totalJobs: number;
  pendingJobs: number;
  doneJobs: number;
  totalCandidates: number;
  screenedCandidates: number;
};

export type ChartData = {
  jobTitle: string;
  candidates: number;
  id: string;
};

export type TopTalent = {
  id: string;
  name: string;
  email: string;
  screening: ScreeningResult;
  job_applied_for: string;
};

export type UploadRecord = {
  _id: string;
  filename: string;
  file_type: string;
  status: "success" | "partial" | "failed";
  candidates_parsed: number;
  errors: string[];
  uploaded_at: string;
};

export type ResultRow = {
  job_id: string;
  role: string;
  company: string;
  created_at: string;
  status: string;
  total_talent: number;
};

export type FilterJob = {
  _id: string;
  role: string;
};
