import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET — listar categorías
export async function GET() {
  try {
    const categories = await prisma.productCategory.findMany({
      orderBy: [{ position: "asc" }, { name: "asc" }],
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("GET product categories error:", error);

    return NextResponse.json(
      { error: "Could not load product categories." },
      { status: 500 },
    );
  }
}

// POST — crear categoría
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const name = String(body.name || "").trim();

    if (!name) {
      return NextResponse.json(
        { error: "Category name is required." },
        { status: 400 },
      );
    }

    const slug =
      String(body.slug || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") ||
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

    const existing = await prisma.productCategory.findFirst({
      where: {
        OR: [
          { slug },
          {
            name: {
              equals: name,
              mode: "insensitive",
            },
          },
        ],
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "This category already exists." },
        { status: 409 },
      );
    }

    const category = await prisma.productCategory.create({
      data: {
        name,
        slug,
        active: body.active ?? true,
        position: Number(body.position || 0),
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("POST product category error:", error);

    return NextResponse.json(
      { error: "Could not create product category." },
      { status: 500 },
    );
  }
}
