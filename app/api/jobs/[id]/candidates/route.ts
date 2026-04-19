import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { getDb } from "@/app/lib/db/mongodb";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: job_id } = await params;

    if (!ObjectId.isValid(job_id)) {
      return NextResponse.json(
        { detail: "Invalid Job ID format" },
        { status: 400 },
      );
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const db = await getDb();
    const results = await db
      .collection("candidates")
      .find({ job_id })
      .sort({ "screening.rank": 1 })
      .limit(limit)
      .toArray();

    return NextResponse.json(
      results.map((c) => ({ ...c, _id: c._id.toString() })),
    );
  } catch (error) {
    console.error("Error fetching candidates:", error);
    return NextResponse.json(
      { detail: "Failed to fetch candidates" },
      { status: 500 },
    );
  }
}
