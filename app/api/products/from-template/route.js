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
      category,
      relatedService,
      basePrice,
      templateType,
      templateSlug,
      customFields,
      defaultOptions,
      templateId,
      sinaliteEnabled,
      sinaliteId,
      sinaliteOptions,
      profitMargin,
    } = body;

    console.log("➡ name:", name);
    console.log("➡ category:", category);
    console.log("➡ templateType:", templateType);
    console.log("➡ templateSlug:", templateSlug);
    console.log("➡ templateId:", templateId);

    if (!name?.trim()) {
      return Response.json({ error: "Name is required" }, { status: 400 });
    }

    const normalizedCategory =
      category && category !== "standard"
        ? String(category).trim().toLowerCase()
        : null;

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
    ];

    const isSpecialProduct =
      specialProductTypes.includes(requestedType) ||
      specialProductTypes.includes(normalizedCategory);

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

    const resolvedTemplateType =
      requestedType || template?.slug || template?.type || null;

    const resolvedDefaultOptions =
      defaultOptions &&
      typeof defaultOptions === "object" &&
      !Array.isArray(defaultOptions) &&
      Object.keys(defaultOptions).length > 0
        ? defaultOptions
        : template?.configuration || {};

    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        description: description?.trim() || "",

        category:
          normalizedCategory || (isSpecialProduct ? requestedType : null),

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
    });

    console.log("✅ PRODUCT CREATED:", {
      id: product.id,
      name: product.name,
      category: product.category,
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
