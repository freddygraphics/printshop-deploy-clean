import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(req, context) {
  const { number } = context.params;

  const invoice = await prisma.invoice.findFirst({
    where: { invoiceNumber: Number(number) },
    include: {
      client: true,
      payments: true,
    },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const totalPaid = invoice.payments.reduce(
    (sum, p) => sum + Number(p.amount),
    0,
  );

  const balance = Number(invoice.total) - totalPaid;

  return NextResponse.json({
    ...invoice,
    balance,
  });
}
