import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import prisma from "@/lib/db";

export async function GET() {
  const profiles = await prisma.printProductionProfile.findMany({
    orderBy: { name: "asc" },
  });

  return NextResponse.json(profiles);
}

export async function POST(req: Request) {
  const body = await req.json();

  const profile = await prisma.printProductionProfile.create({
    data: {
      name: body.name,
      machine: body.machine,
      processId: body.processId,
      materialId: body.materialId,

      minWidth: body.minWidth,
      maxWidth: body.maxWidth,
      minHeight: body.minHeight,
      maxHeight: body.maxHeight,

      allowKissCut: body.allowKissCut ?? false,
      allowDieCut: body.allowDieCut ?? false,

      laminationId: body.laminationId ?? null,
      wastePercent: body.wastePercent ?? 10,
      setupCost: body.setupCost ?? 0,
      isActive: true,
    },
  });

  return NextResponse.json(profile);
}

export async function PUT(req: Request) {
  const body = await req.json();
  const { id } = body; // 👈 ESTA LÍNEA FALTABA

  if (!id) {
    return NextResponse.json({ error: "Missing profile id" }, { status: 400 });
  }

  const profile = await prisma.printProductionProfile.update({
    where: { id },
    data: {
      name: body.name,
      machine: body.machine,
      processId: body.processId,
      materialId: body.materialId,

      minWidth: body.minWidth,
      maxWidth: body.maxWidth,
      minHeight: body.minHeight,
      maxHeight: body.maxHeight,

      allowKissCut: body.allowKissCut ?? false,
      allowDieCut: body.allowDieCut ?? false,

      laminationId: body.laminationId ?? null,
      wastePercent: body.wastePercent ?? 10,
      setupCost: body.setupCost ?? 0,

      isActive: body.isActive ?? true,
    },
  });

  return NextResponse.json(profile);
}
