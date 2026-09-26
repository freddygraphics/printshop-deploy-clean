import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_SETTINGS = {
  inkCostPerSqft: 0,
  machineCostPerHour: 0,
  laborPerHour: 25,

  printSpeedSqftPerHour: 20,
  laborMinutesPerOrder: 10,
  cutSpeedInPerMinute: 20,

  cuttingBaseFee: 0,
  cuttingPerMinute: 0,

  gapIn: 0.125,
  sideMarginIn: 0.25,

  mediaWidthIn: 20,
  usablePrintWidthIn: 18.9,

  setupFee: 10,
  wastePercent: 10,
  profitMargin: 50,
  minimumOrderPrice: 25,
};
export async function GET() {
  try {
    let settings = await prisma.stickerPricingSettings.findFirst();

    if (!settings) {
      settings = await prisma.stickerPricingSettings.create({
        data: DEFAULT_SETTINGS,
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("GET sticker settings error:", error);

    return NextResponse.json(
      { error: "Unable to load sticker pricing settings." },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    const data = {
      inkCostPerSqft: toNumber(body.inkCostPerSqft),
      machineCostPerHour: toNumber(body.machineCostPerHour),
      laborPerHour: toNumber(body.laborPerHour),
      printSpeedSqftPerHour: toNumber(body.printSpeedSqftPerHour),
      laborMinutesPerOrder: toNumber(body.laborMinutesPerOrder),
      cutSpeedInPerMinute: toNumber(body.cutSpeedInPerMinute),
      cuttingBaseFee: toNumber(body.cuttingBaseFee),
      cuttingPerMinute: toNumber(body.cuttingPerMinute),

      gapIn: toNumber(body.gapIn),
      sideMarginIn: toNumber(body.sideMarginIn),

      mediaWidthIn: toNumber(body.mediaWidthIn),
      usablePrintWidthIn: toNumber(body.usablePrintWidthIn),

      setupFee: toNumber(body.setupFee),
      wastePercent: toNumber(body.wastePercent),
      profitMargin: toNumber(body.profitMargin),
      minimumOrderPrice: toNumber(body.minimumOrderPrice),
    };

    let settings = await prisma.stickerPricingSettings.findFirst();

    if (settings) {
      settings = await prisma.stickerPricingSettings.update({
        where: {
          id: settings.id,
        },
        data,
      });
    } else {
      settings = await prisma.stickerPricingSettings.create({
        data,
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("POST sticker settings error:", error);

    return NextResponse.json(
      { error: "Unable to save sticker pricing settings." },
      { status: 500 },
    );
  }
}

function toNumber(value) {
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}
