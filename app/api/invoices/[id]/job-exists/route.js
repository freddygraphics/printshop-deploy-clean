import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

import prisma from "@/lib/db";

export async function GET(req, { params }) {
  try {
    const invoiceId = Number(params.id);

    if (!invoiceId) {
      return NextResponse.json({ exists: false }, { status: 400 });
    }

    const job = await prisma.job.findUnique({
      where: { invoiceId },
      select: { id: true, jobNumber: true },
    });

    return NextResponse.json({
      exists: !!job,
      job: job || null,
    });
  } catch (error) {
    console.error("❌ JOB EXISTS ERROR:", error);
    return NextResponse.json({ exists: false }, { status: 500 });
  }
}
