export const dynamic = "force-dynamic";

import prisma from "@/lib/db";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() || "";

    if (q.length < 2) {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const products = await prisma.product.findMany({
      where: {
        name: { contains: q, mode: "insensitive" },
      },
      select: {
        id: true,
        name: true,
        price: true,
        basePrice: true,
      },
      orderBy: { name: "asc" },
      take: 50,
    });

    return new Response(JSON.stringify(products), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("❌ Error searching products:", error);
    return new Response(JSON.stringify([]), { status: 500 });
  }
}
