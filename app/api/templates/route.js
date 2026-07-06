export const dynamic = "force-dynamic";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

//
// OBTENER TODAS LAS PLANTILLAS
//
export async function GET() {
  try {
    const templates = await prisma.template.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return Response.json(templates);
  } catch (err) {
    console.error("Error loading templates:", err);

    return Response.json(
      {
        error: err.message,
      },
      {
        status: 500,
      },
    );
  }
}

//
// CREAR TEMPLATE
//
export async function POST(req) {
  try {
    const body = await req.json();

    console.log("BODY TEMPLATE");
    console.log(JSON.stringify(body, null, 2));

    const newTemplate = await prisma.template.create({
      data: {
        name: body.name,
        slug: body.slug,
        description: body.description ?? "",
        icon: body.icon ?? "",
        category: body.category ?? null,
        active: true,

        configuration: body.configuration ?? {
          sections: {},
          productOptions: [],
          pricing: [],
          inventory: {},
          supplier: {},
          metadata: {},
        },

        fields: body.fields ?? [],
        options: body.options ?? [],
      },
    });

    return Response.json(newTemplate);
  } catch (err) {
    console.error(err);

    return Response.json(
      {
        error: err.message,
      },
      {
        status: 500,
      },
    );
  }
}
