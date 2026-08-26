import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const service = searchParams.get("service");

    const products = await prisma.product.findMany({
      where: {
        showOnWebsite: true,

        ...(service
          ? {
              relatedService: service,
            }
          : {}),
      },

      orderBy: {
        name: "asc",
      },

      select: {
        id: true,
        name: true,
        description: true,
        image: true,
        category: true,
        relatedService: true,

        images: {
          orderBy: {
            position: "asc",
          },
          select: {
            id: true,
            url: true,
            position: true,
            isPrimary: true,
          },
        },
      },
    });

    return NextResponse.json({
      products,
    });
  } catch (error) {
    console.error("PUBLIC PRODUCTS ERROR:", error);

    return NextResponse.json(
      {
        error: "Unable to load products.",
      },
      {
        status: 500,
      },
    );
  }
}
