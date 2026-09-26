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

  if (
    unitType === "roll" &&
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

  if (unitType === "each" && unitCost !== null && unitCost >= 0) {
    costPerUnit = unitCost;
  }

  return {
    costPerSqft,
    costPerLinearFt,
    costPerSheet,
    costPerUnit,
  };
}

/* ======================================================
   GET — SINGLE MATERIAL
====================================================== */

export async function GET(req, ctx) {
  try {
    const { id } = await ctx.params;

    const material = await prisma.material.findUnique({
      where: { id },
    });

    if (!material) {
      return NextResponse.json(
        { error: "Material not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ material });
  } catch (error) {
    console.error("GET /api/materials/[id] error:", error);

    return NextResponse.json(
      { error: "Unable to load material." },
      { status: 500 },
    );
  }
}

/* ======================================================
   PUT — UPDATE MATERIAL
====================================================== */

export async function PUT(req, ctx) {
  try {
    const { id } = await ctx.params;
    const body = await req.json();

    const existing = await prisma.material.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Material not found." },
        { status: 404 },
      );
    }

    const name = String(body.name || "").trim();
    const category = String(body.category || "").trim();
    const unitType = String(body.unitType || "")
      .trim()
      .toLowerCase();

    if (!name) {
      return NextResponse.json(
        { error: "Material name is required." },
        { status: 400 },
      );
    }

    if (!category) {
      return NextResponse.json(
        { error: "Category is required." },
        { status: 400 },
      );
    }

    if (!["roll", "sheet", "pack", "each"].includes(unitType)) {
      return NextResponse.json(
        { error: "Invalid purchase unit." },
        { status: 400 },
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
       VALIDATION
    ========================== */

    if (unitType === "roll") {
      if (!rollWidthIn || rollWidthIn <= 0) {
        return NextResponse.json(
          { error: "Roll width is required." },
          { status: 400 },
        );
      }

      if (!rollLengthFt || rollLengthFt <= 0) {
        return NextResponse.json(
          { error: "Roll length is required." },
          { status: 400 },
        );
      }

      if (rollCost === null || rollCost < 0) {
        return NextResponse.json(
          { error: "Roll cost is required." },
          { status: 400 },
        );
      }
    }

    if (unitType === "sheet" || unitType === "pack") {
      if (!sheetWidthIn || sheetWidthIn <= 0) {
        return NextResponse.json(
          { error: "Sheet width is required." },
          { status: 400 },
        );
      }

      if (!sheetHeightIn || sheetHeightIn <= 0) {
        return NextResponse.json(
          { error: "Sheet height is required." },
          { status: 400 },
        );
      }

      if (unitType === "pack" && (!sheetsPerPack || sheetsPerPack <= 0)) {
        return NextResponse.json(
          { error: "Sheets per pack is required." },
          { status: 400 },
        );
      }

      if (packCost === null || packCost < 0) {
        return NextResponse.json(
          { error: "Purchase cost is required." },
          { status: 400 },
        );
      }
    }

    if (unitType === "each") {
      if (unitCost === null || unitCost < 0) {
        return NextResponse.json(
          { error: "Unit cost is required." },
          { status: 400 },
        );
      }
    }

    /* ==========================
       CALCULATE COSTS
    ========================== */

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

    /* ==========================
       UPDATE
    ========================== */

    const material = await prisma.material.update({
      where: { id },

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

        active:
          body.active === undefined ? existing.active : Boolean(body.active),
      },
    });

    return NextResponse.json({ material });
  } catch (error) {
    console.error("PUT /api/materials/[id] error:", error);

    return NextResponse.json(
      { error: "Unable to update material." },
      { status: 500 },
    );
  }
}

/* ======================================================
   DELETE — DELETE MATERIAL
====================================================== */

export async function DELETE(req, ctx) {
  try {
    const { id } = await ctx.params;

    const existing = await prisma.material.findUnique({
      where: { id },

      include: {
        _count: {
          select: {
            printProductionProfiles: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Material not found." },
        { status: 404 },
      );
    }

    /*
      If another production profile is using this material,
      don't physically delete it. Deactivate it instead.
    */

    if (existing._count.printProductionProfiles > 0) {
      const material = await prisma.material.update({
        where: { id },
        data: {
          active: false,
        },
      });

      return NextResponse.json({
        success: true,
        deactivated: true,
        material,
        message:
          "Material is being used by a production profile and was deactivated instead of deleted.",
      });
    }

    await prisma.material.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      deleted: true,
    });
  } catch (error) {
    console.error("DELETE /api/materials/[id] error:", error);

    return NextResponse.json(
      { error: "Unable to delete material." },
      { status: 500 },
    );
  }
}
