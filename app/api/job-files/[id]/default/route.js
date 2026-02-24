import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function PUT(req, context) {
  const { id } = context.params;
  const fileId = Number(id);

  const file = await prisma.jobFile.findUnique({
    where: { id: fileId },
  });

  if (!file) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Resetear otros defaults
  await prisma.jobFile.updateMany({
    where: { jobId: file.jobId },
    data: { isDefault: false },
  });

  // Marcar este como default
  await prisma.jobFile.update({
    where: { id: fileId },
    data: { isDefault: true },
  });

  return NextResponse.json({ success: true });
}
