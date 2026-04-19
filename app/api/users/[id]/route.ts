import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { getDb } from "@/app/lib/db/mongodb";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { detail: "Invalid User ID format" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const user = await db.collection("users").findOne({ _id: new ObjectId(id) });

    if (!user) {
      return NextResponse.json({ detail: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      _id: user._id.toString(),
      username: user.username,
      email: user.email,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { detail: "Failed to fetch user" },
      { status: 500 },
    );
  }
}
