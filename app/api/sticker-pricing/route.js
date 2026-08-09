import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// 🔥 GET
export async function GET() {
  let data = await prisma.stickerSheetPricing.findMany();

  // AUTO-SEED
  if (data.length === 0) {
    await prisma.stickerSheetPricing.createMany({
      data: [
        {
          name: "Regular",
          sheetWidth: 11,
          sheetHeight: 17,
          costPerSheet: 2.8,
          laminateCost: 1,
          cutCost: 0.5,
          wastePercent: 10,
          profitMargin: 40,
        },
        {
          name: "Transparente",
          sheetWidth: 11,
          sheetHeight: 17,
          costPerSheet: 4.5,
          laminateCost: 1.2,
          cutCost: 0.5,
          wastePercent: 10,
          profitMargin: 45,
        },
      ],
      skipDuplicates: true,
    });

    data = await prisma.stickerSheetPricing.findMany();
  }

  return NextResponse.json(data);
}

// 🔥 POST (GUARDAR)
export async function POST(req) {
  try {
    const body = await req.json();

    const pricingData = {
      name: body.name,

      sheetWidth: Number(body.sheetWidth ?? 11),
      sheetHeight: Number(body.sheetHeight ?? 17),

      costPerSheet: Number(body.costPerSheet),
      laminateCost: Number(body.laminateCost),
      cutCost: Number(body.cutCost),
      wastePercent: Number(body.wastePercent),
      profitMargin: Number(body.profitMargin),
    };

    const result = body.id
      ? await prisma.stickerSheetPricing.update({
          where: {
            id: body.id,
          },
          data: pricingData,
        })
      : await prisma.stickerSheetPricing.create({
          data: pricingData,
        });

    return NextResponse.json(result);
  } catch (err) {
    console.error("STICKER PRICING ERROR:", err);

    return NextResponse.json(
      {
        error: "Error saving pricing",
      },
      {
        status: 500,
      },
    );
  }
}
