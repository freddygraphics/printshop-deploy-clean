import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

import prisma from "@/lib/db";

export async function PUT(req, { params }) {
  const body = await req.json();

  const material = await prisma.material.update({
    where: { id: params.id },
    data: body,
  });

  return NextResponse.json(material);
}

export async function DELETE(req, { params }) {
  await prisma.material.delete({
    where: { id: params.id },
  });

  return NextResponse.json({ ok: true });
}
