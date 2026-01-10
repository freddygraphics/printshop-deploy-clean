import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function PATCH(req, { params }) {
  const invoiceId = Number(params.id); // 🔥 importante

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  if (invoice.status === "VOID") {
    return NextResponse.json(
      { error: "Invoice already voided" },
      { status: 400 }
    );
  }

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      status: "VOID",
      voidedAt: new Date(),
    },
  });

  return NextResponse.json({ success: true });
}
