import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request, { params }) {
  try {
    const { id } = params;
    const productId = Number(id);

    if (!Number.isInteger(productId) || productId <= 0) {
      return NextResponse.json(
        { error: "Invalid product id." },
        { status: 400 },
      );
    }

    const product = await prisma.product.findUnique({
      where: {
        id: productId,
      },

      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        image: true,

        defaultOptions: true,

        template: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found." },
        { status: 404 },
      );
    }

    const configuration =
      product.defaultOptions &&
      typeof product.defaultOptions === "object" &&
      !Array.isArray(product.defaultOptions)
        ? product.defaultOptions
        : {};

    const pricing = Array.isArray(configuration.pricing)
      ? configuration.pricing
      : [];

    const productOptions = Array.isArray(configuration.productOptions)
      ? configuration.productOptions
      : [];

    return NextResponse.json({
      id: product.id,
      name: product.name,
      description: product.description,
      category: product.category,
      image: product.image,

      pricing: pricing.map((row) => ({
        minQty: Number(row.minQty),
        maxQty:
          row.maxQty === null || row.maxQty === undefined
            ? null
            : Number(row.maxQty),
        price: Number(row.unitPrice),
      })),

      options: productOptions.map((option) => ({
        key: option.key,
        name: option.name,
        type: option.type,

        values: Array.isArray(option.values)
          ? option.values.map((value) => ({
              key: value.key,
              label: value.label,
              price: Number(value.price || 0),
              priceType: value.priceType || "fixed",
              default: value.default === true,
            }))
          : [],
      })),

      template: product.template,
    });
  } catch (error) {
    console.error("PUBLIC PRODUCT ERROR:", error);

    return NextResponse.json(
      {
        error: "Unable to load product.",
      },
      { status: 500 },
    );
  }
}
