export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function PUT(req, context) {
  try {
    const { id } = context.params;
    const jobId = Number(id);

    const { status } = await req.json();

    if (!status) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 },
      );
    }
    let data = {
      status,
    };

    // Cuando pasa a Delivered
    if (status === "Delivered") {
      data.deliveredAt = new Date();
    }

    // Si sale de Delivered
    if (status !== "Delivered") {
      data.deliveredAt = null;
      data.archived = false;
      data.archivedAt = null;
    }

    const job = await prisma.job.update({
      where: { id: jobId },
      data,
    });

    return NextResponse.json(job);
  } catch (error) {
    console.error("❌ UPDATE JOB STATUS ERROR:", error);
    return NextResponse.json(
      { error: "Failed to update job status" },
      { status: 500 },
    );
  }
}
