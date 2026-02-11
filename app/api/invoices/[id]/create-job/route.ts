export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";

import prisma from "@/lib/db";

export async function POST(req, { params }) {
  try {
    const invoiceId = Number(params.id);

    if (!invoiceId) {
      return NextResponse.json(
        { error: "Invalid invoice id" },
        { status: 400 },
      );
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { invoiceItems: true },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // 🚨 Verificar si ya existe job
    const existingJob = await prisma.job.findUnique({
      where: { invoiceId },
    });

    if (existingJob) {
      return NextResponse.json(
        { error: "Job already exists" },
        { status: 400 },
      );
    }

    // 🔢 Generar jobNumber automático
    const counter = await prisma.counter.upsert({
      where: { name: "jobNumber" },
      update: { value: { increment: 1 } },
      create: { name: "jobNumber", value: 1 },
    });

    const jobNumber = counter.value;

    // 🏗 Crear Job
    const job = await prisma.job.create({
      data: {
        jobNumber,
        clientId: invoice.clientId,
        invoiceId: invoice.id,
        status: "Pending",
        items: {
          create: invoice.invoiceItems.map((item) => ({
            name: item.name,
            qty: item.qty,
            unitPrice: item.unitPrice,
            total: item.total,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    return NextResponse.json(job);
  } catch (error) {
    console.error("❌ CREATE JOB ERROR:", error);
    return NextResponse.json(
      { error: "Failed to create job" },
      { status: 500 },
    );
  }
}
