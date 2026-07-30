import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_PRICING = {
  paperCostPerSheet: 0.45,
  printingCostPerSheet: 0.55,
  cutCostPerSheet: 0.2,
  ticketsPerSheet: 8,
  wastePercent: 10,

  setupFee: 10,

  numberingSetupFee: 10,
  numberingCostPerTicket: 0.02,

  perforationSetupFee: 10,
  perforationCostPerTicket: 0.03,

  bookletCost: 2,
  defaultTicketsPerBook: 50,

  printReadyDesignFee: 0,
  basicDesignFee: 25,
  fullDesignFee: 50,

  profitMargin: 50,
};

const DECIMAL_FIELDS = [
  "paperCostPerSheet",
  "printingCostPerSheet",
  "cutCostPerSheet",
  "wastePercent",
  "setupFee",
  "numberingSetupFee",
  "numberingCostPerTicket",
  "perforationSetupFee",
  "perforationCostPerTicket",
  "bookletCost",
  "printReadyDesignFee",
  "basicDesignFee",
  "fullDesignFee",
  "profitMargin",
];

const INTEGER_FIELDS = ["ticketsPerSheet", "defaultTicketsPerBook"];

// ==========================================================
// GET - Obtener configuración
// ==========================================================
export async function GET() {
  try {
    let pricing = await prisma.raffleTicketPricing.findFirst({
      orderBy: {
        createdAt: "asc",
      },
    });

    // Crea automáticamente los valores iniciales
    if (!pricing) {
      pricing = await prisma.raffleTicketPricing.create({
        data: DEFAULT_PRICING,
      });
    }

    return NextResponse.json(pricing);
  } catch (error) {
    console.error("Error loading raffle ticket pricing:", error);

    return NextResponse.json(
      {
        error: "Unable to load raffle ticket pricing.",
      },
      { status: 500 },
    );
  }
}

// ==========================================================
// PUT - Guardar configuración
// ==========================================================
export async function PUT(request) {
  try {
    const body = await request.json();
    const data = {};

    for (const field of DECIMAL_FIELDS) {
      const value = Number(body[field]);

      if (!Number.isFinite(value) || value < 0) {
        return NextResponse.json(
          {
            error: `Invalid value for ${field}.`,
          },
          { status: 400 },
        );
      }

      data[field] = value;
    }

    for (const field of INTEGER_FIELDS) {
      const value = Number(body[field]);

      if (!Number.isInteger(value) || value <= 0) {
        return NextResponse.json(
          {
            error: `Invalid value for ${field}.`,
          },
          { status: 400 },
        );
      }

      data[field] = value;
    }

    if (data.wastePercent > 100) {
      return NextResponse.json(
        {
          error: "Waste percentage cannot exceed 100%.",
        },
        { status: 400 },
      );
    }

    if (data.profitMargin >= 100) {
      return NextResponse.json(
        {
          error: "Profit margin must be lower than 100%.",
        },
        { status: 400 },
      );
    }

    const existingPricing = await prisma.raffleTicketPricing.findFirst({
      orderBy: {
        createdAt: "asc",
      },
    });

    const pricing = existingPricing
      ? await prisma.raffleTicketPricing.update({
          where: {
            id: existingPricing.id,
          },
          data,
        })
      : await prisma.raffleTicketPricing.create({
          data,
        });

    return NextResponse.json({
      success: true,
      pricing,
    });
  } catch (error) {
    console.error("Error saving raffle ticket pricing:", error);

    return NextResponse.json(
      {
        error: "Unable to save raffle ticket pricing.",
      },
      { status: 500 },
    );
  }
}
