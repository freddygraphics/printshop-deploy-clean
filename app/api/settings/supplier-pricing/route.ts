import { NextResponse } from "next/server";

import prisma from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/* =====================================================
   GET
===================================================== */

export async function GET(req: Request) {
  try {
    const { searchParams } =
      new URL(req.url);

    const supplier =
      searchParams.get("supplier");

    if (!supplier) {
      return NextResponse.json(
        {
          success: false,
          error: "Supplier is required",
        },
        {
          status: 400,
        },
      );
    }

    const normalizedSupplier =
      supplier.trim();

    let settings =
      await prisma.supplierPricingSettings.findUnique({
        where: {
          supplier:
            normalizedSupplier,
        },
      });

    /*
     * Si el proveedor todavía no tiene
     * configuración, creamos 50% por defecto.
     */
    if (!settings) {
      settings =
        await prisma.supplierPricingSettings.create({
          data: {
            supplier:
              normalizedSupplier,
            markup: 50,
          },
        });
    }

    return NextResponse.json({
      success: true,
      settings: {
        supplier:
          settings.supplier,

        markup:
          settings.markup,
      },
    });
  } catch (error) {
    console.error(
      "Supplier pricing GET error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to load supplier pricing settings",
      },
      {
        status: 500,
      },
    );
  }
}

/* =====================================================
   PUT
===================================================== */

export async function PUT(req: Request) {
  try {
    const body =
      await req.json();

    const supplier =
      String(
        body?.supplier || "",
      ).trim();

    const markup =
      Number(body?.markup);

    if (!supplier) {
      return NextResponse.json(
        {
          success: false,
          error: "Supplier is required",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !Number.isFinite(markup) ||
      markup < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Markup must be zero or greater",
        },
        {
          status: 400,
        },
      );
    }

    const settings =
      await prisma.supplierPricingSettings.upsert({
        where: {
          supplier,
        },

        update: {
          markup,
        },

        create: {
          supplier,
          markup,
        },
      });

    return NextResponse.json({
      success: true,

      settings: {
        supplier:
          settings.supplier,

        markup:
          settings.markup,
      },
    });
  } catch (error) {
    console.error(
      "Supplier pricing PUT error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to save supplier pricing settings",
      },
      {
        status: 500,
      },
    );
  }
}