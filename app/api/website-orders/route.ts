import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      where: {
        customFields: {
          path: ["source"],
          equals: "website",
        },
      },
      include: {
        client: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      orders,
    });
  } catch (error) {
    console.error("Website orders GET error:", error);

    return NextResponse.json(
      {
        error: "Could not load website orders.",
      },
      { status: 500 },
    );
  }
}
