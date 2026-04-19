import Papa from "papaparse";
import * as XLSX from "xlsx";

import type { ParsedApplicant } from "@/app/lib/schemas/candidate";

// Common column name mappings (lowercase) → our field names
const COLUMN_MAP: Record<string, string> = {
  name: "name",
  "full name": "name",
  full_name: "name",
  "candidate name": "name",
  applicant: "name",
  email: "email",
  "email address": "email",
  "e-mail": "email",
  phone: "phone",
  "phone number": "phone",
  mobile: "phone",
  contact: "phone",
  skills: "skills",
  "technical skills": "skills",
  competencies: "skills",
  experience: "experience_years",
  "years of experience": "experience_years",
  "experience (years)": "experience_years",
  yoe: "experience_years",
  education: "education",
  degree: "education",
  qualification: "education",
  summary: "summary",
  about: "summary",
  bio: "summary",
  profile: "summary",
};

export type ParseResult = {
  applicants: ParsedApplicant[];
  errors: string[];
};

export function parseCsv(content: string): ParseResult {
  const parsed = Papa.parse<Record<string, string>>(content, {
    header: true,
    skipEmptyLines: true,
  });

  if (parsed.errors.length > 0 && !parsed.data.length) {
    return { applicants: [], errors: parsed.errors.map((e) => e.message) };
  }

  return rowsToApplicants(parsed.data);
}

export function parseExcel(buffer: Buffer): ParseResult {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return { applicants: [], errors: ["No sheets found."] };

  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
  });

  const stringRows: Record<string, string>[] = rows.map((r) => {
    const entries = Object.entries(r).map(([k, v]) => [k, String(v ?? "")]);
    return Object.fromEntries(entries) as Record<string, string>;
  });

  return rowsToApplicants(stringRows);
}

function rowsToApplicants(rows: Record<string, string>[]): ParseResult {
  const errors: string[] = [];

  if (rows.length === 0) {
    return { applicants: [], errors: ["File is empty or has no data rows."] };
  }

  const columns = Object.keys(rows[0]);
  const fieldMap = mapColumns(columns);

  if (!Object.values(fieldMap).includes("name")) {
    return {
      applicants: [],
      errors: [
        `Could not find a 'name' column. Available: ${columns.join(", ")}`,
      ],
    };
  }

  const applicants: ParsedApplicant[] = [];

  rows.forEach((row, idx) => {
    try {
      applicants.push(rowToApplicant(row, fieldMap));
    } catch (e) {
      errors.push(
        `Row ${idx + 2}: ${e instanceof Error ? e.message : "unknown error"}`,
      );
    }
  });

  return { applicants, errors };
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

function rowToApplicant(
  row: Record<string, string>,
  fieldMap: Record<string, string>,
): ParsedApplicant {
  const raw: Record<string, unknown> = {};

  for (const [col, field] of Object.entries(fieldMap)) {
    const rawValue = row[col];
    if (rawValue === undefined || rawValue === null || rawValue === "") continue;

    const value = String(rawValue).trim();
    if (!value) continue;

    if (field === "skills") {
      raw[field] = value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (field === "education") {
      raw[field] = [value];
    } else if (field === "experience_years") {
      const num = parseFloat(value);
      if (!isNaN(num)) {
        raw[field] = num;
      } else {
        raw.experience_details = [value];
      }
    } else {
      raw[field] = value;
    }
  }

  const name = raw.name;
  if (!name || typeof name !== "string") {
    throw new Error("Missing or invalid name");
  }

  return {
    name,
    email: typeof raw.email === "string" ? raw.email : null,
    phone: typeof raw.phone === "string" ? raw.phone : null,
    skills: Array.isArray(raw.skills) ? (raw.skills as string[]) : [],
    experience_years:
      typeof raw.experience_years === "number" ? raw.experience_years : null,
    experience_details: Array.isArray(raw.experience_details)
      ? (raw.experience_details as string[])
      : [],
    education: Array.isArray(raw.education) ? (raw.education as string[]) : [],
    summary: typeof raw.summary === "string" ? raw.summary : null,
    raw_resume_text: null,
  };
}
