// /app/api/clients/[id]/notes/route.js
import { NextResponse } from "next/server";
import prisma from "../../../../../lib/db";

export async function GET(req, { params }) {
  const id = parseInt(params.id);

  try {
    const notes = await prisma.note.findMany({
      where: { clientId: id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(notes);
  } catch (error) {
    console.error("❌ Error al obtener notas:", error);
    return NextResponse.json(
      { error: "Error al obtener notas" },
      { status: 500 }
    );
  }
}

export async function POST(req, { params }) {
  const id = parseInt(params.id);
  const body = await req.json();
  const { content, type, createdBy } = body;

  if (!content || !content.trim()) {
    return NextResponse.json(
      { error: "El contenido de la nota es requerido" },
      { status: 400 }
    );
  }

  try {
    const note = await prisma.note.create({
      data: {
        clientId: id,
        content: content.trim(),
        type: type || "note",
        createdBy: createdBy || null,
      },
    });

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error("❌ Error al crear nota:", error);
    return NextResponse.json(
      { error: "Error al crear nota" },
      { status: 500 }
    );
  }
}
