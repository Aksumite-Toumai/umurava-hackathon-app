import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { getDb } from "@/app/lib/db/mongodb";
import { JobCreateSchema, JobStatus } from "@/app/lib/schemas/job";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = JobCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { detail: parsed.error.errors[0]?.message || "Invalid input" },
        { status: 400 },
      );
    }

    const data = parsed.data;

    if (!ObjectId.isValid(data.user_id)) {
      return NextResponse.json(
        { detail: `Invalid user_id format: ${data.user_id}` },
        { status: 400 },
      );
    }

    const db = await getDb();
    const users = db.collection("users");
    const user = await users.findOne({ _id: new ObjectId(data.user_id) });

    if (!user) {
      return NextResponse.json(
        { detail: `user_id ${data.user_id} does not exist` },
        { status: 400 },
      );
    }

    const jobs = db.collection("jobs");
    const created_at = new Date().toISOString();
    const doc = {
      ...data,
      status: JobStatus.PENDING,
      created_at,
    };

    const result = await jobs.insertOne(doc);

    return NextResponse.json(
      {
        _id: result.insertedId.toString(),
        ...doc,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating job:", error);
    return NextResponse.json(
      { detail: "Failed to create job" },
      { status: 500 },
    );
  }
}
