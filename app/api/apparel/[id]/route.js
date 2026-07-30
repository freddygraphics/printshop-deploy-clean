export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import prisma from "@/lib/db";

export async function GET(req, { params }) {
  try {
    const productId = Number(params.id);

    if (!Number.isInteger(productId) || productId <= 0) {
      return Response.json(
        { error: "ID de producto inválido." },
        { status: 400 },
      );
    }

    const product = await prisma.apparelProduct.findUnique({
      where: {
        id: productId,
      },
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
        active: true,

        variants: {
          where: {
            active: true,
          },
          select: {
            id: true,
            supplierSku: true,
            color: true,
            colorCode: true,
            size: true,
            supplierPrice: true,
            inventory: true,
            warehouseData: true,
          },
          orderBy: [
            {
              color: "asc",
            },
            {
              size: "asc",
            },
          ],
        },
      },
    });

    if (!product) {
      return Response.json(
        { error: "Producto SanMar no encontrado." },
        { status: 404 },
      );
    }

    const colorMap = new Map();

    for (const variant of product.variants) {
      if (!colorMap.has(variant.color)) {
        colorMap.set(variant.color, {
          name: variant.color,
          colorCode: variant.colorCode,
          imageUrl:
            variant.warehouseData?.colorImage || product.imageUrl || null,
          variants: [],
        });
      }

      colorMap.get(variant.color).variants.push({
        id: variant.id,
        supplierSku: variant.supplierSku,
        size: variant.size,
        supplierPrice: Number(variant.supplierPrice),
        inventory: variant.inventory,
      });
    }

    return Response.json({
      product: {
        id: product.id,
        supplier: product.supplier,
        supplierStyle: product.supplierStyle,
        name: product.name,
        description: product.description,
        brand: product.brand,
        category: product.category,
        subcategory: product.subcategory,
        imageUrl: product.imageUrl,
        active: product.active,
      },

      colors: Array.from(colorMap.values()),
    });
  } catch (error) {
    console.error("Error GET SanMar product:", error);

    return Response.json(
      { error: "No se pudo cargar el producto SanMar." },
      { status: 500 },
    );
  }
}
