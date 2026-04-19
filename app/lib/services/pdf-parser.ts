import { LlamaParse } from "llama-parse";

export type ParsedResume = {
  markdown: string;
  email: string | null;
  filename: string;
};

export async function parsePdf(
  file: Blob,
  filename: string,
): Promise<ParsedResume> {
  const apiKey = process.env.LLAMA_CLOUD_API_KEY;
  if (!apiKey) {
    throw new Error("LLAMA_CLOUD_API_KEY not set");
  }

  const parser = new LlamaParse({ apiKey });
  const result = await parser.parseFile(file);

  const markdown = result.markdown || "";
  const email = extractEmail(markdown);

  return { markdown, email, filename };
}

function extractEmail(text: string): string | null {
  const match = text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
  return match ? match[0].toLowerCase() : null;
}
