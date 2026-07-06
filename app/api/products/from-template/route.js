export const dynamic = "force-dynamic";

import prisma from "@/lib/db";

console.log("🔥 API INITIALIZED /api/products/from-template");
console.log("🔥 DATABASE URL:", process.env.DATABASE_URL);

export async function POST(req) {
  console.log("🔥 POST /api/products/from-template");

  try {
    const body = await req.json();

    const {
      name,
      description,
      basePrice,
      templateType,
      customFields,
      defaultOptions,
      templateId,

      // 🔥 SINALITE
      sinaliteEnabled,
      sinaliteId,
      sinaliteOptions,
      profitMargin,
    } = body;

    console.log("➡ name:", name);
    console.log("➡ templateType:", templateType);

    if (!name) {
      return Response.json({ error: "Name is required" }, { status: 400 });
    }

    let template = null;

    // 🔎 Buscar template por ID si viene
    if (templateId) {
      template = await prisma.template.findUnique({
        where: { id: Number(templateId) },
      });
    }

    // 🔎 Si no existe, buscar por TYPE
    if (!template && templateType) {
      template = await prisma.template.findFirst({
        where: { type: templateType },
      });
    }

    if (!template) {
      return Response.json({ error: "Template not found" }, { status: 400 });
    }

    // -----------------------------------------
    // CREAR PRODUCTO
    // -----------------------------------------
    console.log(
      "CONFIG COPIED:",
      JSON.stringify(template.configuration, null, 2),
    );
    const product = await prisma.product.create({
      data: {
        // 🔥 SINALITE
        sinaliteEnabled: sinaliteEnabled ?? false,
        sinaliteId: sinaliteId ?? null,
        sinaliteOptions: sinaliteOptions ?? null,
        profitMargin: Number(profitMargin ?? 1.5),
        name,
        description: description ?? "",
        basePrice: Number(basePrice ?? 0),

        templateType: body.templateSlug ?? template.slug,

        template: {
          connect: { id: template.id },
        },

        customFields: customFields ?? {},

        defaultOptions:
          Object.keys(defaultOptions ?? {}).length > 0
            ? defaultOptions
            : (template.configuration ?? {}),
      },
    });

    console.log("✅ PRODUCT CREATED:", product);

    return Response.json(product);
  } catch (err) {
    console.error("❌ ERROR:", err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
