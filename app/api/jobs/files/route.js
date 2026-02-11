"use client";

export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";

import prisma from "@/lib/db";
import cloudinary from "@/lib/cloudinary";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const jobId = Number(formData.get("jobId"));
    const files = formData.getAll("files");

    if (!jobId || files.length === 0) {
      return NextResponse.json(
        { error: "Missing jobId or files" },
        { status: 400 },
      );
    }

    const savedFiles = [];

    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // subir a Cloudinary
      const upload = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: "printshop/jobs",
              resource_type: "image",
            },
            (err, result) => {
              if (err) reject(err);
              else resolve(result);
            },
          )
          .end(buffer);
      });

      const saved = await prisma.jobFile.create({
        data: {
          jobId,
          name: file.name,
          type: file.type,
          url: upload.secure_url, // 🔥 URL REAL
        },
      });

      savedFiles.push(saved);
    }

    return NextResponse.json({ files: savedFiles });
  } catch (err) {
    console.error("UPLOAD ERROR", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
