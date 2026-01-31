import prisma from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const materials = await prisma.material.findMany();
  return NextResponse.json(materials);
}

export async function PUT(req) {
  const body = await req.json();

  const material = await prisma.material.update({
    where: { id: body.id },
    data: {
      sellPerSqft: body.sellPerSqft,
    },
  });

  return NextResponse.json(material);
}
