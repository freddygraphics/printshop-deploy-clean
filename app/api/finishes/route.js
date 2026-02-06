export const dynamic = "force-dynamic";

import prisma from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const finishes = await prisma.finish.findMany({
    orderBy: { name: "asc" },
  });
  return NextResponse.json(finishes);
}

export async function PUT(req) {
  const body = await req.json();

  const finish = await prisma.finish.update({
    where: { id: body.id },
    data: {
      sellPrice: body.sellPrice,
    },
  });

  return NextResponse.json(finish);
}
