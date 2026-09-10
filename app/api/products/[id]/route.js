export const dynamic = "force-dynamic";

import prisma from "../../../../lib/db";

// -------------------------------------------------------
// HELPERS
// -------------------------------------------------------

function isNumericIdentifier(value) {
  return /^\d+$/.test(String(value));
}

function slugify(text = "") {
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function generateUniqueSlug(name, currentProductId = null) {
  const baseSlug = slugify(name);

  if (!baseSlug) {
    return null;
  }

  let slug = baseSlug;
  let counter = 2;

  while (true) {
    const existing = await prisma.product.findUnique({
      where: {
        slug,
      },
    });

    if (!existing || existing.id === currentProductId) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

// -------------------------------------------------------
// GET
// Acepta ID o SLUG
// /api/products/39
// /api/products/standard-business-cards
// -------------------------------------------------------

export async function GET(req, { params }) {
  try {
    const { id: identifier } = await params;

    if (!identifier) {
      return Response.json(
        { error: "Product identifier is required" },
        { status: 400 },
      );
    }

    let product;

    if (isNumericIdentifier(identifier)) {
      const id = Number(identifier);

      product = await prisma.product.findUnique({
        where: {
          id,
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
    } else {
      product = await prisma.product.findUnique({
        where: {
          slug: identifier,
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
    }

    if (!product) {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }

    return Response.json(product);
  } catch (error) {
    console.error("Error GET product:", error);

    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

// -------------------------------------------------------
// PUT
// Sigue usando ID
// -------------------------------------------------------

export async function PUT(req, { params }) {
  try {
    const { id: identifier } = await params;

    const id = Number(identifier);

    if (!Number.isInteger(id) || id <= 0) {
      return Response.json({ error: "Invalid product id" }, { status: 400 });
    }

    const body = await req.json();

    // ---------------------------------------------
    // PRODUCT CATEGORY
    // ---------------------------------------------

    const normalizedCategoryId =
      body.categoryId === null ||
      body.categoryId === undefined ||
      body.categoryId === ""
        ? null
        : Number(body.categoryId);

    if (
      normalizedCategoryId !== null &&
      (!Number.isInteger(normalizedCategoryId) || normalizedCategoryId <= 0)
    ) {
      return Response.json(
        { error: "Invalid product category." },
        { status: 400 },
      );
    }

    if (normalizedCategoryId !== null) {
      const productCategory = await prisma.productCategory.findUnique({
        where: {
          id: normalizedCategoryId,
        },
      });

      if (!productCategory) {
        return Response.json(
          { error: "Product category not found." },
          { status: 400 },
        );
      }
    }

    console.log("===== UPDATE PRODUCT =====");
    console.log(JSON.stringify(body, null, 2));

    // ---------------------------------------------
    // CURRENT PRODUCT
    // ---------------------------------------------

    const currentProduct = await prisma.product.findUnique({
      where: {
        id,
      },
    });

    if (!currentProduct) {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }

    // ---------------------------------------------
    // SLUG
    // Si cambia el nombre, actualiza el slug
    // ---------------------------------------------

    let slug = currentProduct.slug;

    if (body.name && body.name.trim() !== currentProduct.name.trim()) {
      slug = await generateUniqueSlug(body.name, id);
    }

    // Si por alguna razón no tenía slug, créalo
    if (!slug && body.name) {
      slug = await generateUniqueSlug(body.name, id);
    }

    // ---------------------------------------------
    // CONFIGURATION
    // ---------------------------------------------

    const configuration = body.configuration ?? body.defaultOptions ?? {};

    // ---------------------------------------------
    // IMAGES
    // ---------------------------------------------

    const normalizedImages = Array.isArray(body.images)
      ? body.images
          .filter((item) => item?.url)
          .map((item, index) => ({
            url: item.url,
            position: index,
            isPrimary: item.url === body.image || Boolean(item.isPrimary),
          }))
      : [];

    // ---------------------------------------------
    // UPDATE PRODUCT
    // ---------------------------------------------

    const updated = await prisma.product.update({
      where: {
        id,
      },

      data: {
        name: body.name,

        slug,

        image: body.image || normalizedImages[0]?.url || null,

        description: body.description ?? "",

        // -----------------------------------------
        // RELATED SERVICE
        // -----------------------------------------

        relatedService: body.relatedService ?? null,

        // -----------------------------------------
        // PRODUCT CATEGORY
        // -----------------------------------------

        categoryId: normalizedCategoryId,

        // -----------------------------------------
        // WEBSITE
        // -----------------------------------------

        showOnWebsite:
          typeof body.showOnWebsite === "boolean" ? body.showOnWebsite : false,

        // -----------------------------------------
        // PRICING
        // -----------------------------------------

        basePrice: Number(body.basePrice ?? 0),

        customFields: body.customFields || {},

        defaultOptions: configuration,

        // -----------------------------------------
        // IMAGES
        // -----------------------------------------

        images: {
          deleteMany: {},
          create: normalizedImages,
        },
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

    console.log("✅ PRODUCT UPDATED:", {
      id: updated.id,
      name: updated.name,
      slug: updated.slug,
      relatedService: updated.relatedService,
      categoryId: updated.categoryId,
      productCategory: updated.productCategory?.name,
    });

    return Response.json(updated);
  } catch (error) {
    console.error("❌ Error PUT product:", error);

    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Unexpected server error",
      },
      {
        status: 500,
      },
    );
  }
}

// -------------------------------------------------------
// PATCH
// Sigue usando ID
// -------------------------------------------------------

export async function PATCH(req, { params }) {
  try {
    const { id: identifier } = await params;

    const id = Number(identifier);

    if (!Number.isInteger(id) || id <= 0) {
      return Response.json({ error: "Invalid product id" }, { status: 400 });
    }

    const body = await req.json();

    const currentProduct = await prisma.product.findUnique({
      where: {
        id,
      },
    });

    if (!currentProduct) {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }

    const data = {
      ...body,
    };

    // Si PATCH cambia el nombre, actualizar slug
    if (body.name && body.name.trim() !== currentProduct.name.trim()) {
      data.slug = await generateUniqueSlug(body.name, id);
    }

    const product = await prisma.product.update({
      where: {
        id,
      },

      data,
    });

    return Response.json(product);
  } catch (error) {
    console.error("PATCH ERROR:", error);

    return Response.json({ error: "Patch failed" }, { status: 500 });
  }
}

// -------------------------------------------------------
// DELETE
// Sigue usando ID
// -------------------------------------------------------

export async function DELETE(req, { params }) {
  try {
    const { id: identifier } = await params;

    const id = Number(identifier);

    if (!Number.isInteger(id) || id <= 0) {
      return Response.json({ error: "Invalid product id" }, { status: 400 });
    }

    await prisma.product.delete({
      where: {
        id,
      },
    });

    return Response.json({
      success: true,
    });
  } catch (error) {
    console.error("DELETE ERROR:", error);

    return Response.json({ error: "Delete failed" }, { status: 500 });
  }
}
