import { parsePdf } from "./pdf-parser";
import { parseCsv, parseExcel } from "./spreadsheet-parser";
import { parseJsonProfiles } from "./json-parser";
import type {
  CandidateSource,
  TalentProfile,
} from "@/app/lib/schemas/candidate";

export type ParsedCandidate = {
  profile: TalentProfile;
  source: CandidateSource;
  raw_resume_text: string | null;
};

export type FileParseResult = {
  candidates: ParsedCandidate[];
  errors: string[];
  fileType: CandidateSource | "unknown";
};

export async function parseUploadedFile(file: File): Promise<FileParseResult> {
  const filename = file.name;
  const ext = filename.split(".").pop()?.toLowerCase() || "";

  if (ext === "pdf") {
    try {
      const resume = await parsePdf(file, filename);
      return {
        fileType: "pdf",
        candidates: [
          {
            profile: {
              first_name: "",
              last_name: filename.replace(/\.pdf$/i, ""),
              email: resume.email ?? `unknown-${Date.now()}@no-email.local`,
              headline: "",
              bio: null,
              location: "",
              skills: [],
              languages: null,
              experience: [],
              education: [],
              certifications: null,
              projects: [],
              availability: undefined,
              socialLinks: null,
            },
            source: "pdf",
            raw_resume_text: resume.markdown,
          },
        ],
        errors: [],
      };
    } catch (e) {
      return {
        fileType: "pdf",
        candidates: [],
        errors: [
          `PDF parsing error: ${e instanceof Error ? e.message : "unknown"}`,
        ],
      };
    }
  }

  if (ext === "csv") {
    const content = await file.text();
    const result = parseCsv(content);
    return { ...result, fileType: "csv" };
  }

  if (ext === "xlsx" || ext === "xls") {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const result = parseExcel(buffer);
    return { ...result, fileType: "xlsx" };
  }

  if (ext === "json") {
    try {
      const content = await file.text();
      const result = parseJsonProfiles(content);
      return { ...result, fileType: "json" };
    } catch (e) {
      return {
        fileType: "json",
        candidates: [],
        errors: [
          `JSON parsing error: ${e instanceof Error ? e.message : "unknown"}`,
        ],
      };
    }
  }

  return {
    fileType: "unknown",
    candidates: [],
    errors: [`Unsupported file type: .${ext}`],
  };
}
