import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

import prisma from "@/lib/db";

export async function PATCH(req, { params }) {
  const invoiceId = Number(params.id);

  const { cancelJob = false } = await req.json().catch(() => ({}));
  console.log("cancelJob:", cancelJob);
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      job: true,
    },
  });
  console.log(invoice.job);
  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  if (invoice.status === "VOID") {
    return NextResponse.json(
      { error: "Invoice already voided" },
      { status: 400 },
    );
  }

  await prisma.$transaction(async (tx) => {
    // Void Invoice
    await tx.invoice.update({
      where: { id: invoiceId },
      data: {
        status: "VOID",
        voidedAt: new Date(),
      },
    });

    // Cancel Job (opcional)
    if (cancelJob && invoice.job) {
      await tx.job.update({
        where: {
          id: invoice.job.id,
        },
        data: {
          status: "Cancelled",
        },
      });
    }
  });

  return NextResponse.json({
    success: true,
    jobCancelled: cancelJob && !!invoice.job,
  });
}
