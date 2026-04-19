import {
  TalentProfileSchema,
  type TalentProfile,
} from "@/app/lib/schemas/candidate";
import type { ParsedCandidate } from "./file-parser";

type Result = {
  candidates: ParsedCandidate[];
  errors: string[];
};

/**
 * Parse a JSON file containing one or more Talent Profiles.
 * Accepted shapes:
 *   - A single profile object: { first_name, last_name, ... }
 *   - An array of profile objects: [ {...}, {...} ]
 *   - An object with a `talents` or `profiles` array: { talents: [...] }
 */
export function parseJsonProfiles(content: string): Result {
  const errors: string[] = [];
  const candidates: ParsedCandidate[] = [];

  let raw: unknown;
  try {
    raw = JSON.parse(content);
  } catch (e) {
    return {
      candidates: [],
      errors: [`Invalid JSON: ${e instanceof Error ? e.message : "unknown"}`],
    };
  }

  const items = extractProfiles(raw);

  if (items.length === 0) {
    return {
      candidates: [],
      errors: [
        "No talent profiles found. Expected an object, an array, or { talents: [...] }.",
      ],
    };
  }

  items.forEach((item, idx) => {
    const parsed = TalentProfileSchema.safeParse(item);
    if (!parsed.success) {
      const issue = parsed.error.errors[0];
      errors.push(
        `Profile ${idx + 1}: ${issue.path.join(".")} — ${issue.message}`,
      );
      return;
    }
    candidates.push({
      profile: parsed.data as TalentProfile,
      source: "json",
      raw_resume_text: null,
    });
  });

  return { candidates, errors };
}

function extractProfiles(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;

  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.talents)) return obj.talents;
    if (Array.isArray(obj.profiles)) return obj.profiles;
    if (Array.isArray(obj.candidates)) return obj.candidates;
    // Single profile
    return [raw];
  }

  return [];
}
