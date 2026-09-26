export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import prisma from "@/lib/db";

/* ======================================================
   HELPERS
====================================================== */

function toNumber(value) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
}

function calculateCosts(data) {
  const unitType = String(data.unitType || "").toLowerCase();

  const rollWidthIn = toNumber(data.rollWidthIn);
  const rollLengthFt = toNumber(data.rollLengthFt);
  const rollCost = toNumber(data.rollCost);

  const sheetWidthIn = toNumber(data.sheetWidthIn);
  const sheetHeightIn = toNumber(data.sheetHeightIn);
  const sheetsPerPack = toNumber(data.sheetsPerPack);
  const packCost = toNumber(data.packCost);

  const unitCost = toNumber(data.unitCost);

  let costPerSqft = 0;
  let costPerLinearFt = null;
  let costPerSheet = null;
  let costPerUnit = null;

  /* ==========================
     ROLL
  ========================== */

  if (unitType === "roll") {
    if (
      rollWidthIn &&
      rollLengthFt &&
      rollCost !== null &&
      rollWidthIn > 0 &&
      rollLengthFt > 0
    ) {
      const widthFt = rollWidthIn / 12;
      const totalSqft = widthFt * rollLengthFt;

      costPerSqft = totalSqft > 0 ? rollCost / totalSqft : 0;
      costPerLinearFt = rollLengthFt > 0 ? rollCost / rollLengthFt : null;
    }
  }

  /* ==========================
     SHEET / PACK
  ========================== */

  if (unitType === "sheet" || unitType === "pack") {
    if (packCost !== null && packCost >= 0) {
      const sheetCount = sheetsPerPack && sheetsPerPack > 0 ? sheetsPerPack : 1;

      costPerSheet = packCost / sheetCount;

      if (
        sheetWidthIn &&
        sheetHeightIn &&
        sheetWidthIn > 0 &&
        sheetHeightIn > 0
      ) {
        const sheetSqft = (sheetWidthIn * sheetHeightIn) / 144;

        costPerSqft = sheetSqft > 0 ? costPerSheet / sheetSqft : 0;
      }
    }
  }

  /* ==========================
     EACH
  ========================== */

  if (unitType === "each") {
    if (unitCost !== null && unitCost >= 0) {
      costPerUnit = unitCost;
    }
  }

  return {
    costPerSqft,
    costPerLinearFt,
    costPerSheet,
    costPerUnit,
  };
}

/* ======================================================
   GET — LIST MATERIALS
====================================================== */

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search")?.trim() || "";
    const category = searchParams.get("category")?.trim() || "";
    const active = searchParams.get("active");

    const where = {};

    if (search) {
      where.OR = [
        {
          name: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          category: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          brand: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          type: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          color: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          supplier: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          sku: {
            contains: search,
            mode: "insensitive",
          },
        },
      ];
    }

    if (category && category !== "all") {
      where.category = category;
    }

    if (active === "true") {
      where.active = true;
    }

    if (active === "false") {
      where.active = false;
    }

    const materials = await prisma.material.findMany({
      where,
      orderBy: [
        {
          category: "asc",
        },
        {
          name: "asc",
        },
      ],
    });

    return NextResponse.json({
      materials,
    });
  } catch (error) {
    console.error("GET /api/materials error:", error);

    return NextResponse.json(
      {
        error: "Unable to load materials.",
      },
      {
        status: 500,
      },
    );
  }
}

/* ======================================================
   POST — CREATE MATERIAL
====================================================== */

