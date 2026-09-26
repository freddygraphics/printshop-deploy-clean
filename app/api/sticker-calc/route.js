import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { calculateStickerPrice } from "@/lib/stickers/calculateStickerPrice";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const body = await req.json();

    const {
      stickerWidth,
      stickerHeight,
      quantity,
      materialId,
      laminateId,
      laminated,
      cutType,
    } = body;

    const width = Number(stickerWidth);
    const height = Number(stickerHeight);
    const qty = Number(quantity);

    if (
      !Number.isFinite(width) ||
      !Number.isFinite(height) ||
      !Number.isFinite(qty) ||
      width <= 0 ||
      height <= 0 ||
      qty <= 0
    ) {
      return NextResponse.json(
        { error: "Invalid sticker dimensions or quantity." },
        { status: 400 },
      );
    }

    if (!materialId) {
      return NextResponse.json(
        { error: "Select a sticker material." },
        { status: 400 },
      );
    }

    const [material, laminate, settings] = await Promise.all([
      prisma.material.findUnique({
        where: { id: materialId },
      }),

      laminated && laminateId
        ? prisma.material.findUnique({
            where: { id: laminateId },
          })
        : Promise.resolve(null),

      prisma.stickerPricingSettings.findFirst(),
    ]);

    if (!material) {
      return NextResponse.json(
        { error: "Sticker material not found." },
        { status: 404 },
      );
    }

    if (!settings) {
      return NextResponse.json(
        { error: "Sticker pricing settings were not found." },
        { status: 404 },
      );
    }

    if (!material.rollWidthIn || !material.costPerLinearFt) {
      return NextResponse.json(
        {
          error:
            "The selected material needs a roll width and cost per linear foot.",
        },
        { status: 400 },
      );
    }

    const result = calculateStickerPrice({
      stickerWidth: width,
      stickerHeight: height,
      quantity: qty,

      material,
      laminate,

      laminated: Boolean(laminated),
      cutType: cutType || "die-cut",

      settings,
    });

    if (result?.error) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Sticker calculation error:", error);

    return NextResponse.json(
      {
        error: "Unable to calculate sticker price.",
      },
      { status: 500 },
    );
  }
}
