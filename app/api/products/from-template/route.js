// app/api/products/from-template/route.js

import prisma from "@/lib/db";   // 🔥 IMPORTANTE: usar el prisma correcto
console.log("🔥 API INITIALIZED /api/products/from-template");
console.log("🔥 DATABASE URL (API):", process.env.DATABASE_URL);


export async function POST(req) {
  console.log("🔥 POST /api/products/from-template");
  console.log("🔥 DATABASE:", process.env.DATABASE_URL);

  try {
    const raw = await req.text();
    console.log("📥 RAW BODY:", raw);

    if (!raw) {
      return Response.json({ error: "Cuerpo vacío" }, { status: 400 });
    }

    let body;
    try {
      body = JSON.parse(raw);
    } catch (e) {
      console.error("❌ JSON inválido:", e);
      return Response.json({ error: "JSON inválido", raw }, { status: 400 });
    }

    const {
      name,
      description,
      price,
      basePrice,
      templateType,
      customFields,
      defaultOptions,
      templateId
    } = body;

    console.log("➡ name:", name);
    console.log("➡ templateType:", templateType);
    console.log("➡ customFields:", customFields);
    console.log("➡ defaultOptions:", defaultOptions);

    if (!name) {
      return Response.json(
        { error: "Falta el campo name" },
        { status: 400 }
      );
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

    console.log("✅ PRODUCTO CREADO:", product);

    return Response.json(product);

  } catch (err) {
    console.error("❌ ERROR API /products/from-template:", err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
