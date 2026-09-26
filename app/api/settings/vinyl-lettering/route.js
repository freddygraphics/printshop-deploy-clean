export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import prisma from "@/lib/db";

/* ======================================================
   HELPERS
====================================================== */

function toNumber(value, fallback = 0) {
  if (value === "" || value === null || value === undefined) {
    return fallback;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : fallback;
}

/* ======================================================
   GET — VINYL LETTERING PRICING
====================================================== */

export async function GET() {
  try {
    let settings = await prisma.vinylLetteringPricing.findFirst({
      orderBy: {
        createdAt: "asc",
      },
    });

    // Create default settings the first time this page is opened
    if (!settings) {
      settings = await prisma.vinylLetteringPricing.create({
        data: {
          minimumOrderPrice: 20,
          setupFee: 0,
          profitMargin: 50,

          cuttingBaseFee: 0,
          cuttingPerSqft: 0,

          easyWeedingPerSqft: 0,
          mediumWeedingPerSqft: 0,
          complexWeedingPerSqft: 0,

          transferTapeCostPerSqft: 0,
          transferTapeMarkup: 0,

          installationMinimum: 0,
          installationPerSqft: 0,

          defaultWastePercent: 10,
        },
      });
    }

    return NextResponse.json({
      settings,
    });
  } catch (error) {
    console.error("GET /api/settings/vinyl-lettering error:", error);

    return NextResponse.json(
      {
        error: "Unable to load vinyl lettering pricing settings.",
      },
      {
        status: 500,
      },
    );
  }
}

/* ======================================================
   PUT — UPDATE VINYL LETTERING PRICING
====================================================== */

export async function PUT(req) {
  try {
    const body = await req.json();

    let settings = await prisma.vinylLetteringPricing.findFirst({
      orderBy: {
        createdAt: "asc",
      },
    });

    const data = {
      minimumOrderPrice: Math.max(0, toNumber(body.minimumOrderPrice)),

      setupFee: Math.max(0, toNumber(body.setupFee)),

      profitMargin: Math.max(0, toNumber(body.profitMargin)),

      cuttingBaseFee: Math.max(0, toNumber(body.cuttingBaseFee)),

      cuttingPerSqft: Math.max(0, toNumber(body.cuttingPerSqft)),

      easyWeedingPerSqft: Math.max(0, toNumber(body.easyWeedingPerSqft)),

      mediumWeedingPerSqft: Math.max(0, toNumber(body.mediumWeedingPerSqft)),

      complexWeedingPerSqft: Math.max(0, toNumber(body.complexWeedingPerSqft)),

      transferTapeCostPerSqft: Math.max(
        0,
        toNumber(body.transferTapeCostPerSqft),
      ),

      transferTapeMarkup: Math.max(0, toNumber(body.transferTapeMarkup)),

      installationMinimum: Math.max(0, toNumber(body.installationMinimum)),

      installationPerSqft: Math.max(0, toNumber(body.installationPerSqft)),

      defaultWastePercent: Math.max(0, toNumber(body.defaultWastePercent)),
    };

    if (!settings) {
      settings = await prisma.vinylLetteringPricing.create({
        data,
      });
    } else {
      settings = await prisma.vinylLetteringPricing.update({
        where: {
          id: settings.id,
        },
        data,
      });
    }

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error("PUT /api/settings/vinyl-lettering error:", error);

    return NextResponse.json(
      {
        error: "Unable to save vinyl lettering pricing settings.",
      },
      {
        status: 500,
      },
    );
  }
}
