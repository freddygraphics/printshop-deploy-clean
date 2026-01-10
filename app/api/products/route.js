import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { can } from "@/lib/permissions";

// app/api/products/route.js

import prisma from "../../../lib/db";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { id: "asc" },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        basePrice: true,
        templateId: true,
        customFields: true,
        defaultOptions: true,
      },
    });

    return Response.json(products);
  } catch (err) {
    console.error("🔥 ERROR GET /api/products:", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// -------------------------------------------------------
// POST → Crear producto
// -------------------------------------------------------
export async function POST(req) {
  const session = await getServerSession(authOptions);

  if (!session || !can(session.user.role, "products")) {
    return NextResponse.json(
      { error: "You do not have permission to create products" },
      { status: 403 }
    );
  }

  const body = await req.json();

  const product = await prisma.product.create({
    data: {
      name: body.name,
      price: body.price,
      description: body.description,
    },
  });

  return NextResponse.json(product);
}
