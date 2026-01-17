import { NextResponse } from "next/server";
import prisma from "../../../lib/db";

// ✅ GET - Obtener clientes (LIST + SEARCH)
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search");

  // ===============================
  // 🔹 SIN SEARCH → LISTAR TODOS
  // ===============================
  if (!search) {
    const clients = await prisma.client.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            quotes: true,
            invoices: true,
          },
        },
      },
    });

    return NextResponse.json(clients);
  }

  // ===============================
  // 🔹 SEARCH CORTO → NO RESULTADOS
  // ===============================
  if (search.trim().length < 2) {
    return NextResponse.json([]);
  }

  // ===============================
  // 🔹 SEARCH NORMAL (autocomplete)
  // ===============================
  const clients = await prisma.client.findMany({
    where: {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { company: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ],
    },
    orderBy: { name: "asc" },
    take: 10,
    include: {
      _count: {
        select: {
          quotes: true,
          invoices: true,
        },
      },
    },
  });

  return NextResponse.json(clients);
}

// ✅ POST - Crear un nuevo cliente
export async function POST(req) {
  try {
    const data = await req.json();

    if (!data.name) {
      return Response.json(
        { error: "El nombre es requerido" },
        { status: 400 },
      );
    }

    const newClient = await prisma.client.create({
      data: {
        name: data.name,
        company: data.company || null,
        email: data.email || null,

        phone: data.phone || null,
        address: data.address || null,
      },
    });

    return Response.json(newClient, { status: 201 });
  } catch (error) {
    console.error("❌ Error al crear cliente:", error);
    return Response.json({ error: "Error al crear cliente" }, { status: 500 });
  }
}
