export const dynamic = "force-dynamic";

import prisma from "@/lib/db";

console.log("🔥 API INITIALIZED /api/products/from-template");

export async function POST(req) {
  console.log("🔥 POST /api/products/from-template");

  try {
    const body = await req.json();

    const {
      name,
      sku,
      description,
      image,
      images,

      category,
      categoryId,
      relatedService,

      basePrice,
      pricingMode,

      // TEMPORAL:
      // Más adelante se llamará configuratorType.
      templateType,

      customFields,
      defaultOptions,
      configuration,

      sinaliteEnabled,
      sinaliteId,
      sinaliteOptions,
      profitMargin,

      showOnWebsite,
    } = body;

    console.log("➡ name:", name);
    console.log("➡ category:", category);
    console.log("➡ categoryId:", categoryId);
    console.log("➡ configurator/templateType:", templateType);

    // -------------------------------------------------------
    // VALIDATION
    // -------------------------------------------------------

    if (!name?.trim()) {
      return Response.json(
        {
          error: "Name is required",
        },
        {
          status: 400,
        },
      );
    }

    // -------------------------------------------------------
    // PRODUCT TYPE / CONFIGURATOR
    // -------------------------------------------------------

    const normalizedCategory =
      category && category !== "standard"
        ? String(category).trim().toLowerCase()
        : null;

    const normalizedTemplateType =
      templateType && templateType !== "standard"
        ? String(templateType).trim().toLowerCase()
        : normalizedCategory;

    // -------------------------------------------------------
    // PRODUCT CATEGORY
    // -------------------------------------------------------

    const normalizedCategoryId =
      categoryId === null || categoryId === undefined || categoryId === ""
        ? null
        : Number(categoryId);

    if (
      normalizedCategoryId !== null &&
      (!Number.isInteger(normalizedCategoryId) || normalizedCategoryId <= 0)
    ) {
      return Response.json(
        {
          error: "Invalid product category.",
        },
        {
          status: 400,
        },
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
          {
            error: "Product category not found.",
          },
          {
            status: 400,
          },
        );
      }
    }

    // -------------------------------------------------------
    // DEFAULT OPTIONS
    // -------------------------------------------------------
    //
    // Product is now the source of truth.
    //
    // configuration is kept temporarily for compatibility
    // with older callers.
    // -------------------------------------------------------

    const resolvedDefaultOptions =
      defaultOptions &&
      typeof defaultOptions === "object" &&
      !Array.isArray(defaultOptions)
        ? defaultOptions
        : configuration &&
            typeof configuration === "object" &&
            !Array.isArray(configuration)
          ? configuration
          : {};

    // -------------------------------------------------------
    // CUSTOM FIELDS
    // -------------------------------------------------------

    const resolvedCustomFields =
      customFields &&
      typeof customFields === "object" &&
      !Array.isArray(customFields)
        ? customFields
        : {};

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

    // Ensure exactly one primary image if images exist.
    if (
      normalizedImages.length > 0 &&
      !normalizedImages.some((item) => item.isPrimary)
    ) {
      normalizedImages[0].isPrimary = true;
    }

    // -------------------------------------------------------
    // CREATE PRODUCT
    // -------------------------------------------------------

    const product = await prisma.product.create({
      data: {
        name: name.trim(),

        sku: sku && String(sku).trim() ? String(sku).trim() : null,

        description:
          description && String(description).trim()
            ? String(description).trim()
            : "",

        image:
          image ||
          normalizedImages.find((item) => item.isPrimary)?.url ||
          normalizedImages[0]?.url ||
          null,

        ...(normalizedImages.length > 0
          ? {
              images: {
                create: normalizedImages,
              },
            }
          : {}),

        // ---------------------------------------------------
        // CONFIGURATOR TYPE
        //
        // category/templateType todavía son campos legacy.
        // Después los reemplazaremos por configuratorType.
        // ---------------------------------------------------

        category: normalizedCategory,

        templateType: normalizedTemplateType,

        // ---------------------------------------------------
        // PRODUCT CATEGORY
        // ---------------------------------------------------

        ...(normalizedCategoryId !== null
          ? {
              productCategory: {
                connect: {
                  id: normalizedCategoryId,
                },
              },
            }
          : {}),

        // ---------------------------------------------------
        // RELATED SERVICE
        // ---------------------------------------------------

        relatedService:
          relatedService && String(relatedService).trim()
            ? String(relatedService).trim()
            : null,

        // ---------------------------------------------------
        // PRICING
        // ---------------------------------------------------

        pricingMode:
          pricingMode && String(pricingMode).trim()
            ? String(pricingMode).trim()
            : "manual",

        basePrice: Number(basePrice ?? 0),

        profitMargin: Number(profitMargin ?? 1.5),

        // ---------------------------------------------------
        // PRODUCT CONFIGURATION
        // ---------------------------------------------------

        customFields: resolvedCustomFields,

        defaultOptions: resolvedDefaultOptions,

        // ---------------------------------------------------
        // SINALITE
        // ---------------------------------------------------

        sinaliteEnabled: Boolean(sinaliteEnabled),

        sinaliteId:
          sinaliteId === null || sinaliteId === undefined || sinaliteId === ""
            ? null
            : Number(sinaliteId),

        sinaliteOptions: sinaliteOptions || null,

        // ---------------------------------------------------
        // WEBSITE
        // ---------------------------------------------------

        showOnWebsite: Boolean(showOnWebsite),
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
