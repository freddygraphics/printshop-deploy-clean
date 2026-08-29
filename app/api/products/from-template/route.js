export const dynamic = "force-dynamic";

import prisma from "@/lib/db";

console.log("🔥 API INITIALIZED /api/products/from-template");

export async function POST(req) {
  console.log("🔥 POST /api/products/from-template");

  try {
    const body = await req.json();

    const {
      name,
      description,
      image,
      images,
      category,
      categoryId,
      relatedService,
      basePrice,
      templateType,
      templateSlug,
      customFields,
      defaultOptions,
      configuration,
      templateId,
      sinaliteEnabled,
      sinaliteId,
      sinaliteOptions,
      profitMargin,
    } = body;

    console.log("➡ name:", name);
    console.log("➡ category:", category);
    console.log("➡ categoryId:", categoryId);
    console.log("➡ templateType:", templateType);
    console.log("➡ templateSlug:", templateSlug);
    console.log("➡ templateId:", templateId);

    // -------------------------------------------------------
    // VALIDATION
    // -------------------------------------------------------

    if (!name?.trim()) {
      return Response.json({ error: "Name is required" }, { status: 400 });
    }

    // -------------------------------------------------------
    // CATEGORY
    // -------------------------------------------------------

    const normalizedCategory =
      category && category !== "standard"
        ? String(category).trim().toLowerCase()
        : null;

    const normalizedCategoryId =
      categoryId === null || categoryId === undefined || categoryId === ""
        ? null
        : Number(categoryId);

    if (
      normalizedCategoryId !== null &&
      (!Number.isInteger(normalizedCategoryId) || normalizedCategoryId <= 0)
    ) {
      return Response.json(
        { error: "Invalid product category." },
        { status: 400 },
      );
    }

    let selectedProductCategory = null;

    if (normalizedCategoryId !== null) {
      selectedProductCategory = await prisma.productCategory.findUnique({
        where: {
          id: normalizedCategoryId,
        },
      });

      if (!selectedProductCategory) {
        return Response.json(
          { error: "Product category not found." },
          { status: 400 },
        );
      }
    }

    // -------------------------------------------------------
    // TEMPLATE TYPE
    // -------------------------------------------------------

    const requestedType = String(
      templateSlug || templateType || normalizedCategory || "",
    )
      .trim()
      .toLowerCase();

    const specialProductTypes = [
      "stickers",
      "sticker",
      "apparel",
      "raffle-tickets",
      "raffle-ticket",
      "truck-lettering",
    ];

    const isSpecialProduct =
      specialProductTypes.includes(requestedType) ||
      specialProductTypes.includes(normalizedCategory);

    // -------------------------------------------------------
    // FIND TEMPLATE
    // -------------------------------------------------------

    let template = null;

    const numericTemplateId = Number(templateId);

    if (Number.isInteger(numericTemplateId) && numericTemplateId > 0) {
      template = await prisma.template.findUnique({
        where: {
          id: numericTemplateId,
        },
      });
    }

    if (!template && requestedType) {
      template = await prisma.template.findFirst({
        where: {
          OR: [{ slug: requestedType }, { type: requestedType }],
        },
      });
    }

    if (!template && !isSpecialProduct) {
      return Response.json(
        {
          error: `Template not found: ${requestedType || "unknown"}`,
        },
        { status: 400 },
      );
    }

    // -------------------------------------------------------
    // DEFAULT OPTIONS
    // -------------------------------------------------------

    const resolvedTemplateType =
      requestedType || template?.slug || template?.type || null;

    const resolvedDefaultOptions =
      configuration &&
      typeof configuration === "object" &&
      !Array.isArray(configuration) &&
      Object.keys(configuration).length > 0
        ? configuration
        : defaultOptions &&
            typeof defaultOptions === "object" &&
            !Array.isArray(defaultOptions) &&
            Object.keys(defaultOptions).length > 0
          ? defaultOptions
          : template?.configuration || {};

    // -------------------------------------------------------
    // IMAGES
    // -------------------------------------------------------

    const normalizedImages = Array.isArray(images)
      ? images
          .filter((item) => item?.url)
          .map((item, index) => ({
            url: item.url,
            position: index,
            isPrimary: item.url === image || Boolean(item.isPrimary),
          }))
      : [];

    // -------------------------------------------------------
    // CREATE PRODUCT
    // -------------------------------------------------------

    const product = await prisma.product.create({
      data: {
        name: name.trim(),

        description: description?.trim() || "",

        image: image || normalizedImages[0]?.url || null,

        ...(normalizedImages.length > 0
          ? {
              images: {
                create: normalizedImages,
              },
            }
          : {}),

        category:
          normalizedCategory || (isSpecialProduct ? requestedType : null),

        // ✅ NUEVA RELACIÓN DE CATEGORÍA
        ...(normalizedCategoryId
          ? {
              productCategory: {
                connect: {
                  id: normalizedCategoryId,
                },
              },
            }
          : {}),

        relatedService:
          relatedService && String(relatedService).trim()
            ? String(relatedService).trim()
            : null,

        basePrice: Number(basePrice ?? 0),

        templateType: resolvedTemplateType,

        customFields: customFields || {},

        defaultOptions: resolvedDefaultOptions,

        sinaliteEnabled: Boolean(sinaliteEnabled),

        sinaliteId:
          sinaliteId === null || sinaliteId === undefined || sinaliteId === ""
            ? null
            : Number(sinaliteId),

        sinaliteOptions: sinaliteOptions || null,

        profitMargin: Number(profitMargin ?? 1.5),

        ...(template
          ? {
              template: {
                connect: {
                  id: template.id,
                },
              },
            }
          : {}),
      },

      include: {
        productCategory: true,

        images: {
          orderBy: {
            position: "asc",
          },
        },
      },
    });

    // -------------------------------------------------------
    // SUCCESS
    // -------------------------------------------------------

    console.log("✅ PRODUCT CREATED:", {
      id: product.id,
      name: product.name,
      category: product.category,
      productCategory: product.productCategory?.name || null,
      templateType: product.templateType,
      templateId: product.templateId,
    });

    return Response.json(product, {
      status: 201,
    });
  } catch (err) {
    console.error("❌ ERROR:", err);

    return Response.json(
      {
        error: err instanceof Error ? err.message : "Unexpected server error",
      },
      {
        status: 500,
      },
    );
  }
}
