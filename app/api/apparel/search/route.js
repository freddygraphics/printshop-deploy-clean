export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import prisma from "@/lib/db";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const q = searchParams.get("q")?.trim() || "";
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(
      30,
      Math.max(1, Number(searchParams.get("limit") || 20)),
    );

    if (q.length < 2) {
      return Response.json({
        products: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      });
    }

    const where = {
      active: true,
      OR: [
        {
          name: {
            contains: q,
            mode: "insensitive",
          },
        },
        {
          supplierStyle: {
            contains: q,
            mode: "insensitive",
          },
        },
        {
          brand: {
            contains: q,
            mode: "insensitive",
          },
        },
        {
          category: {
            contains: q,
            mode: "insensitive",
          },
        },
      ],
    };

    const [products, total] = await prisma.$transaction([
      prisma.apparelProduct.findMany({
        where,
        select: {
          id: true,
          supplier: true,
          supplierStyle: true,
          name: true,
          description: true,
          brand: true,
          category: true,
          subcategory: true,
          imageUrl: true,
          _count: {
            select: {
              variants: true,
            },
          },
        },
        orderBy: [{ brand: "asc" }, { name: "asc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),

      prisma.apparelProduct.count({ where }),
    ]);

    return Response.json({
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error searching SanMar apparel:", error);

    return Response.json(
      {
        error: "No se pudo buscar el catálogo SanMar.",
        products: [],
      },
      { status: 500 },
    );
  }
}
