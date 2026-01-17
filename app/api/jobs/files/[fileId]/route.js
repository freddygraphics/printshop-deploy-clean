import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import fs from "fs";
import path from "path";

export async function DELETE(req, { params }) {
  const fileId = Number(params.fileId);

  if (isNaN(fileId)) {
    return NextResponse.json({ error: "Invalid file id" }, { status: 400 });
  }

  const file = await prisma.jobFile.findUnique({
    where: { id: fileId },
  });

  if (!file) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  // 📂 borrar archivo físico
  const filePath = path.join(process.cwd(), "public", file.url);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  // 🗑️ borrar registro
  await prisma.jobFile.delete({
    where: { id: fileId },
  });

  return NextResponse.json({ success: true });
}
