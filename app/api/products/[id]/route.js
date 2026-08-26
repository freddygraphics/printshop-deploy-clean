export const dynamic = "force-dynamic";

import prisma from "../../../../lib/db";

// -------------------------------------------------------
// GET
// -------------------------------------------------------

export async function GET(req, { params }) {
  try {
    const id = Number(params.id);

    const product = await prisma.product.findUnique({
      where: {
        id,
      },
      include: {
        template: true,

        images: {
          orderBy: {
            position: "asc",
          },
        },
      },
    });

    if (!product) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    return Response.json(product);
  } catch (error) {
    console.error("Error GET product:", error);

    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

// -------------------------------------------------------
// PUT
// -------------------------------------------------------

export async function PUT(req, { params }) {
  try {
    const id = Number(params.id);

    const body = await req.json();

    console.log("===== UPDATE PRODUCT =====");
    console.log(JSON.stringify(body, null, 2));

    const configuration = body.configuration ?? body.defaultOptions ?? {};
    const normalizedImages = Array.isArray(body.images)
      ? body.images
          .filter((item) => item?.url)
          .map((item, index) => ({
            url: item.url,
            position: index,
            isPrimary: item.url === body.image || Boolean(item.isPrimary),
          }))
      : [];
    const updated = await prisma.product.update({
      where: {
        id,
      },

      data: {
        name: body.name,

        image: body.image || normalizedImages[0]?.url || null,

        description: body.description ?? "",

        relatedService: body.relatedService ?? null,

        showOnWebsite:
          typeof body.showOnWebsite === "boolean" ? body.showOnWebsite : false,

        basePrice: Number(body.basePrice ?? 0),

        customFields: body.customFields || {},

        defaultOptions: configuration,

        images: {
          deleteMany: {},

          create: normalizedImages,
        },
      },

      include: {
        template: true,

        images: {
          orderBy: {
            position: "asc",
          },
        },
      },
    });

    return Response.json(updated);
  } catch (error) {
    console.error("❌ Error PUT product:", error);

    return Response.json(
      {
        error: error.message,
      },
      {
        status: 500,
      },
    );
  }
}

// -------------------------------------------------------
// PATCH
// -------------------------------------------------------

export async function PATCH(req, { params }) {
  try {
    const body = await req.json();

    const product = await prisma.product.update({
      where: {
        id: Number(params.id),
      },

      data: body,
    });

    return Response.json(product);
  } catch (error) {
    console.error("PATCH ERROR:", error);

    return Response.json({ error: "Patch failed" }, { status: 500 });
  }
}

// -------------------------------------------------------
// DELETE
// -------------------------------------------------------

export async function DELETE(req, { params }) {
  try {
    await prisma.product.delete({
      where: {
        id: Number(params.id),
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
