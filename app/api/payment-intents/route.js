import prisma from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req) {
  const body = await req.json();

  const {
    invoiceId,
    amount,
    processingFee = 0,
    method = "card",
    type = "full", // 👈 full | deposit
  } = body;

  if (!invoiceId || !amount || amount <= 0) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const totalCharged = Number(amount) + Number(processingFee);

  const intent = await prisma.paymentIntent.create({
    data: {
      invoiceId,
      amount,
      processingFee,
      totalCharged,
      method,
      type, // ✅ CLAVE (deposit | full)
      status: "pending", // ✅ CLAVE
    },
  });

  return NextResponse.json({
    intentId: intent.id,
  });
}
