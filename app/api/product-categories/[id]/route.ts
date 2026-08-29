import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// ==========================================
// PATCH — actualizar categoría
// ==========================================
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const id = Number(params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        { error: "Invalid category id." },
        { status: 400 },
      );
    }

    const body = await req.json();

    const category = await prisma.productCategory.update({
      where: { id },
      data: {
        ...(body.name !== undefined ? { name: String(body.name).trim() } : {}),

        ...(body.slug !== undefined
          ? {
              slug: String(body.slug)
                .trim()
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-+|-+$/g, ""),
            }
          : {}),

        ...(body.active !== undefined ? { active: Boolean(body.active) } : {}),

        ...(body.position !== undefined
          ? { position: Number(body.position) }
          : {}),
      },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error("PATCH product category error:", error);

    return NextResponse.json(
      { error: "Could not update product category." },
      { status: 500 },
    );
  }
}
