import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PATCH(req, { params }) {
  try {
    const jobId = Number(params.id);

    const job = await prisma.job.findUnique({
      where: {
        id: jobId,
      },
      include: {
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            balance: true,
            paymentStatus: true,
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // 🚫 No permitir Pickup si el Invoice tiene saldo pendiente
    // 🚫 No permitir Pickup si el Invoice tiene saldo pendiente
    if (job.invoice && Number(job.invoice.balance) > 0.01) {
      return NextResponse.json(
        {
          error: "PAYMENT_REQUIRED",
          message: "Invoice has an outstanding balance.",
          invoiceId: job.invoice.id,
          invoiceNumber: job.invoice.invoiceNumber,
          balance: Number(job.invoice.balance),
        },
        { status: 400 },
      );
    }

    if (job.pickedUpAt) {
      return NextResponse.json(
        { error: "Job already picked up" },
        { status: 400 },
      );
    }

    const now = new Date();

    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: {
        pickedUpAt: now,
        status: "Delivered",
        deliveredAt: now,
      },
    });

    return NextResponse.json(updatedJob);
  } catch (err) {
    console.error("❌ PICKUP ERROR:", err);

    return NextResponse.json(
      { error: "Failed to mark pickup" },
      { status: 500 },
    );
  }
}
