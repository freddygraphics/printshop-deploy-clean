export const dynamic = "force-dynamic";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

//
// GET TEMPLATE
//
export async function GET(req, { params }) {
  try {
    const template = await prisma.template.findUnique({
      where: {
        id: Number(params.id),
      },
    });

    if (!template) {
      return Response.json(
        {
          error: "Template not found",
        },
        {
          status: 404,
        },
      );
    }

    return Response.json(template);
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

//
// UPDATE TEMPLATE
//
export async function PUT(req, { params }) {
  try {
    const body = await req.json();

    const template = await prisma.template.update({
      where: {
        id: Number(params.id),
      },
      data: {
        name: body.name,
        slug: body.slug,
        description: body.description,
        icon: body.icon,
        type: body.type,
        category: body.category,
        configuration: body.configuration,
        fields: body.fields,
        options: body.options,
        active: body.active,
      },
    });

    return Response.json(template);
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

//
// DELETE TEMPLATE
//
export async function DELETE(req, { params }) {
  try {
    await prisma.template.delete({
      where: {
        id: Number(params.id),
      },
    });

    return Response.json({
      success: true,
    });
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
