// Fetches PDF resumes from public URLs.
// Handles common sharing-link formats (Google Drive/Docs, Dropbox).
// Uses 3-way PDF detection: MIME type, URL extension, and magic bytes.

const PDF_MIME_TYPES = [
  "application/pdf",
  "application/x-pdf",
  "application/acrobat",
  "application/vnd.pdf",
  "text/pdf",
  "text/x-pdf",
];

const DEFAULT_TIMEOUT_MS = 15_000;
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB safety cap

export type FetchedPdf = { blob: Blob; filename: string };
export type FetchError = { error: string };
export type FetchResult = FetchedPdf | FetchError;

export function isFetchError(r: FetchResult): r is FetchError {
  return "error" in r;
}

/**
 * Convert common sharing-link formats into direct download URLs.
 * Falls through unchanged if the URL doesn't match a known pattern.
 */
export function normalizeUrl(url: string): string {
  // Google Drive sharing → uc?export=download
  // Matches: /file/d/{ID}/view, /open?id={ID}, /uc?id={ID}
  const driveMatch = url.match(
    /drive\.google\.com\/(?:file\/d\/|open\?(?:.*&)?id=|uc\?(?:.*&)?id=)([\w-]+)/,
  );
  if (driveMatch) {
    return `https://drive.google.com/uc?export=download&id=${driveMatch[1]}`;
  }

  // Google Docs → export as PDF
  const docsMatch = url.match(/docs\.google\.com\/document\/d\/([\w-]+)/);
  if (docsMatch) {
    return `https://docs.google.com/document/d/${docsMatch[1]}/export?format=pdf`;
  }

  // Dropbox sharing — flip dl=0 to dl=1 (or append dl=1 if missing)
  if (url.includes("dropbox.com")) {
    if (url.includes("dl=0")) return url.replace("dl=0", "dl=1");
    if (!url.includes("dl=")) {
      const sep = url.includes("?") ? "&" : "?";
      return `${url}${sep}dl=1`;
    }
  }

  return url;
}

function isPdfMimeType(contentType: string | null): boolean {
  if (!contentType) return false;
  const lower = contentType.toLowerCase();
  return PDF_MIME_TYPES.some((t) => lower.includes(t));
}

function isPdfExtension(url: string): boolean {
  try {
    const u = new URL(url);
    return u.pathname.toLowerCase().endsWith(".pdf");
  } catch {
    return false;
  }
}

function hasPdfSignature(buffer: Buffer): boolean {
  // PDFs start with "%PDF-" (possibly preceded by whitespace/BOM)
  const head = buffer.subarray(0, 16).toString("latin1").trimStart();
  return head.startsWith("%PDF-");
}

function filenameFromUrl(url: string, fallback = "resume.pdf"): string {
  try {
    const u = new URL(url);
    const last = u.pathname.split("/").filter(Boolean).pop();
    if (last) return decodeURIComponent(last).split("?")[0] || fallback;
  } catch {
    /* ignore */
  }
  return fallback;
}

/**
 * Fetch a PDF from a public URL and return it as a Blob.
 * - Normalizes Drive/Docs/Dropbox links automatically.
 * - Verifies the response is actually a PDF (not an HTML viewer page).
 * - Has a timeout and a max-size cap.
 */
export async function fetchPdfFromUrl(
  rawUrl: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<FetchResult> {
  const url = normalizeUrl(rawUrl);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "umurava-hackathon-bot/1.0",
        Accept: "application/pdf, */*",
      },
    });

    if (!res.ok) {
      return { error: `HTTP ${res.status} ${res.statusText}` };
    }

    const contentLength = parseInt(res.headers.get("content-length") || "0", 10);
    if (contentLength && contentLength > MAX_BYTES) {
      return { error: `File too large (${(contentLength / 1024 / 1024).toFixed(1)}MB)` };
    }

    const contentType = res.headers.get("content-type");
    const arrayBuffer = await res.arrayBuffer();

    if (arrayBuffer.byteLength > MAX_BYTES) {
      return { error: `File too large (${(arrayBuffer.byteLength / 1024 / 1024).toFixed(1)}MB)` };
    }

    const buffer = Buffer.from(arrayBuffer);

    const isPdf =
      isPdfMimeType(contentType) ||
      isPdfExtension(url) ||
      isPdfExtension(rawUrl) ||
      hasPdfSignature(buffer);

    if (!isPdf) {
      return {
        error: `Not a PDF (content-type: ${contentType ?? "unknown"})`,
      };
    }

    return {
      blob: new Blob([buffer], { type: "application/pdf" }),
      filename: filenameFromUrl(rawUrl),
    };
  } catch (e) {
    if ((e as Error).name === "AbortError") {
      return { error: `Timeout after ${timeoutMs}ms` };
    }
    return { error: e instanceof Error ? e.message : "Unknown error" };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Fetch many PDFs in parallel with a concurrency cap.
 */
export async function fetchPdfsFromUrls(
  urls: string[],
  concurrency: number = 5,
): Promise<FetchResult[]> {
  const results: FetchResult[] = new Array(urls.length);
  let i = 0;

  async function worker() {
    while (i < urls.length) {
      const idx = i++;
      results[idx] = await fetchPdfFromUrl(urls[idx]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, urls.length) }, () => worker()),
  );

  return results;
}
