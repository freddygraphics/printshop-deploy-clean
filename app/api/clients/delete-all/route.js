import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST() {
  try {
    await prisma.client.deleteMany({});
    return NextResponse.json({ message: "Todos los clientes fueron eliminados" });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
