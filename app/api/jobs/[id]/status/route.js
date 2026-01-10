import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function PUT(req, { params }) {
  try {
    const jobId = Number(params.id);
    const { status } = await req.json();

    if (!status) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 }
      );
    }

    const job = await prisma.job.update({
      where: { id: jobId },
      data: { status },
    });

    return NextResponse.json(job);
  } catch (error) {
    console.error("❌ UPDATE JOB STATUS ERROR:", error);
    return NextResponse.json(
      { error: "Failed to update job status" },
      { status: 500 }
    );
  }
}
