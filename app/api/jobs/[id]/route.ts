import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { getDb } from "@/app/lib/db/mongodb";
import { JobCreateSchema } from "@/app/lib/schemas/job";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { detail: "Invalid Job ID format" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const job = await db.collection("jobs").findOne({ _id: new ObjectId(id) });

    if (!job) {
      return NextResponse.json({ detail: "Job not found" }, { status: 404 });
    }

    return NextResponse.json({ ...job, _id: job._id.toString() });
  } catch (error) {
    console.error("Error fetching job:", error);
    return NextResponse.json(
      { detail: "Failed to fetch job" },
      { status: 500 },
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { detail: "Invalid Job ID format" },
        { status: 400 },
      );
    }

    const body = await req.json();
    const parsed = JobCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { detail: parsed.error.errors[0]?.message || "Invalid input" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const jobs = db.collection("jobs");

    const existing = await jobs.findOne({ _id: new ObjectId(id) });
    if (!existing) {
      return NextResponse.json({ detail: "Job not found" }, { status: 404 });
    }

    if (existing.user_id !== parsed.data.user_id) {
      return NextResponse.json(
        { detail: "Not authorized to update this job" },
        { status: 403 },
      );
    }

    await jobs.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          role: parsed.data.role,
          company: parsed.data.company,
          requirements: parsed.data.requirements ?? null,
          skills: parsed.data.skills ?? null,
          experience: parsed.data.experience ?? null,
        },
      },
    );

    const updated = await jobs.findOne({ _id: new ObjectId(id) });
    return NextResponse.json({ ...updated, _id: updated!._id.toString() });
  } catch (error) {
    console.error("Error updating job:", error);
    return NextResponse.json(
      { detail: "Failed to update job" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { detail: "Invalid Job ID format" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const result = await db
      .collection("jobs")
      .deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ detail: "Job not found" }, { status: 404 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting job:", error);
    return NextResponse.json(
      { detail: "Failed to delete job" },
      { status: 500 },
    );
  }
}
