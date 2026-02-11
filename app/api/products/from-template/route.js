export const dynamic = "force-dynamic";

// app/api/products/from-template/route.js

import prisma from "@/lib/db"; // ðŸ”¥ IMPORTANTE: usar el prisma correcto
console.log("ðŸ”¥ API INITIALIZED /api/products/from-template");
console.log("ðŸ”¥ DATABASE URL (API):", process.env.DATABASE_URL);

export async function POST(req) {
  console.log("ðŸ”¥ POST /api/products/from-template");
  console.log("ðŸ”¥ DATABASE:", process.env.DATABASE_URL);

  try {
    const raw = await req.text();
    console.log("ðŸ“¥ RAW BODY:", raw);

    if (!raw) {
      return Response.json({ error: "Cuerpo vacÃ­o" }, { status: 400 });
    }

    let body;
    try {
      body = JSON.parse(raw);
    } catch (e) {
      console.error("âŒ JSON invÃ¡lido:", e);
      return Response.json({ error: "JSON invÃ¡lido", raw }, { status: 400 });
    }

    const {
      name,
      description,
      price,
      basePrice,
      templateType,
      customFields,
      defaultOptions,
      templateId,
    } = body;

    console.log("âž¡ name:", name);
    console.log("âž¡ templateType:", templateType);
    console.log("âž¡ customFields:", customFields);
    console.log("âž¡ defaultOptions:", defaultOptions);

    if (!name) {
      return Response.json({ error: "Falta el campo name" }, { status: 400 });
    }

    // -----------------------------------------
    // CREAR PRODUCTO EN LA BD
    // -----------------------------------------
    const product = await prisma.product.create({
      data: {
        name,
        description: description ?? "",
        price: price ?? 0,
        basePrice: basePrice ?? 0,

        templateType: templateType || null,
        templateId: templateId || null,

        customFields: customFields || {},
        defaultOptions: defaultOptions || {},
      },
    });

    console.log("âœ… PRODUCTO CREADO:", product);

    return Response.json(product);
  } catch (err) {
    console.error("âŒ ERROR API /products/from-template:", err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
}

