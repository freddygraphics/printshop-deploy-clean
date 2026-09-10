import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/* ======================================================
   CHECK IF IDENTIFIER IS NUMERIC
====================================================== */

function isNumericIdentifier(value) {
  return /^\d+$/.test(String(value));
}

/* ======================================================
   GET PUBLIC PRODUCT
   Supports:
   /api/public/products/39
   /api/public/products/standard-business-cards
====================================================== */

export async function GET(request, { params }) {
  try {
    const { id: identifier } = await params;

    if (!identifier) {
      return NextResponse.json(
        {
          error: "Product identifier is required.",
        },
        {
          status: 400,
        },
      );
    }

    /* ======================================================
       FIND PRODUCT
    ====================================================== */

    let product;

    if (isNumericIdentifier(identifier)) {
      const productId = Number(identifier);

      product = await prisma.product.findFirst({
        where: {
          id: productId,
          showOnWebsite: true,
        },

        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          category: true,
          image: true,
          defaultOptions: true,

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
    } else {
      product = await prisma.product.findFirst({
        where: {
          slug: identifier,
          showOnWebsite: true,
        },

        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          category: true,
          image: true,
          defaultOptions: true,

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
    }

    /* ======================================================
       PRODUCT NOT FOUND
    ====================================================== */

    if (!product) {
      return NextResponse.json(
        {
          error: "Product not found.",
        },
        {
          status: 404,
        },
      );
    }

    /* ======================================================
       PRODUCT CONFIGURATION
    ====================================================== */

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
      ? configuration.productOptions.filter((option) => {
          if (!option || typeof option !== "object") {
            return false;
          }

          const name =
            typeof option.name === "string" ? option.name.trim() : "";

          const key = typeof option.key === "string" ? option.key.trim() : "";

          return name !== "" || key !== "";
        })
      : [];

    const yardSign =
      configuration.yardSign &&
      typeof configuration.yardSign === "object" &&
      !Array.isArray(configuration.yardSign)
        ? configuration.yardSign
        : null;

    /* ======================================================
       RESPONSE
    ====================================================== */

    return NextResponse.json({
      id: product.id,

      // ✅ PRODUCT SLUG
      slug: product.slug,

      name: product.name,
      description: product.description,
      category: product.category,
      image: product.image,
      images: product.images,

      // Product configuration
      defaultOptions: configuration,

      yardSign,

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
    });
  } catch (error) {
    console.error("PUBLIC PRODUCT ERROR:", error);

    return NextResponse.json(
      {
        error: "Unable to load product.",
      },
      {
        status: 500,
      },
    );
  }
}
