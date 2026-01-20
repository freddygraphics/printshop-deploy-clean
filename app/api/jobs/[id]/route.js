import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET JOB DETAILS
export async function GET(req, { params }) {
  const jobId = Number(params.id);

  if (isNaN(jobId)) {
    return NextResponse.json({ error: "Invalid job id" }, { status: 400 });
  }

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      client: true,
      quote: true,
    },
  });

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  return NextResponse.json(job);
}

// UPDATE JOB (status, description, etc.)
export async function PATCH(req, { params }) {
  const jobId = Number(params.id);
  const body = await req.json();

  if (isNaN(jobId)) {
    return NextResponse.json({ error: "Invalid job id" }, { status: 400 });
  }

  const data = {};

  // ✅ actualizar status si viene
  if (typeof body.status === "string") {
    data.status = body.status;
  }

  // ✅ actualizar description si viene
  if (typeof body.description === "string") {
    data.description = body.description;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json(
      { error: "No valid fields to update" },
      { status: 400 },
    );
  }

  const job = await prisma.job.update({
    where: { id: jobId },
    data,
  });

  return NextResponse.json(job);
}