export async function POST(req) {
  try {
    const body = await req.json();

    const name = String(body.name || "").trim();
    const category = String(body.category || "").trim();
    const unitType = String(body.unitType || "")
      .trim()
      .toLowerCase();

    if (!name) {
      return NextResponse.json(
        {
          error: "Material name is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (!category) {
      return NextResponse.json(
        {
          error: "Category is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (!["roll", "sheet", "pack", "each"].includes(unitType)) {
      return NextResponse.json(
        {
          error: "Invalid purchase unit.",
        },
        {
          status: 400,
        },
      );
    }

    const rollWidthIn = toNumber(body.rollWidthIn);
    const rollLengthFt = toNumber(body.rollLengthFt);
    const rollCost = toNumber(body.rollCost);

    const sheetWidthIn = toNumber(body.sheetWidthIn);
    const sheetHeightIn = toNumber(body.sheetHeightIn);
    const sheetsPerPack = toNumber(body.sheetsPerPack);
    const packCost = toNumber(body.packCost);

    const unitCost = toNumber(body.unitCost);

    /* ==========================
       VALIDATE ROLL
    ========================== */

    if (unitType === "roll") {
      if (!rollWidthIn || rollWidthIn <= 0) {
        return NextResponse.json(
          {
            error: "Roll width is required.",
          },
          {
            status: 400,
          },
        );
      }

      if (!rollLengthFt || rollLengthFt <= 0) {
        return NextResponse.json(
          {
            error: "Roll length is required.",
          },
          {
            status: 400,
          },
        );
      }

      if (rollCost === null || rollCost < 0) {
        return NextResponse.json(
          {
            error: "Roll cost is required.",
          },
          {
            status: 400,
          },
        );
      }
    }

    /* ==========================
       VALIDATE SHEET / PACK
    ========================== */

    if (unitType === "sheet" || unitType === "pack") {
      if (!sheetWidthIn || sheetWidthIn <= 0) {
        return NextResponse.json(
          {
            error: "Sheet width is required.",
          },
          {
            status: 400,
          },
        );
      }

      if (!sheetHeightIn || sheetHeightIn <= 0) {
        return NextResponse.json(
          {
            error: "Sheet height is required.",
          },
          {
            status: 400,
          },
        );
      }

      if (unitType === "pack" && (!sheetsPerPack || sheetsPerPack <= 0)) {
        return NextResponse.json(
          {
            error: "Sheets per pack is required.",
          },
          {
            status: 400,
          },
        );
      }

      if (packCost === null || packCost < 0) {
        return NextResponse.json(
          {
            error: "Purchase cost is required.",
          },
          {
            status: 400,
          },
        );
      }
    }

    /* ==========================
       VALIDATE EACH
    ========================== */

    if (unitType === "each") {
      if (unitCost === null || unitCost < 0) {
        return NextResponse.json(
          {
            error: "Unit cost is required.",
          },
          {
            status: 400,
          },
        );
      }
    }

    const calculated = calculateCosts({
      unitType,
      rollWidthIn,
      rollLengthFt,
      rollCost,
      sheetWidthIn,
      sheetHeightIn,
      sheetsPerPack: unitType === "sheet" ? 1 : sheetsPerPack,
      packCost,
      unitCost,
    });

    const material = await prisma.material.create({
      data: {
        name,
        category,
        unitType,

        brand: body.brand?.trim() || null,
        type: body.type?.trim() || null,
        finish: body.finish?.trim() || null,
        color: body.color?.trim() || null,
        sku: body.sku?.trim() || null,
        supplier: body.supplier?.trim() || null,

        rollWidthIn: unitType === "roll" ? rollWidthIn : null,

        rollLengthFt: unitType === "roll" ? rollLengthFt : null,

        rollCost: unitType === "roll" ? rollCost : null,

        sheetWidthIn:
          unitType === "sheet" || unitType === "pack" ? sheetWidthIn : null,

        sheetHeightIn:
          unitType === "sheet" || unitType === "pack" ? sheetHeightIn : null,

        sheetsPerPack:
          unitType === "pack"
            ? Math.round(sheetsPerPack)
            : unitType === "sheet"
              ? 1
              : null,

        packCost: unitType === "sheet" || unitType === "pack" ? packCost : null,

        unitCost: unitType === "each" ? unitCost : null,

        costPerSqft: calculated.costPerSqft,
        costPerLinearFt: calculated.costPerLinearFt,
        costPerSheet: calculated.costPerSheet,
        costPerUnit: calculated.costPerUnit,

        sellPerSqft: toNumber(body.sellPerSqft) ?? 0,

        wastePercent: toNumber(body.wastePercent) ?? 0,

        notes: body.notes?.trim() || null,

        active: body.active === undefined ? true : Boolean(body.active),
      },
    });

    return NextResponse.json(
      {
        material,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("POST /api/materials error:", error);

    return NextResponse.json(
      {
        error: "Unable to create material.",
      },
      {
        status: 500,
      },
    );
  }
}
