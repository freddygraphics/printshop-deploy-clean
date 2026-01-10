import prisma from "../../../../lib/db";

export async function GET(req, { params }) {
  try {
    const id = Number(params.id);

    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    return Response.json(product);
  } catch (error) {
    console.error("❌ Error GET product:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

// -------------------------------------------------------
// PUT → Editar producto
// -------------------------------------------------------
export async function PUT(req, { params }) {
  try {
    const id = Number(params.id);
    const body = await req.json();

    const updated = await prisma.product.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description ?? "",
        price: body.price ?? 0,
        basePrice: body.basePrice ?? 0,
        templateId: body.templateId ?? null,
        customFields: body.customFields || {},
        defaultOptions: body.defaultOptions || {},
      },
    });

    return Response.json(updated);
  } catch (error) {
    console.error("❌ Error PUT product:", error);
    return Response.json({ error: "Error updating product" }, { status: 500 });
  }
}

// -------------------------------------------------------
// DELETE → opcional
// -------------------------------------------------------

export async function PATCH(req, { params }) {
  const session = await getServerSession(authOptions);

  if (!session || !can(session.user.role, "products")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json();

  const product = await prisma.product.update({
    where: { id: Number(params.id) },
    data: body,
  });

  return NextResponse.json(product);
}

export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions);

  if (!session || !can(session.user.role, "products")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  await prisma.product.delete({
    where: { id: Number(params.id) },
  });

  return NextResponse.json({ success: true });
}
