import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const count = await prisma.invoice.count();

    return NextResponse.json({ count });
  } catch (error) {
    console.error("❌ Error counting invoices:", error);
    return NextResponse.json(
      { error: "Server error", details: error.message },
      { status: 500 }
    );
  }
}
