import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function DELETE(req, { params }) {
  try {
    const fileId = Number(params.id);

    if (!fileId) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    await prisma.jobFile.delete({
      where: { id: fileId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE FILE ERROR:", error);
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 },
    );
  }
}
