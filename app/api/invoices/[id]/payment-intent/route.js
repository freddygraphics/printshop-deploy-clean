import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST(req, { params }) {
  try {
    const invoiceId = Number(params.id);
    const body = await req.json();

    const { baseAmount, processingFee, totalCharged, method } = body;

    if (!baseAmount || !totalCharged || baseAmount <= 0) {
      return NextResponse.json(
        { error: "Invalid payment intent data" },
        { status: 400 },
      );
    }

    const intent = {
      baseAmount: Number(baseAmount),
      processingFee: Number(processingFee || 0),
      totalCharged: Number(totalCharged),
      method,
      createdAt: new Date().toISOString(),
    };

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { paymentIntent: intent },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ payment-intent error:", err);
    return NextResponse.json(
      { error: "Failed to save payment intent" },
      { status: 500 },
    );
  }
}
