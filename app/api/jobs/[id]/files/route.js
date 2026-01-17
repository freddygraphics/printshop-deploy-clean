import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import fs from "fs";
import path from "path";

export async function POST(req, { params }) {
  const jobId = Number(params.id);
  const formData = await req.formData();
  const file = formData.get("file");

  if (!file) {
    return NextResponse.json({ error: "No file" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const uploadDir = path.join(process.cwd(), "public/uploads");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const fileName = `${Date.now()}-${file.name}`;
  const filePath = path.join(uploadDir, fileName);

  fs.writeFileSync(filePath, buffer);

  const fileUrl = `/uploads/${fileName}`;

  const saved = await prisma.jobFile.create({
    data: {
      jobId,
      name: file.name,
      url: fileUrl,
      type: file.type,
    },
  });

  return NextResponse.json(saved);
}
