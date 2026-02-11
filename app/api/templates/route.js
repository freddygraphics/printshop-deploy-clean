export const dynamic = "force-dynamic";

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

//
// ðŸ”¹ OBTENER TODAS LAS PLANTILLAS
//
export async function GET() {
  try {
    const templates = await prisma.template.findMany({
      orderBy: { createdAt: "desc" },
    });

    return Response.json(templates);
  } catch (err) {
    console.error("âŒ Error al obtener templates:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

//
// ðŸ”¹ CREAR UNA NUEVA PLANTILLA
//
export async function POST(req) {
  try {
    const text = await req.text();
    if (!text) {
      return Response.json(
        { error: "El cuerpo estÃ¡ vacÃ­o" },
        { status: 400 },
      );
    }

    const body = JSON.parse(text);
    const { name, category, description } = body;

    if (!name) {
      return Response.json(
        { error: "El campo 'name' es requerido" },
        { status: 400 },
      );
    }

    const newTemplate = await prisma.template.create({
      data: {
        name,
        category: category || null,
        description: description || null,
      },
    });

    console.log("âœ… Template creado:", newTemplate);
    return Response.json(newTemplate);
  } catch (err) {
    console.error("âŒ Error al crear template:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

