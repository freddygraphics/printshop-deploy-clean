import { NextResponse } from "next/server";
import { auth } from "@/lib/auth"; // ✅ NextAuth v5
import { can } from "@/lib/permissions";
export const dynamic = "force-dynamic";
import prisma from "@/lib/db";

export async function POST(req: Request) {
  const session = await auth();

  if (!session || !can((session.user as any).role, "products")) {
    return NextResponse.json(
      { error: "You do not have permission to create products" },
      { status: 403 },
    );
  }

  const body = await req.json();

  const product = await prisma.product.create({
    data: {
      name: body.name,
      basePrice: body.basePrice ?? 0, // ✅ CLAVE
      description: body.description ?? "",
      templateType: body.templateType ?? null,
      customFields: body.customFields ?? null,
      defaultOptions: body.defaultOptions ?? null,
    },
  });

  return NextResponse.json(product);
}
