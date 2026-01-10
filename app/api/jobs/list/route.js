import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const jobs = await prisma.job.findMany({
      include: {
        client: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(jobs);
  } catch (error) {
    console.error("❌ GET /api/jobs/list ERROR:", error);
    return NextResponse.json(
      { error: "Failed to load jobs" },
      { status: 500 }
    );
  }
}
