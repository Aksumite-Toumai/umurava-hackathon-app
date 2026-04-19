import { z } from "zod";

export const JobStatus = {
  PENDING: "pending",
  DONE: "done",
  ERROR: "error",
} as const;

export type JobStatusValue = (typeof JobStatus)[keyof typeof JobStatus];

export const JobCreateSchema = z.object({
  user_id: z.string().min(1, "User ID is required"),
  role: z.string().min(1, "Role is required"),
  company: z.string().min(1, "Company is required"),
  requirements: z.string().optional().nullable(),
  skills: z.string().optional().nullable(),
  experience: z.string().optional().nullable(),
});

export type JobCreate = z.infer<typeof JobCreateSchema>;

export type JobDocument = {
  _id: string;
  user_id: string;
  role: string;
  company: string;
  requirements: string | null;
  skills: string | null;
  experience: string | null;
  status: JobStatusValue;
  created_at: string;
};
