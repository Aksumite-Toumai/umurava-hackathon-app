import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";

import { getDb } from "@/app/lib/db/mongodb";
import { UserLoginSchema } from "@/app/lib/schemas/user";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = UserLoginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { detail: "Invalid email or password format" },
        { status: 400 },
      );
    }

    const { email, password } = parsed.data;
    const db = await getDb();
    const user = await db.collection("users").findOne({ email });

    if (!user) {
      return NextResponse.json(
        { detail: "Invalid email or password" },
        { status: 401 },
      );
    }

    const valid = await bcrypt.compare(password, user.hashed_password);

    if (!valid) {
      return NextResponse.json(
        { detail: "Invalid email or password" },
        { status: 401 },
      );
    }

    return NextResponse.json({
      _id: user._id.toString(),
      username: user.username,
      email: user.email,
    });
  } catch (error) {
    console.error("Error logging in:", error);
    return NextResponse.json(
      { detail: "Login failed" },
      { status: 500 },
    );
  }
}
