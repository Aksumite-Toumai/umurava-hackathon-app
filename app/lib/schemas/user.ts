import { z } from "zod";

export const UserCreateSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const UserLoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type UserCreate = z.infer<typeof UserCreateSchema>;
export type UserLogin = z.infer<typeof UserLoginSchema>;

export type UserDocument = {
  _id: string;
  username: string;
  email: string;
  hashed_password: string;
  created_at: string;
};

export type UserResponse = {
  _id: string;
  username: string;
  email: string;
};
