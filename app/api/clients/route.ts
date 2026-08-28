import { NextResponse } from "next/server";

import prisma from "@/lib/db";

// ===============================
// GET — Listar / Buscar clientes
// ===============================

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search");

    // 🔹 Sin search → listar todos
    if (!search) {
      const clients = await prisma.client.findMany({
        where: {
          deletedAt: null,
        },

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

    // 🔹 Search corto → vacío
    if (search.trim().length < 2) {
      return NextResponse.json([]);
    }

    // 🔹 Search normal
    const clients = await prisma.client.findMany({
      where: {
        deletedAt: null,

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
  } catch (error) {
    console.error("❌ /api/clients GET:", error);

    return NextResponse.json(
      { error: "Server error", details: String(error) },
      { status: 500 },
    );
  }
}

// ===============================
// POST — Crear cliente
// ===============================

export async function POST(req: Request) {
  try {
    const data = await req.json();

    if (!data.name) {
      return NextResponse.json(
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

    return NextResponse.json(newClient, { status: 201 });
  } catch (error) {
    console.error("❌ /api/clients POST:", error);

    return NextResponse.json(
      { error: "Error al crear cliente", details: String(error) },
      { status: 500 },
    );
  }
}
