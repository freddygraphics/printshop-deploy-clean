import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/* ==========================================
   GET
========================================== */

export async function GET() {
  try {
    const groups = await prisma.productOptionLibrary.findMany({
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(groups);
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      { error: "Unable to load option library" },
      { status: 500 },
    );
  }
}

/* ==========================================
   POST
========================================== */

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    if (!body.key?.trim()) {
      return NextResponse.json({ error: "Key is required" }, { status: 400 });
    }

    const exists = await prisma.productOptionLibrary.findFirst({
      where: {
        key: body.key,
      },
    });

    if (exists) {
      return NextResponse.json(
        { error: "Key already exists" },
        { status: 400 },
      );
    }

    const group = await prisma.productOptionLibrary.create({
      data: {
        name: body.name,
        key: body.key,
        type: body.type,
        values: body.values ?? [],
      },
    });

    return NextResponse.json(group);
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      { error: "Unable to create option group" },
      { status: 500 },
    );
  }
}
/* ==========================================
   PUT
========================================== */

export async function PUT(req: Request) {
  try {
    const body = await req.json();

    const group = await prisma.productOptionLibrary.update({
      where: {
        id: body.id,
      },
      data: {
        name: body.name,
        key: body.key,
        type: body.type,
        values: body.values,
      },
    });

    return NextResponse.json(group);
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      { error: "Unable to update option group" },
      { status: 500 },
    );
  }
}
/* ==========================================
   DELETE
========================================== */

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    await prisma.productOptionLibrary.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      { error: "Unable to delete option group" },
      { status: 500 },
    );
  }
}
