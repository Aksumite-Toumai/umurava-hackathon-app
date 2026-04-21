import Papa from "papaparse";
import * as XLSX from "xlsx";

import type { TalentProfile } from "@/app/lib/schemas/candidate";
import type { ParsedCandidate, FileParseResult } from "./file-parser";

// Common column name mappings (lowercase) → our field names
const COLUMN_MAP: Record<string, string> = {
  // Name
  "first name": "first_name",
  first_name: "first_name",
  firstname: "first_name",
  "last name": "last_name",
  last_name: "last_name",
  lastname: "last_name",
  surname: "last_name",
  name: "full_name",
  "full name": "full_name",
  full_name: "full_name",
  "candidate name": "full_name",

  // Contact
  email: "email",
  "email address": "email",
  "e-mail": "email",

  // Headline / summary / bio
  headline: "headline",
  title: "headline",
  "job title": "headline",
  bio: "bio",
  about: "bio",
  summary: "bio",
  profile: "bio",

  // Location
  location: "location",
  city: "location",

  // Skills (free text comma-separated)
  skills: "skills",
  "technical skills": "skills",
  competencies: "skills",

  // Resume / CV link
  cv: "resume_url",
  resume: "resume_url",
  "cv url": "resume_url",
  cv_url: "resume_url",
  "resume url": "resume_url",
  resume_url: "resume_url",
  "cv link": "resume_url",
  cv_link: "resume_url",
  "resume link": "resume_url",
  resume_link: "resume_url",
  link: "resume_url",
};

export function parseCsv(
  content: string,
): Pick<FileParseResult, "candidates" | "errors"> {
  const parsed = Papa.parse<Record<string, string>>(content, {
    header: true,
    skipEmptyLines: true,
  });

  if (parsed.errors.length > 0 && !parsed.data.length) {
    return {
      candidates: [],
      errors: parsed.errors.map((e) => e.message),
    };
  }

  return rowsToCandidates(parsed.data, "csv");
}

export function parseExcel(
  buffer: Buffer,
): Pick<FileParseResult, "candidates" | "errors"> {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return { candidates: [], errors: ["No sheets found."] };

  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
  });

  const stringRows: Record<string, string>[] = rows.map((r) => {
    const entries = Object.entries(r).map(([k, v]) => [k, String(v ?? "")]);
    return Object.fromEntries(entries) as Record<string, string>;
  });

  return rowsToCandidates(stringRows, "xlsx");
}

function rowsToCandidates(
  rows: Record<string, string>[],
  source: "csv" | "xlsx",
): Pick<FileParseResult, "candidates" | "errors"> {
  const errors: string[] = [];

  if (rows.length === 0) {
    return { candidates: [], errors: ["File is empty or has no data rows."] };
  }

  const columns = Object.keys(rows[0]);
  const fieldMap = mapColumns(columns);

  if (
    !Object.values(fieldMap).includes("email") &&
    !Object.values(fieldMap).includes("full_name") &&
    !Object.values(fieldMap).includes("first_name")
  ) {
    return {
      candidates: [],
      errors: [
        `Could not find a 'name' or 'email' column. Available: ${columns.join(", ")}`,
      ],
    };
  }

  const candidates: ParsedCandidate[] = [];

  rows.forEach((row, idx) => {
    try {
      const { profile, resume_url } = rowToProfile(row, fieldMap);
      candidates.push({
        profile,
        source,
        raw_resume_text: null,
        resume_url: resume_url ?? null,
      });
    } catch (e) {
      errors.push(
        `Row ${idx + 2}: ${e instanceof Error ? e.message : "unknown"}`,
      );
    }
  });

  return { candidates, errors };
}

function mapColumns(columns: string[]): Record<string, string> {
  const mapped: Record<string, string> = {};
  for (const col of columns) {
    const normalized = col.trim().toLowerCase();
    if (normalized in COLUMN_MAP) {
      mapped[col] = COLUMN_MAP[normalized];
    }
  }
  return mapped;
}

function rowToProfile(
  row: Record<string, string>,
  fieldMap: Record<string, string>,
): { profile: TalentProfile; resume_url: string | null } {
  const raw: Record<string, string> = {};

  for (const [col, field] of Object.entries(fieldMap)) {
    const value = (row[col] ?? "").toString().trim();
    if (!value) continue;
    raw[field] = value;
  }

  let first_name = raw.first_name ?? "";
  let last_name = raw.last_name ?? "";
  if (raw.full_name && !first_name && !last_name) {
    const parts = raw.full_name.split(/\s+/);
    first_name = parts[0] ?? "";
    last_name = parts.slice(1).join(" ");
  }

  const email = raw.email;
  if (!email) throw new Error("Missing email");

  // Skills as objects (default to Intermediate / 0 yoe — Gemini can refine later)
  const skills = (raw.skills ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((name) => ({
      name,
      level: "Intermediate" as const,
      yearsOfExperience: 0,
    }));

  return {
    profile: {
      first_name,
      last_name,
      email,
      headline: raw.headline ?? "",
      bio: raw.bio ?? null,
      location: raw.location ?? "",
      skills,
      languages: null,
      experience: [],
      education: [],
      certifications: null,
      projects: [],
      availability: undefined,
      socialLinks: null,
    },
    resume_url: raw.resume_url || null,
  };
}
