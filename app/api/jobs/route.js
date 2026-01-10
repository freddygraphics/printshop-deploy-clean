import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// ============================
// GET — LIST JOBS (Production Board)
// ============================
export async function GET() {
  try {
    const jobs = await prisma.job.findMany({
      orderBy: [{ status: "asc" }, { position: "asc" }],
      include: {
        client: {
          select: { id: true, name: true },
        },
        invoice: {
          select: {
            invoiceNumber: true,
            invoiceItems: {
              select: {
                name: true,
                qty: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(jobs);
  } catch (error) {
    console.error("❌ GET JOBS ERROR:", error);
    return NextResponse.json(
      { error: "Failed to fetch jobs" },
      { status: 500 }
    );
  }
}

// ============================
// POST — CREATE JOB FROM INVOICE
// ============================
export async function POST(req) {
  try {
    const { invoiceId } = await req.json();

    if (!invoiceId) {
      return NextResponse.json(
        { error: "invoiceId is required" },
        { status: 400 }
      );
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const existingJob = await prisma.job.findUnique({
      where: { invoiceId },
    });

    if (existingJob) {
      return NextResponse.json(
        { error: "Job already exists for this invoice" },
        { status: 409 }
      );
    }

    const lastJob = await prisma.job.findFirst({
      orderBy: { jobNumber: "desc" },
    });

    const jobNumber = lastJob ? lastJob.jobNumber + 1 : 1001;

    const job = await prisma.job.create({
      data: {
        jobNumber,
        invoiceId,
        clientId: invoice.clientId,
        status: "Pending",
        position: 0,
      },
    });

    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    console.error("❌ CREATE JOB ERROR:", error);
    return NextResponse.json(
      { error: "Failed to create job" },
      { status: 500 }
    );
  }
}
