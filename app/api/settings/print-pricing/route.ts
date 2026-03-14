import { NextResponse } from "next/server";
import prisma from "@/lib/db";

const SETTINGS_ID = "main";

export async function GET() {
  let settings = await prisma.printPricingSettings.findUnique({
    where: { id: SETTINGS_ID },
  });

  if (!settings) {
    settings = await prisma.printPricingSettings.create({
      data: {
        id: SETTINGS_ID,

        vinylRollPrice: 0,
        vinylRollWidth: 20,
        vinylRollLength: 1800,

        laminateRollPrice: 0,
        laminateRollWidth: 20,
        laminateRollLength: 1800,

        laborPerHour: 0,
        machineCostPerHour: 0,
        cuttingCostPerSheet: 0,

        inkCostPerSqft: 0,

        wastePercent: 0,
        setupFee: 0,

        minimumStickerPrice: 0,

        profitMargin: 40,
      },
    });
  }

  return NextResponse.json(settings);
}

export async function POST(req: Request) {
  const data = await req.json();

  const settings = await prisma.printPricingSettings.upsert({
    where: { id: SETTINGS_ID },

    update: {
      vinylRollPrice: data.vinylRollPrice,
      vinylRollWidth: data.vinylRollWidth,
      vinylRollLength: data.vinylRollLength,

      laminateRollPrice: data.laminateRollPrice,
      laminateRollWidth: data.laminateRollWidth,
      laminateRollLength: data.laminateRollLength,

      laborPerHour: data.laborPerHour,
      machineCostPerHour: data.machineCostPerHour,
      cuttingCostPerSheet: data.cuttingCostPerSheet,

      inkCostPerSqft: data.inkCostPerSqft,

      wastePercent: data.wastePercent,
      setupFee: data.setupFee,

      minimumStickerPrice: data.minimumStickerPrice,

      profitMargin: data.profitMargin,
    },

    create: {
      id: SETTINGS_ID,

      vinylRollPrice: data.vinylRollPrice,
      vinylRollWidth: data.vinylRollWidth,
      vinylRollLength: data.vinylRollLength,

      laminateRollPrice: data.laminateRollPrice,
      laminateRollWidth: data.laminateRollWidth,
      laminateRollLength: data.laminateRollLength,

      laborPerHour: data.laborPerHour,
      machineCostPerHour: data.machineCostPerHour,
      cuttingCostPerSheet: data.cuttingCostPerSheet,

      inkCostPerSqft: data.inkCostPerSqft,

      wastePercent: data.wastePercent,
      setupFee: data.setupFee,

      minimumStickerPrice: data.minimumStickerPrice,

      profitMargin: data.profitMargin,
    },
  });

  return NextResponse.json(settings);
}
