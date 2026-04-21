"use server";

import { AuthError } from "next-auth";
import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ObjectId } from "mongodb";
import bcrypt from "bcrypt";

import { signIn, auth } from "@/auth";
import { getDb } from "@/app/lib/db/mongodb";
import { JobStatus } from "@/app/lib/schemas/job";
import { parseUploadedFile } from "@/app/lib/services/file-parser";
import { upsertCandidates } from "@/app/lib/services/candidate-upsert";
import { logUpload } from "@/app/lib/services/upload-log";
import { screenCandidates } from "@/app/lib/services/screening";
import type { CandidateDocument } from "@/app/lib/schemas/candidate";

export async function authenticate(
  _prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn("credentials", formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return "Invalid credentials.";
        default:
          return "Something went wrong.";
      }
    }
    throw error;
  }
}

export async function register(
  _prevState: string | undefined,
  formData: FormData,
) {
  let isSuccessful = false;

  try {
    const email = formData.get("email") as string;
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;
    const retype_password = formData.get("retype_password") as string;

    const parsed = z
      .object({
        email: z.string().email(),
        username: z.string().min(3),
        password: z.string().min(6),
        retype_password: z.string().min(6),
      })
      .safeParse({ email, username, password, retype_password });

    if (!parsed.success) return "Invalid input data.";
    if (password !== retype_password) return "Passwords do not match.";

    const db = await getDb();
    const users = db.collection("users");

    const existing = await users.findOne({ email });
    if (existing) return "Email is already registered";

    const hashed_password = await bcrypt.hash(password, 10);
    await users.insertOne({
      username,
      email,
      hashed_password,
      created_at: new Date().toISOString(),
    });

    isSuccessful = true;
  } catch (error) {
    console.error("Error during registration:", error);
    return error instanceof Error ? error.message : "Something went wrong.";
  }

  if (isSuccessful) redirect("/auth/login");
}

const CreateJobSchema = z.object({
  role: z.string().min(1, "Job Role is required"),
  company: z.string().min(1, "Company Name is required"),
  experience: z.string().optional(),
  skills: z.string().optional(),
  requirements: z.string().optional(),
});

async function handleFileUpload(jobId: string, file: File) {
  const db = await getDb();
  const uploads = db.collection("uploads");
  try {
    const result = await parseUploadedFile(file);
    const stats =
      result.candidates.length > 0
        ? await upsertCandidates(db.collection("candidates"), jobId, result.candidates)
        : { inserted: 0, merged: 0 };

    await logUpload(uploads, {
      job_id: jobId,
      filename: file.name,
      file_type: result.fileType,
      candidates_parsed: stats.inserted + stats.merged,
      errors: result.errors,
    });
  } catch (error) {
    console.error("File upload during job action failed:", error);
    await logUpload(uploads, {
      job_id: jobId,
      filename: file.name,
      file_type: "unknown",
      candidates_parsed: 0,
      errors: [error instanceof Error ? error.message : "Unknown error"],
      status: "failed",
    }).catch(() => {});
  }
}

export async function createJobAction(_prevState: unknown, formData: FormData) {
  let redirectTo: string | null = null;

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "You must be logged in to create a job." };
    }

    const validated = CreateJobSchema.safeParse({
      role: formData.get("role"),
      company: formData.get("company"),
      experience: formData.get("experience"),
      skills: formData.get("skills"),
      requirements: formData.get("requirements"),
    });

    if (!validated.success) {
      return { error: "Missing or invalid fields. Please check your input." };
    }

    const db = await getDb();
    const jobs = db.collection("jobs");

    const result = await jobs.insertOne({
      ...validated.data,
      user_id: session.user.id,
      status: JobStatus.PENDING,
      created_at: new Date().toISOString(),
    });

    const jobId = result.insertedId.toString();

    const file = formData.get("talents_file");
    if (file instanceof File && file.size > 0) {
      await handleFileUpload(jobId, file);
    }

    redirectTo = "/dashboard/jobs";
  } catch (error) {
    console.error("Error in createJobAction:", error);
    return { error: "Something went wrong while creating the job." };
  }

  if (redirectTo) {
    revalidatePath("/dashboard/jobs");
    redirect(redirectTo);
  }
}

const UpdateJobSchema = z.object({
  job_id: z.string().min(1, "Job ID is missing"),
  role: z.string().min(1, "Job Role is required"),
  company: z.string().min(1, "Company Name is required"),
  experience: z.string().optional(),
  skills: z.string().optional(),
  requirements: z.string().optional(),
});

export async function updateJobAction(_prevState: unknown, formData: FormData) {
  let redirectTo: string | null = null;

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "You must be logged in to update a job." };
    }

    const validated = UpdateJobSchema.safeParse({
      job_id: formData.get("job_id"),
      role: formData.get("role"),
      company: formData.get("company"),
      experience: formData.get("experience"),
      skills: formData.get("skills"),
      requirements: formData.get("requirements"),
    });

    if (!validated.success) {
      return { error: "Missing or invalid fields. Please check your input." };
    }

    const { job_id, ...jobData } = validated.data;

    if (!ObjectId.isValid(job_id)) {
      return { error: "Invalid Job ID." };
    }

    const db = await getDb();
    const jobs = db.collection("jobs");

    const existing = await jobs.findOne({ _id: new ObjectId(job_id) });
    if (!existing) return { error: "Job not found." };
    if (existing.user_id !== session.user.id) {
      return { error: "Not authorized to update this job." };
    }

    await jobs.updateOne(
      { _id: new ObjectId(job_id) },
      {
        $set: {
          role: jobData.role,
          company: jobData.company,
          experience: jobData.experience ?? null,
          skills: jobData.skills ?? null,
          requirements: jobData.requirements ?? null,
        },
      },
    );

    const file = formData.get("talents_file");
    if (file instanceof File && file.size > 0) {
      await handleFileUpload(job_id, file);
    }

    redirectTo = "/dashboard/jobs";
  } catch (error) {
    console.error("Error in updateJobAction:", error);
    return { error: "Something went wrong while updating the job." };
  }

  if (redirectTo) {
    revalidatePath("/dashboard/jobs");
    redirect(redirectTo);
  }
}

