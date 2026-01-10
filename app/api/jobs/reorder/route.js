import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST(req) {
  try {
    const { updates } = await req.json();

    /**
     * updates = [
     *   { id: 1, status: "Pending", position: 0 },
     *   { id: 3, status: "Pending", position: 1 },
     *   { id: 7, status: "Design",  position: 0 }
     * ]
     */

    if (!Array.isArray(updates)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const queries = updates.map((job) =>
      prisma.job.update({
        where: { id: job.id },
        data: {
          status: job.status,
          position: job.position,
        },
      })
    );

    await prisma.$transaction(queries);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ JOB REORDER ERROR:", error);
    return NextResponse.json(
      { error: "Failed to reorder jobs" },
      { status: 500 }
    );
  }
}
