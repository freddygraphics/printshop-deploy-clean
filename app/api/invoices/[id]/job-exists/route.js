import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(req, { params }) {
  try {
    const invoiceId = parseInt(params.id, 10);
    if (!invoiceId) {
      return NextResponse.json({ exists: false }, { status: 400 });
    }

    // Traer invoice con su quoteId
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: { quoteId: true },
    });

    if (!invoice?.quoteId) {
      return NextResponse.json({ exists: false });
    }

    // Verificar si ya existe Job para ese Quote
    const job = await prisma.job.findUnique({
      where: { quoteId: invoice.quoteId },
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
