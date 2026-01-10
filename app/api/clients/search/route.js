export const dynamic = "force-dynamic";

import prisma from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() || "";

    if (q.length < 2) {
      return NextResponse.json([]);
    }

    const clients = await prisma.client.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { company: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          { phone: { contains: q, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        name: true,
        company: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        state: true,
        zip: true,
      },
      orderBy: { name: "asc" },
      take: 50,
    });

    return NextResponse.json(clients);
  } catch (err) {
    console.error("❌ Error searching customers:", err);
    return NextResponse.json([], { status: 500 });
  }
}
