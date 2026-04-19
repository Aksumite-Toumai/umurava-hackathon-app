import { parsePdf } from "./pdf-parser";
import { parseCsv, parseExcel } from "./spreadsheet-parser";
import type { ParsedApplicant } from "@/app/lib/schemas/candidate";

export type FileParseResult = {
  applicants: ParsedApplicant[];
  errors: string[];
  fileType: "pdf" | "spreadsheet" | "unknown";
};

export async function parseUploadedFile(
  file: File,
): Promise<FileParseResult> {
  const filename = file.name;
  const ext = filename.split(".").pop()?.toLowerCase() || "";

  if (ext === "pdf") {
    try {
      const resume = await parsePdf(file, filename);
      return {
        fileType: "pdf",
        applicants: [
          {
            name: resume.filename,
            email: resume.email,
            phone: null,
            skills: [],
            experience_years: null,
            experience_details: [],
            education: [],
            summary: null,
            raw_resume_text: resume.markdown,
          },
        ],
        errors: [],
      };
    } catch (e) {
      return {
        fileType: "pdf",
        applicants: [],
        errors: [
          `PDF parsing error: ${e instanceof Error ? e.message : "unknown"}`,
        ],
      };
    }
  }

  if (ext === "csv") {
    const content = await file.text();
    const result = parseCsv(content);
    return { ...result, fileType: "spreadsheet" };
  }

  if (ext === "xlsx" || ext === "xls") {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const result = parseExcel(buffer);
    return { ...result, fileType: "spreadsheet" };
  }

  return {
    fileType: "unknown",
    applicants: [],
    errors: [`Unsupported file type: .${ext}`],
  };
}
