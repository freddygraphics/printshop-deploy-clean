import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const discounts = await prisma.discount.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(discounts);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load discounts", details: error.message },
      { status: 500 }
    );
  }
}
