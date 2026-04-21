import { parsePdf } from "./pdf-parser";
import { parseCsv, parseExcel } from "./spreadsheet-parser";
import { parseJsonProfiles } from "./json-parser";
import { fetchPdfFromUrl, isFetchError } from "./url-fetcher";
import type {
  CandidateSource,
  TalentProfile,
} from "@/app/lib/schemas/candidate";

export type ParsedCandidate = {
  profile: TalentProfile;
  source: CandidateSource;
  raw_resume_text: string | null;
  /** Optional: a CV/resume URL extracted from a spreadsheet column. */
  resume_url?: string | null;
};

export type FileParseResult = {
  candidates: ParsedCandidate[];
  errors: string[];
  fileType: CandidateSource | "unknown";
};

const URL_FETCH_CONCURRENCY = 5;

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
    return enrichWithRemotePdfs({ ...result, fileType: "csv" });
  }

  if (ext === "xlsx" || ext === "xls") {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const result = parseExcel(buffer);
    return enrichWithRemotePdfs({ ...result, fileType: "xlsx" });
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

/**
 * For candidates with a `resume_url`, fetch the PDF in parallel,
 * pipe through LlamaParse, and store the markdown as raw_resume_text.
 * Errors are added to result.errors but don't fail the whole upload.
 */
async function enrichWithRemotePdfs(
  result: FileParseResult,
): Promise<FileParseResult> {
  const indices = result.candidates
    .map((c, i) => (c.resume_url ? i : -1))
    .filter((i) => i >= 0);

  if (indices.length === 0) return result;

  const errors = [...result.errors];

  // Worker pool with concurrency cap
  let cursor = 0;
  async function worker() {
    while (cursor < indices.length) {
      const idx = indices[cursor++];
      const cand = result.candidates[idx];
      const url = cand.resume_url!;

      const fetched = await fetchPdfFromUrl(url);
      if (isFetchError(fetched)) {
        errors.push(`${cand.profile.email} (${url}): ${fetched.error}`);
        continue;
      }

      try {
        const file = new File([fetched.blob], fetched.filename, {
          type: "application/pdf",
        });
        const resume = await parsePdf(file, fetched.filename);
        cand.raw_resume_text = resume.markdown;
      } catch (e) {
        errors.push(
          `${cand.profile.email} (${url}): LlamaParse failed — ${e instanceof Error ? e.message : "unknown"}`,
        );
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(URL_FETCH_CONCURRENCY, indices.length) }, () =>
      worker(),
    ),
  );

  return { ...result, errors };
}
