import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// 🔹 GET (listar productos)
export async function GET() {
  const products = await prisma.printProduct.findMany({
    where: { active: true },
  });

  return NextResponse.json(products);
}

// 🔹 POST (crear producto)
export async function POST(req: Request) {
  const body = await req.json();

  const product = await prisma.printProduct.create({
    data: {
      name: body.name,
      sinaliteId: body.sinaliteId,
      options: body.options,
    },
  });

  return NextResponse.json(product);
}
