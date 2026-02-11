import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const result = await prisma.$queryRaw`SELECT 1 as ok`;
    return NextResponse.json(result);
  } catch (error) {
    console.error("❌ TEST DB ERROR:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
