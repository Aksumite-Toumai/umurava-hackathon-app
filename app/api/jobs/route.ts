import { NextRequest, NextResponse } from "next/server";

import { getDb } from "@/app/lib/db/mongodb";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const user_id = searchParams.get("user_id");
    const skip = parseInt(searchParams.get("skip") || "0", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const query = searchParams.get("query") || "";

    if (!user_id) {
      return NextResponse.json(
        { detail: "user_id is required" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const jobs = db.collection("jobs");

    const filter: Record<string, unknown> = { user_id };
    if (query) {
      filter.$or = [
        { role: { $regex: query, $options: "i" } },
        { company: { $regex: query, $options: "i" } },
        { skills: { $regex: query, $options: "i" } },
      ];
    }

    const results = await jobs
      .find(filter)
      .sort({ _id: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    return NextResponse.json(
      results.map((j) => ({ ...j, _id: j._id.toString() })),
    );
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return NextResponse.json(
      { detail: "Failed to fetch jobs" },
      { status: 500 },
    );
  }
}