export type EmailRecipient = {
  email: string;
  first_name: string;
  last_name: string;
  rank: number | null;
  final_score: number | null;
};

export type EmailBatch = {
  job_role: string;
  job_company: string;
  accepted: EmailRecipient[];
  rejected: EmailRecipient[];
};

export async function fetchEmailBatch(jobId: string): Promise<EmailBatch | { error: string }> {
  if (!ObjectId.isValid(jobId)) {
    return { error: "Invalid Job ID." };
  }

  const db = await getDb();
  const job = await db.collection("jobs").findOne({ _id: new ObjectId(jobId) });
  if (!job) return { error: "Job not found." };

  const rows = await db
    .collection("candidates")
    .find({ job_id: jobId })
    .toArray();

  const accepted: EmailRecipient[] = [];
  const rejected: EmailRecipient[] = [];

  for (const c of rows) {
    if (!c.email) continue;
    const recipient: EmailRecipient = {
      email: c.email,
      first_name: c.first_name ?? "",
      last_name: c.last_name ?? "",
      rank: c.screening?.rank ?? null,
      final_score: c.screening?.final_score ?? null,
    };

    // Accepted = candidate appears in shortlist (has rank set during screening)
    if (recipient.rank !== null) {
      accepted.push(recipient);
    } else {
      rejected.push(recipient);
    }
  }

  accepted.sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0));

  return {
    job_role: (job.role as string) || "",
    job_company: (job.company as string) || "",
    accepted,
    rejected,
  };
}

export async function deleteJobAction(id: string) {
  try {
    if (!ObjectId.isValid(id)) return;

    const db = await getDb();
    await db.collection("jobs").deleteOne({ _id: new ObjectId(id) });

    revalidatePath("/dashboard/jobs");
  } catch (error) {
    console.error("Error deleting job:", error);
  }
}

export async function screenCandidatesAction(
  jobId: string,
  topN: number = 10,
) {
  try {
    if (!ObjectId.isValid(jobId)) {
      return { error: "Invalid Job ID." };
    }

    const safeTopN = Math.max(1, Math.min(topN, 50));

    const db = await getDb();
    const jobs = db.collection("jobs");
    const candidates = db.collection("candidates");

    const job = await jobs.findOne({ _id: new ObjectId(jobId) });
    if (!job) return { error: "Job not found." };

    const rows = await candidates.find({ job_id: jobId }).limit(500).toArray();
    if (rows.length === 0) {
      return { error: "No candidates found. Upload a file first." };
    }

    const candidatesForScreening: CandidateDocument[] = rows.map((c) => ({
      _id: c._id.toString(),
      job_id: c.job_id,
      first_name: c.first_name ?? "",
      last_name: c.last_name ?? "",
      email: c.email,
      headline: c.headline ?? "",
      bio: c.bio ?? null,
      location: c.location ?? "",
      skills: c.skills ?? [],
      languages: c.languages ?? null,
      experience: c.experience ?? [],
      education: c.education ?? [],
      certifications: c.certifications ?? null,
      projects: c.projects ?? [],
      availability: c.availability,
      socialLinks: c.socialLinks ?? null,
      source: c.source ?? "json",
      raw_resume_text: c.raw_resume_text ?? null,
      screening: c.screening ?? null,
      created_at: c.created_at,
    }));

    const required_skills = ((job.skills as string) || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const result = await screenCandidates(
      {
        job_title: (job.role as string) || "",
        job_description: (job.requirements as string) || "",
        required_skills,
        experience_level: (job.experience as string) || "",
        top_n: Math.min(candidatesForScreening.length, safeTopN),
      },
      candidatesForScreening,
    );

    for (const c of result.shortlist) {
      const update: Record<string, unknown> = {
        screening: {
          rank: c.rank,
          final_score: c.final_score,
          scores: c.scores,
          strengths: c.strengths,
          gaps: c.gaps,
          recommendation: c.recommendation,
        },
      };

      // If Gemini extracted profile fields (PDF source), persist them too
      if (c.enriched_profile) {
        for (const [key, value] of Object.entries(c.enriched_profile)) {
          if (value !== undefined && value !== null) {
            update[key] = value;
          }
        }
      }

      await candidates.updateOne(
        { job_id: jobId, email: c.email },
        { $set: update },
      );
    }

    await jobs.updateOne(
      { _id: new ObjectId(jobId) },
      { $set: { status: JobStatus.DONE } },
    );

    revalidatePath(`/dashboard/jobs/${jobId}`);

    return {
      success: true,
      message: `Screening complete. ${result.shortlist.length} candidates ranked.`,
      summary: result.screening_summary,
    };
  } catch (error) {
    console.error("Error screening candidates:", error);
    return {
      error: error instanceof Error ? error.message : "Screening failed.",
    };
  }
}
