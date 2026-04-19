import bcrypt from "bcrypt";

import { getDb } from "@/app/lib/db/mongodb";
import type { UserResponse } from "@/app/lib/schemas/user";

export async function verifyUser(
  email: string,
  password: string,
): Promise<UserResponse | null> {
  const db = await getDb();
  const user = await db.collection("users").findOne({ email });

  if (!user) return null;

  const valid = await bcrypt.compare(password, user.hashed_password);
  if (!valid) return null;

  return {
    _id: user._id.toString(),
    username: user.username,
    email: user.email,
  };
}
