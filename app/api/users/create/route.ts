import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";

import { getDb } from "@/app/lib/db/mongodb";
import { UserCreateSchema } from "@/app/lib/schemas/user";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = UserCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { detail: parsed.error.errors[0]?.message || "Invalid input" },
        { status: 400 },
      );
    }

    const { username, email, password } = parsed.data;
    const db = await getDb();
    const users = db.collection("users");

    const existing = await users.findOne({ email });
    if (existing) {
      return NextResponse.json(
        { detail: "Email is already registered" },
        { status: 400 },
      );
    }

    const hashed_password = await bcrypt.hash(password, 10);

    const result = await users.insertOne({
      username,
      email,
      hashed_password,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        _id: result.insertedId.toString(),
        username,
        email,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { detail: "Failed to create user" },
      { status: 500 },
    );
  }
}
