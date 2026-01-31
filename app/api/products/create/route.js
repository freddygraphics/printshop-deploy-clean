import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { can } from "@/lib/permissions";
import prisma from "@/lib/db";

export async function POST(req) {
  const session = await getServerSession(authOptions);

  if (!session || !can(session.user.role, "products")) {
    return NextResponse.json(
      { error: "You do not have permission to create products" },
      { status: 403 },
    );
  }

  const body = await req.json();

  const product = await prisma.product.create({
    data: {
      name: body.name,
      price: body.price,
      basePrice: body.basePrice ?? null,
      description: body.description ?? "",
      templateType: body.templateType ?? null,
      customFields: body.customFields ?? null,
      defaultOptions: body.defaultOptions ?? null,
    },
  });

  return NextResponse.json(product);
}
